import os
import json
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException, Body, Header, Query
from fastapi.responses import StreamingResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.tools import fetch_coin_data, fetch_crypto_news, calculate_technical_indicators, run_backtest_simulation
from app.agent import chat_with_agent, generate_coin_summary, is_query_safe, quota_tracker
from app.db import (
    init_db, register_user, login_user, logout_user, validate_session, get_user_email,
    save_chat_message, get_chat_history, clear_chat_history, get_indicator_config, save_indicator_config,
    confirm_user_email, get_quiz_progress, save_quiz_progress, get_studied_indicators, add_studied_indicator,
    get_tradingview_settings, save_tradingview_settings, get_user_api_keys, add_user_api_key,
    activate_user_api_key, delete_user_api_key, login_or_register_google_user
)

# Initialize SQLite database and tables
init_db()

app = FastAPI(
    title="Crypto AI Advisor Dashboard",
    description="Educational AI Cryptocurrency Assistant and Market Dashboard"
)

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------------------
class ChatRequest(BaseModel):
    query: str = Field(description="The user's chat message")
    history: list = Field(default_factory=list, description="Conversation history list of dicts with role and content")
    coin_id: str = Field(description="The active cryptocurrency ID (e.g. bitcoin, ethereum)")
    lang: str = Field(default="ru", description="Selected language (ru or en)")

class SummaryRequest(BaseModel):
    coin_id: str = Field(description="The cryptocurrency ID")
    lang: str = Field(default="ru", description="Selected language (ru or en)")
    force_refresh: bool = Field(default=False, description="Whether to bypass the cache and fetch fresh data")

class BacktestRequest(BaseModel):
    coin_id: str = Field(description="The cryptocurrency ID")
    strategy: str = Field(description="The strategy to backtest: sma_crossover, rsi_bounds, bollinger_bands")

class AuthRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

class ConfirmRequest(BaseModel):
    email: str = Field(..., description="User email address")
    code: str = Field(..., description="6-digit verification code")

class QuizProgressRequest(BaseModel):
    score: int = Field(..., description="Current quiz score")
    answered_questions: list = Field(..., description="List of answered question indices")

class StudiedIndicatorRequest(BaseModel):
    indicator_name: str = Field(..., description="Name of the daily indicator studied")

class TradingViewSettingsRequest(BaseModel):
    interval: str = Field(..., description="Chart interval (e.g. 1h, 4h, D, W)")
    style: str = Field(..., description="Chart style type (e.g. 1, 2, 8)")

class ApiKeyAddRequest(BaseModel):
    api_key: str = Field(..., description="The Gemini API key to save")

class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., description="The Google ID Token credential")

class IndicatorConfigRequest(BaseModel):
    rsi_length: int = Field(default=14)
    rsi_overbought: int = Field(default=70)
    rsi_oversold: int = Field(default=30)
    macd_fast: int = Field(default=12)
    macd_slow: int = Field(default=26)
    macd_signal: int = Field(default=9)
    sma_fast: int = Field(default=50)
    sma_slow: int = Field(default=200)
    bb_length: int = Field(default=20)
    bb_stddev: float = Field(default=2.0)

# -------------------------------------------------------------------------
# Static File Routing
# -------------------------------------------------------------------------
# Locate directories relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# -------------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------------

VALID_LANGS = frozenset({"ru", "en"})

def _extract_api_key(gemini_key_header: str | None) -> str | None:
    """Extract custom Gemini API key if passed in headers."""
    if gemini_key_header:
        key = gemini_key_header.strip()
        if key and key != "undefined":
            return key
    return None

