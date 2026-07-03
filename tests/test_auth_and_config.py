import pytest
import sqlite3
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.fast_api_app import app
from app.db import DB_FILE

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db_fixture():
    # Setup: ensure user doesn't exist or DB is fresh
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions")
    cursor.execute("DELETE FROM indicator_configs")
    cursor.execute("DELETE FROM chat_history")
    cursor.execute("DELETE FROM users WHERE email = 'test@example.com' OR email = 'duplicate@example.com'")
    conn.commit()
    conn.close()
    yield

def test_user_registration_and_login():
    # 1. Register user
    reg_response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    assert reg_response.status_code == 200
    reg_data = reg_response.json()
    assert reg_data["success"] is True
    assert reg_data["email"] == "test@example.com"

    # 1.5 Short password registration should fail
    short_pwd_resp = client.post(
        "/api/auth/register",
        json={"email": "short@example.com", "password": "1234"}
    )
    assert short_pwd_resp.status_code == 400
    assert "at least 6 characters" in short_pwd_resp.json()["detail"]

    # 1.7 Confirm email to get token
    conf_response = client.post(
        "/api/auth/confirm",
        json={"email": "test@example.com", "code": "777777"}
    )
    assert conf_response.status_code == 200
    conf_data = conf_response.json()
    assert conf_data["success"] is True
    assert "token" in conf_data
    token = conf_data["token"]

    # 2. Duplicate registration should fail
    dup_response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "anotherpassword"}
    )
    assert dup_response.status_code == 400
    assert "already registered" in dup_response.json()["detail"]

    # 3. Access /api/auth/me
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "test@example.com"

    # 4. Login user
    login_response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    assert login_response.status_code == 200
    assert login_response.json()["success"] is True
    assert "token" in login_response.json()

    # 5. Invalid credentials login should fail
    bad_login = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"}
    )
    assert bad_login.status_code == 400
    assert "Invalid email or password" in bad_login.json()["detail"]

    # 6. Logout
    logout_response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert logout_response.status_code == 200
    
    # After logout, token must be invalid
    me_after = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_after.status_code == 401

