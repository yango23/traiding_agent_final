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

def _extract_api_key(authorization: str | None) -> str | None:
    """Extract a valid Bearer token from the Authorization header, or return None."""
    if authorization and authorization.startswith("Bearer "):
        key = authorization.split(" ", 1)[1].strip()
        if key and key != "undefined":
            return key
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
async def get_market_data(coin_id: str, lang: str = "ru", force_refresh: bool = False):
    """
    Returns full market data, indicators, and news for a specific coin.
    Used by the dashboard to render details under the chart.
    """
    try:
        coin_data = await fetch_coin_data(coin_id, force_refresh=force_refresh)
        indicators = await calculate_technical_indicators(coin_data["price"], coin_id, lang)
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
async def get_ai_summary(request: SummaryRequest, authorization: str = Header(None)):
    """
    Generates a structured educational AI summary for the coin.
    """
    if request.lang not in VALID_LANGS:
        raise HTTPException(status_code=400, detail="Invalid language selected")
    
    custom_key = _extract_api_key(authorization)
    try:
        summary_text = await generate_coin_summary(
            request.coin_id, 
            request.lang, 
            request.force_refresh, 
            custom_api_key=custom_key
        )
        return {"success": True, "summary": summary_text, "simulated": quota_tracker["quota_exhausted"]}
    except Exception as e:
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
async def chat_endpoint(request: ChatRequest, authorization: str = Header(None)):
    """
    Streams the agent's response via Server-Sent Events (SSE).
    Includes query validation for maximum security.
    """
    custom_key = _extract_api_key(authorization)

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

    # 3. Stream response from Gemini
    quota_tracker["chat_calls"] += 1
    from app.agent import save_quota
    save_quota(quota_tracker)
    async def event_generator():
        try:
            async for chunk in chat_with_agent(
                query=request.query,
                history=request.history,
                coin_id=request.coin_id,
                lang=request.lang,
                custom_api_key=custom_key
            ):
                # Send chunks as JSON
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            # Signal stream completion
            yield "data: [DONE]\n\n"
        except Exception as e:
            err_msg = f"Error generating response: {str(e)}"
            yield f"data: {json.dumps({'error': err_msg})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

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