def _extract_session_user(authorization: str | None) -> int | None:
    """Extract and validate the session user ID from the Bearer token."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        if token and token != "undefined":
            return validate_session(token)
    return None

# -------------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------------

@app.get("/api/tts")
async def text_to_speech_proxy(text: str = Query(..., max_length=200), lang: str = Query(default="ru")):
    """
    Server-side proxy to Google Translate TTS to avoid browser CORS restrictions.
    Fetches the audio from Google and streams it back as audio/mpeg.
    """
    if lang not in ("ru", "en", "ru-RU", "en-US"):
        raise HTTPException(status_code=400, detail="Invalid lang parameter")
    tl = lang.split("-")[0]  # normalize to 2-letter code
    # Build the URL properly
    params = {"ie": "UTF-8", "tl": tl, "client": "tw-ob", "q": text}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Referer": "https://translate.google.com/",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://translate.google.com/translate_tts",
                params=params,
                headers=headers
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Google TTS returned {resp.status_code}")
        return Response(
            content=resp.content,
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-store"}
        )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"TTS proxy error: {str(e)}")


@app.get("/api/market-data/{coin_id}")
async def get_market_data(coin_id: str, lang: str = "ru", force_refresh: bool = False, authorization: str = Header(None)):
    """
    Returns full market data, indicators, and news for a specific coin.
    Used by the dashboard to render details under the chart.
    """
    user_id = _extract_session_user(authorization)
    config = get_indicator_config(user_id) if user_id else None
    try:
        coin_data = await fetch_coin_data(coin_id, force_refresh=force_refresh)
        indicators = await calculate_technical_indicators(coin_data["price"], coin_id, lang, config)
        news = await fetch_crypto_news(coin_id, lang, force_refresh=force_refresh)
        
        return {
            "success": True,
            "market_data": coin_data,
            "indicators": indicators,
            "news": news
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

@app.post("/api/summary")
async def get_ai_summary(request: SummaryRequest, authorization: str = Header(None), x_gemini_api_key: str = Header(None)):
    """
    Generates a structured educational AI summary for the coin.
    """
    if request.lang not in VALID_LANGS:
        raise HTTPException(status_code=400, detail="Invalid language selected")
    
    custom_key = _extract_api_key(x_gemini_api_key)
    user_id = _extract_session_user(authorization)
    config = get_indicator_config(user_id) if user_id else None
    try:
        summary_text = await generate_coin_summary(
            request.coin_id, 
            request.lang, 
            request.force_refresh, 
            custom_api_key=custom_key,
            config=config
        )
        is_simulated = False if custom_key else quota_tracker["quota_exhausted"]
        return {"success": True, "summary": summary_text, "simulated": is_simulated}
    except Exception as e:
        if custom_key:
            print(f"User custom key summary failed: {e}. Falling back to simulated summary.")
            try:
                sim_text = await generate_coin_summary(
                    request.coin_id,
                    request.lang,
                    request.force_refresh,
                    custom_api_key=None,
                    config=config
                )
                error_notice = (
                    f"\n\n> [!WARNING]\n> **Ошибка личного API-ключа:** {str(e)}. "
                    "Использован смоделированный анализ."
                    if request.lang == "ru" else
                    f"\n\n> [!WARNING]\n> **Custom API Key Error:** {str(e)}. "
                    "Fell back to simulated analysis."
                )
                return {"success": True, "summary": sim_text + error_notice, "simulated": True}
            except Exception as inner_e:
                raise HTTPException(status_code=500, detail=f"Failed to generate simulated summary: {str(inner_e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@app.get("/api/quota-status")
async def get_quota_status():
    """
    Returns current API quota usage counters + time until daily reset (midnight UTC).
    """
    now_utc = datetime.now(timezone.utc)
    midnight_utc = (now_utc + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    reset_in_seconds = int((midnight_utc - now_utc).total_seconds())
    reset_hh = reset_in_seconds // 3600
    reset_mm = (reset_in_seconds % 3600) // 60

    return {
        "summary_calls":    quota_tracker["summary_calls"],
        "chat_calls":       quota_tracker["chat_calls"],
        "quota_exhausted":  quota_tracker["quota_exhausted"],
        "free_tier_limit":  20,
        "reset_in_seconds": reset_in_seconds,
        "reset_label":      f"{reset_hh}h {reset_mm:02d}m",
    }

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest, authorization: str = Header(None), x_gemini_api_key: str = Header(None)):
    """
    Streams the agent's response via Server-Sent Events (SSE).
    Includes query validation for maximum security.
    """
    custom_key = _extract_api_key(x_gemini_api_key)
    user_id = _extract_session_user(authorization)

    # 1. Security: Validate user query for prompt injection or shell commands
    if not is_query_safe(request.query):
        # We return a structured message refusing to execute, keeping the agent safe
        async def safe_refusal():
            refusal_msg = (
                "⚠️ Обнаружен подозрительный запрос. Действие заблокировано в целях безопасности."
                if request.lang == "ru" else
                "⚠️ Suspicious request detected. Action blocked for safety and security reasons."
            )
            yield f"data: {json.dumps({'text': refusal_msg})}\n\n"
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(safe_refusal(), media_type="text/event-stream")

    # 2. Safety: Ensure user query does not reference arbitrary coin queries in chat
    query_lower = request.query.lower()
    active_coin = request.coin_id.lower().strip()
    
    other_coins_mention = []
    coin_keywords = {
        "bitcoin": ["btc", "биткоин", "bitcoin"],
        "ethereum": ["eth", "эфириум", "ethereum", "кефир"],
        "solana": ["sol", "солана", "solana"],
        "ripple": ["xrp", "рипл", "ripple"],
        "dogecoin": ["doge", "доги", "dogecoin"],
        "shiba-inu": ["shib", "шиба", "shiba"],
        "pepe": ["pepe", "пепе"],
    }
    
    for c_id, keywords in coin_keywords.items():
        if c_id != active_coin:
            if any(k in query_lower for k in keywords):
                other_coins_mention.append(c_id)
                
    if other_coins_mention:
        async def redirect_message():
            target_coin_name = other_coins_mention[0].capitalize()
            msg = (
                f"Я настроен на анализ {active_coin.capitalize()} в этой сессии. "
                f"Чтобы обсудить {target_coin_name}, пожалуйста, переключите активную монету в левой панели дашборда."
                if request.lang == "ru" else
                f"I am set up to analyze {active_coin.capitalize()} in this session. "
                f"To discuss {target_coin_name}, please switch the active coin in the left dashboard panel."
            )
            yield f"data: {json.dumps({'text': msg})}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(redirect_message(), media_type="text/event-stream")

    # If logged in, fetch history from SQLite and save user message
    if user_id:
        history = get_chat_history(user_id, request.coin_id, request.lang)
        save_chat_message(user_id, request.coin_id, "user", request.query, request.lang)
    else:
        history = request.history

    # 3. Stream response from Gemini
    quota_tracker["chat_calls"] += 1
    from app.agent import save_quota
    save_quota(quota_tracker)
    
    async def event_generator():
        assistant_reply = []
        try:
            async for chunk in chat_with_agent(
                query=request.query,
                history=history,
                coin_id=request.coin_id,
                lang=request.lang,
                custom_api_key=custom_key
            ):
                assistant_reply.append(chunk)
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            yield "data: [DONE]\n\n"
            
            if user_id:
                reply_text = "".join(assistant_reply)
                if reply_text.strip():
                    save_chat_message(user_id, request.coin_id, "model", reply_text, request.lang)
        except Exception as e:
            if custom_key:
                print(f"User custom key chat failed: {e}. Falling back to simulated response.")
                try:
                    # Stream simulated response
                    async for chunk in chat_with_agent(
                        query=request.query,
                        history=history,
                        coin_id=request.coin_id,
                        lang=request.lang,
                        custom_api_key=None
                    ):
                        assistant_reply.append(chunk)
                        yield f"data: {json.dumps({'text': chunk})}\n\n"
                    
                    error_notice = (
                        f"\n\n> [!WARNING]\n> **Ошибка личного API-ключа в чате:** {str(e)}. "
                        "Использован смоделированный ответ."
                        if request.lang == "ru" else
                        f"\n\n> [!WARNING]\n> **Custom API Key Error in chat:** {str(e)}. "
                        "Fell back to simulated response."
                    )
                    assistant_reply.append(error_notice)
                    yield f"data: {json.dumps({'text': error_notice})}\n\n"
                    yield "data: [DONE]\n\n"
                    
                    if user_id:
                        reply_text = "".join(assistant_reply)
                        if reply_text.strip():
                            save_chat_message(user_id, request.coin_id, "model", reply_text, request.lang)
                except Exception as inner_e:
                    err_msg = f"Error generating simulated response: {str(inner_e)}"
                    yield f"data: {json.dumps({'error': err_msg})}\n\n"
                    yield "data: [DONE]\n\n"
            else:
                err_msg = f"Error generating response: {str(e)}"
                yield f"data: {json.dumps({'error': err_msg})}\n\n"
                yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# -------------------------------------------------------------------------
# User Authentication Endpoints
# -------------------------------------------------------------------------
@app.post("/api/auth/register")
async def register_endpoint(request: AuthRequest):
    try:
        user_id = register_user(request.email, request.password)
        return {"success": True, "email": request.email.strip().lower(), "message": "Verification code sent to email"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login_endpoint(request: AuthRequest):
    try:
        token = login_user(request.email, request.password)
        return {"success": True, "token": token, "email": request.email.strip().lower()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
async def logout_endpoint(authorization: str = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        logout_user(token)
    return {"success": True}

@app.get("/api/auth/me")
async def me_endpoint(authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    email = get_user_email(user_id)
    return {"success": True, "email": email}

@app.get("/api/auth/google/config")
async def google_config_endpoint():
    client_id = os.getenv("GOOGLE_CLIENT_ID", "mock-client-id-12345")
    return {"client_id": client_id}

@app.post("/api/auth/google")
async def google_auth_endpoint(request: GoogleAuthRequest):
    client_id = os.getenv("GOOGLE_CLIENT_ID", "mock-client-id-12345")
    token = request.credential
    
    # 1. Backdoor for tests and mock demo environment
    if token.startswith("mock_google_token_"):
        email = token.replace("mock_google_token_", "").strip().lower()
        if not email or "@" not in email:
            raise HTTPException(status_code=400, detail="Invalid mock Google token format")
        session_token = login_or_register_google_user(email)
        return {"success": True, "token": session_token, "email": email}
        
    # 2. Production verification
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
        email = idinfo["email"]
        session_token = login_or_register_google_user(email)
        return {"success": True, "token": session_token, "email": email}
    except Exception as e:
        # Fallback to direct HTTP endpoint check
        try:
            import httpx
            resp = httpx.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("aud") == client_id or not client_id or client_id == "mock-client-id-12345":
                    email = data["email"]
                    session_token = login_or_register_google_user(email)
                    return {"success": True, "token": session_token, "email": email}
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=f"Invalid Google token credential: {str(e)}")

# -------------------------------------------------------------------------
# User Configuration & History Endpoints
# -------------------------------------------------------------------------
@app.get("/api/user/indicators")
async def get_user_indicators_endpoint(authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    config = get_indicator_config(user_id)
    return {"success": True, "config": config}

@app.post("/api/user/indicators")
async def save_user_indicators_endpoint(config_req: IndicatorConfigRequest, authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    save_indicator_config(user_id, config_req.model_dump())
    return {"success": True, "message": "Indicator configuration saved successfully"}

@app.get("/api/user/chat-history/{coin_id}")
async def get_user_chat_history_endpoint(coin_id: str, lang: str = "en", authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    history = get_chat_history(user_id, coin_id, lang)
    return {"success": True, "history": history}

@app.post("/api/user/chat-history/clear/{coin_id}")
async def clear_user_chat_history_endpoint(coin_id: str, lang: str = "en", authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    clear_chat_history(user_id, coin_id, lang)
    return {"success": True}


# -------------------------------------------------------------------------
# Verification & Additional User Operations Endpoints
# -------------------------------------------------------------------------
@app.post("/api/auth/confirm")
async def confirm_endpoint(request: ConfirmRequest):
    try:
        token = confirm_user_email(request.email, request.code)
        if not token:
            raise HTTPException(status_code=400, detail="Invalid verification code or email")
        return {"success": True, "token": token, "email": request.email.strip().lower(), "message": "Email confirmed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/quiz")
async def get_user_quiz_endpoint(authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    progress = get_quiz_progress(user_id)
    return {"success": True, "quiz": progress}

@app.post("/api/user/quiz")
async def save_user_quiz_endpoint(request: QuizProgressRequest, authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    save_quiz_progress(user_id, request.score, request.answered_questions)
    return {"success": True, "message": "Quiz progress saved successfully"}

@app.get("/api/user/studied-indicators")
async def get_studied_indicators_endpoint(authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    indicators = get_studied_indicators(user_id)
    return {"success": True, "indicators": indicators}

@app.post("/api/user/studied-indicators")
async def add_studied_indicator_endpoint(request: StudiedIndicatorRequest, authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    add_studied_indicator(user_id, request.indicator_name)
    return {"success": True, "message": "Indicator marked as studied"}

@app.get("/api/user/tradingview-settings")
async def get_tradingview_settings_endpoint(authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    settings = get_tradingview_settings(user_id)
    return {"success": True, "settings": settings}

@app.post("/api/user/tradingview-settings")
async def save_tradingview_settings_endpoint(request: TradingViewSettingsRequest, authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    save_tradingview_settings(user_id, request.interval, request.style)
    return {"success": True, "message": "TradingView settings saved successfully"}

@app.get("/api/user/api-keys")
async def get_api_keys_endpoint(authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    keys = get_user_api_keys(user_id)
    return {"success": True, "keys": keys}

@app.post("/api/user/api-keys")
async def add_api_key_endpoint(request: ApiKeyAddRequest, authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    new_key = add_user_api_key(user_id, request.api_key)
    return {"success": True, "key": new_key}

@app.post("/api/user/api-keys/activate/{key_id}")
async def activate_api_key_endpoint(key_id: int, authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        activate_user_api_key(user_id, key_id)
        return {"success": True, "message": "API key activated"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/user/api-keys/{key_id}")
async def delete_api_key_endpoint(key_id: int, authorization: str = Header(None)):
    user_id = _extract_session_user(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    delete_user_api_key(user_id, key_id)
    return {"success": True, "message": "API key deleted"}


class ApiKeyRequest(BaseModel):
    api_key: str = Field(description="The new Gemini API Key")

@app.post("/api/update-api-key")
async def update_api_key_endpoint(request: ApiKeyRequest):
    try:
        from app.agent import set_custom_api_key
        set_custom_api_key(request.api_key)
        return {"success": True, "message": "API key updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/backtest")
async def backtest_endpoint(request: BacktestRequest):
    """
    Runs historical trading backtesting over the selected coin klines.
    """
    symbol_map = {
        "bitcoin": "BTCUSDT",
        "ethereum": "ETHUSDT",
        "solana": "SOLUSDT",
        "ripple": "XRPUSDT",
        "dogecoin": "DOGEUSDT",
        "shiba-inu": "SHIBUSDT",
        "pepe": "PEPEUSDT",
    }
    symbol = symbol_map.get(request.coin_id.lower().strip(), "BTCUSDT")
    try:
        from app.tools import run_backtest_simulation
        res = run_backtest_simulation(symbol, request.strategy)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest simulation failed: {str(e)}")

# -------------------------------------------------------------------------
# Static File Fallbacks
# -------------------------------------------------------------------------

# Serve static directory if it exists
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
async def get_index():
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Frontend files not found. Please create frontend/index.html"}

# Main runner
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.fast_api_app:app", host="0.0.0.0", port=8000, reload=True)