def test_user_indicator_settings():
    # Register & Confirm
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    conf = client.post(
        "/api/auth/confirm",
        json={"email": "test@example.com", "code": "777777"}
    )
    token = conf.json()["token"]

    # Save Custom Indicator Config
    config_payload = {
        "rsi_length": 9,
        "rsi_overbought": 80,
        "rsi_oversold": 20,
        "sma_fast": 20,
        "sma_slow": 100,
        "bb_length": 15,
        "bb_stddev": 1.5,
        "macd_fast": 8,
        "macd_slow": 17,
        "macd_signal": 5
    }
    save_resp = client.post(
        "/api/user/indicators",
        json=config_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert save_resp.status_code == 200
    assert save_resp.json()["success"] is True

    # Retrieve indicator configurations
    get_resp = client.get(
        "/api/user/indicators",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_resp.status_code == 200
    get_data = get_resp.json()
    assert get_data["success"] is True
    assert get_data["config"]["rsi_length"] == 9
    assert get_data["config"]["rsi_overbought"] == 80
    assert get_data["config"]["macd_slow"] == 17

@patch("app.fast_api_app.chat_with_agent")
def test_user_chat_history_sync(mock_chat):
    # Mock chat generator
    async def mock_generator(*args, **kwargs):
        yield "AI reply chunk 1"
        yield " AI reply chunk 2"
    mock_chat.return_value = mock_generator()

    # Register & Confirm
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    conf = client.post(
        "/api/auth/confirm",
        json={"email": "test@example.com", "code": "777777"}
    )
    token = conf.json()["token"]

    # Send Chat Message
    chat_resp = client.post(
        "/api/chat",
        json={
            "query": "Hello AI",
            "history": [],
            "coin_id": "bitcoin",
            "lang": "en"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert chat_resp.status_code == 200
    
    # Read streamed SSE lines to ensure generator gets consumed and saved
    lines = [line for line in chat_resp.iter_lines() if line]
    assert len(lines) >= 3

    # Check chat history endpoint
    hist_resp = client.get(
        "/api/user/chat-history/bitcoin",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert hist_data["success"] is True
    
    # We expect 2 messages: user's query and model's reply
    assert len(hist_data["history"]) == 2
    assert hist_data["history"][0]["role"] == "user"
    assert hist_data["history"][0]["content"] == "Hello AI"
    assert hist_data["history"][1]["role"] == "model"
    assert hist_data["history"][1]["content"] == "AI reply chunk 1 AI reply chunk 2"

    # Clear chat history
    clear_resp = client.post(
        "/api/user/chat-history/clear/bitcoin",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert clear_resp.status_code == 200

    # Retrieve again, should be empty
    hist_after = client.get(
        "/api/user/chat-history/bitcoin",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert len(hist_after.json()["history"]) == 0

def test_quiz_progress_sync():
    # Register & Confirm
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    conf = client.post(
        "/api/auth/confirm",
        json={"email": "test@example.com", "code": "777777"}
    )
    token = conf.json()["token"]

    # 1. Fetch initial quiz progress (should be empty/new)
    get_resp = client.get(
        "/api/user/quiz",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["quiz"]["score"] == 0
    assert get_resp.json()["quiz"]["answered_questions"] == []

    # 2. Save quiz progress
    save_resp = client.post(
        "/api/user/quiz",
        json={"score": 10, "answered_questions": [1, 2, 3]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert save_resp.status_code == 200
    assert save_resp.json()["success"] is True

    # 3. Retrieve and assert updated progress
    get_resp2 = client.get(
        "/api/user/quiz",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_resp2.status_code == 200
    assert get_resp2.json()["quiz"]["score"] == 10
    assert get_resp2.json()["quiz"]["answered_questions"] == [1, 2, 3]

def test_studied_indicators():
    # Register & Confirm
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    conf = client.post(
        "/api/auth/confirm",
        json={"email": "test@example.com", "code": "777777"}
    )
    token = conf.json()["token"]

    # 1. Fetch initial studied list (empty)
    get_resp = client.get(
        "/api/user/studied-indicators",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["indicators"] == []

    # 2. Add a studied indicator
    add_resp = client.post(
        "/api/user/studied-indicators",
        json={"indicator_name": "rsi"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert add_resp.status_code == 200
    assert add_resp.json()["success"] is True

    # 3. Assert it is present in list
    get_resp2 = client.get(
        "/api/user/studied-indicators",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_resp2.json()["indicators"] == ["rsi"]

def test_tradingview_settings():
    # Register & Confirm
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    conf = client.post(
        "/api/auth/confirm",
        json={"email": "test@example.com", "code": "777777"}
    )
    token = conf.json()["token"]

    # 1. Fetch initial settings (empty / defaults)
    get_resp = client.get(
        "/api/user/tradingview-settings",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["settings"] == {"interval": "D", "style": "1"}

    # 2. Save settings
    save_resp = client.post(
        "/api/user/tradingview-settings",
        json={"interval": "240", "style": "8"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert save_resp.status_code == 200
    assert save_resp.json()["success"] is True

    # 3. Retrieve settings
    get_resp2 = client.get(
        "/api/user/tradingview-settings",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_resp2.status_code == 200
    assert get_resp2.json()["settings"]["interval"] == "240"
    assert get_resp2.json()["settings"]["style"] == "8"

def test_api_keys_manager():
    # Register & Confirm
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    conf = client.post(
        "/api/auth/confirm",
        json={"email": "test@example.com", "code": "777777"}
    )
    token = conf.json()["token"]

    # 1. Add key 1
    add_resp1 = client.post(
        "/api/user/api-keys",
        json={"api_key": "key_content_one_123"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert add_resp1.status_code == 200
    key1_id = add_resp1.json()["key"]["id"]
    assert add_resp1.json()["key"]["is_active"] == 1 # First key should be active by default

    # 2. Add key 2
    add_resp2 = client.post(
        "/api/user/api-keys",
        json={"api_key": "key_content_two_456"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert add_resp2.status_code == 200
    key2_id = add_resp2.json()["key"]["id"]
    assert add_resp2.json()["key"]["is_active"] == 0

    # 3. List keys
    list_resp = client.get(
        "/api/user/api-keys",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert list_resp.status_code == 200
    keys = list_resp.json()["keys"]
    assert len(keys) == 2
    assert keys[0]["api_key"] == "key_content_one_123"
    assert keys[0]["is_active"] == 1
    assert keys[1]["api_key"] == "key_content_two_456"
    assert keys[1]["is_active"] == 0

    # 4. Activate key 2
    act_resp = client.post(
        f"/api/user/api-keys/activate/{key2_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert act_resp.status_code == 200

    # 5. List keys again, check key 2 is active and key 1 is inactive
    list_resp2 = client.get(
        "/api/user/api-keys",
        headers={"Authorization": f"Bearer {token}"}
    )
    keys2 = list_resp2.json()["keys"]
    assert keys2[0]["is_active"] == 0
    assert keys2[1]["is_active"] == 1

    # 6. Delete key 1
    del_resp = client.delete(
        f"/api/user/api-keys/{key1_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert del_resp.status_code == 200

    # 7. Check list has only 1 key
    list_resp3 = client.get(
        "/api/user/api-keys",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert len(list_resp3.json()["keys"]) == 1
    assert list_resp3.json()["keys"][0]["id"] == key2_id

def test_google_auth():
    # 1. Fetch Google auth config
    conf_resp = client.get("/api/auth/google/config")
    assert conf_resp.status_code == 200
    assert "client_id" in conf_resp.json()
    
    # 2. Authenticate using a mock Google token
    auth_resp = client.post(
        "/api/auth/google",
        json={"credential": "mock_google_token_new_google_user@example.com"}
    )
    assert auth_resp.status_code == 200
    data = auth_resp.json()
    assert data["success"] is True
    assert "token" in data
    assert data["email"] == "new_google_user@example.com"
    token = data["token"]
    
    # 3. Check access to /api/auth/me with the token
    me_resp = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "new_google_user@example.com"
