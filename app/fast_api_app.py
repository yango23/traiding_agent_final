import os
import json
from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.tools import fetch_coin_data, fetch_crypto_news, calculate_technical_indicators
from app.agent import chat_with_agent, generate_coin_summary, is_query_safe

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

# -------------------------------------------------------------------------
# Static File Routing
# -------------------------------------------------------------------------
# Locate directories relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# -------------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------------

@app.get("/api/market-data/{coin_id}")
async def get_market_data(coin_id: str, lang: str = "ru"):
    """
    Returns full market data, indicators, and news for a specific coin.
    Used by the dashboard to render details under the chart.
    """
    try:
        coin_data = await fetch_coin_data(coin_id)
        indicators = calculate_technical_indicators(coin_data["price"], coin_id, lang)
        news = await fetch_crypto_news(coin_id, lang)
        
        return {
            "success": True,
            "market_data": coin_data,
            "indicators": indicators,
            "news": news
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

@app.post("/api/summary")
async def get_ai_summary(request: SummaryRequest):
    """
    Generates a structured educational AI summary for the coin.
    """
    try:
        summary_text = await generate_coin_summary(request.coin_id, request.lang)
        return {"success": True, "summary": summary_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Streams the agent's response via Server-Sent Events (SSE).
    Includes query validation for maximum security.
    """
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
    # (Checking if user is asking about other coins in the current chat session)
    query_lower = request.query.lower()
    active_coin = request.coin_id.lower().strip()
    
    # Simple check: if they mention other major coins and not the active one
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
        # If they ask about another coin, gently redirect them
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
    async def event_generator():
        try:
            async for chunk in chat_with_agent(
                query=request.query,
                history=request.history,
                coin_id=request.coin_id,
                lang=request.lang
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
