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
    assert "token" in reg_data
    assert reg_data["email"] == "test@example.com"
    token = reg_data["token"]

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
    # Register & Login
    reg = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    token = reg.json()["token"]

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

    # Register & Login
    reg = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    token = reg.json()["token"]

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
