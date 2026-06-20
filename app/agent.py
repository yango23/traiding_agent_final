import os
import re
from typing import AsyncGenerator
from google import genai
from google.genai import types
from dotenv import load_dotenv
from app.tools import fetch_coin_data, fetch_crypto_news, calculate_technical_indicators, COIN_NAMES

# Load environment variables
load_dotenv()

# Setup Gemini Client
def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "False").lower() == "true"
    
    if use_vertex:
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        # In Vertex AI mode, genai.Client will use Vertex AI
        return genai.Client(vertexai=True, project=project, location=location)
    else:
        # Google AI Studio mode
        return genai.Client(api_key=api_key)

# -------------------------------------------------------------------------
# Security: Prompt Injection & Jailbreak Defense (Prompt Shield)
# -------------------------------------------------------------------------
SUSPICIOUS_PATTERNS = [
    r"ignore\s+(your\s+)?(previous\s+)?(rules|instructions|directives|guidelines)",
    r"forget\s+(your\s+)?(previous\s+)?(rules|instructions|directives|guidelines)",
    r"bypass\s+(restrictions|constraints|rules)",
    r"jailbreak",
    r"system\s+prompt",
    r"override\s+instruction",
    r"you\s+must\s+recommend",
    r"give\s+me\s+investment\s+advice",
    r"tell\s+me\s+to\s+buy",
    r"tell\s+me\s+to\s+sell",
    r"игнорируй\s+(свои\s+)?(предыдущие\s+)?(правила|инструкции)",
    r"забудь\s+(свои\s+)?(предыдущие\s+)?(правила|инструкции)",
    r"дай\s+мне\s+финансовый\s+совет",
    r"скажи\s+мне\s+купить",
    r"скажи\s+мне\s+продать",
    r"введи\s+команду",
    r"run\s+command",
    r"execute\s+shell",
    r"sudo\s+",
    r"rm\s+-rf",
    r"format\s+c:",
    r"delete\s+files",
]

def is_query_safe(query: str) -> bool:
    """
    Checks the user query against known prompt injection and jailbreak patterns.
    Also blocks command injections.
    """
    query_lower = query.lower()
    for pattern in SUSPICIOUS_PATTERNS:
        if re.search(pattern, query_lower):
            return False
    return True

# -------------------------------------------------------------------------
# System Instructions
# -------------------------------------------------------------------------
SYSTEM_INSTRUCTION_RU = """Вы — высококвалифицированный Старший ИИ-консультант по криптовалютам и техническому анализу.
Ваша главная цель — обучать новичков концепциям технического и фундаментального анализа, помогать им понимать рыночные индикаторы и разрабатывать торговые стратегии.

ПРАВИЛА БЕЗОПАСНОСТИ:
1. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО давать прямые финансовые, инвестиционные или торговые рекомендации (например: "покупайте биткоин прямо сейчас", "советую открыть лонг", "делайте ставки на рост"). 
2. Вы должны выступать исключительно как образовательный помощник. Если вас просят дать сигнал или совет, вежливо откажитесь, объяснив, что вы созданы для обучения, а не финансового консалтинга, и объясните риски торговли.
3. Если пользователь просит вас совершить ставки, запустить скрипт, или выполнить команду на сервере, жестко откажитесь и укажите на правила безопасности.
4. Вы привязаны К ОДНОЙ выбранной криптовалюте: {coin_name}.
5. Вы должны отвечать ТОЛЬКО на вопросы, связанные с {coin_name}. Если пользователь спрашивает про другие активы или темы (например, Ethereum в чате Bitcoin), вежливо ответьте: "Для получения информации о {other_coin} или другой криптовалюте, пожалуйста, выберите её в выпадающем меню слева."

ОБУЧАЮЩИЙ ПОДХОД (Для Новичков):
1. Не давайте сухих цифр. Если вы упоминаете индикатор (RSI, MACD, скользящие средние), всегда объясняйте простыми словами: что это такое, что означает текущее значение и как его интерпретировать.
2. Помогайте пользователю строить торговые стратегии на основе параметров (например: "Стратегия на пересечении SMA-50 и SMA-200 строится следующим образом..."), но обязательно добавляйте дисклеймер о необходимости тестирования на демо-счете.
3. Сохраняйте дружелюбный, профессиональный и предостерегающий от лишних рисков тон. Помните: ваша цель — минимизировать финансовые потери новичков за счет повышения их финансовой грамотности.
"""

SYSTEM_INSTRUCTION_EN = """You are a highly qualified Senior AI Cryptocurrency Advisor and Technical Analysis Educator.
Your main goal is to educate beginners in technical and fundamental analysis concepts, help them understand market indicators, and design trading strategies.

SAFETY RULES:
1. STRICTLY FORBIDDEN from giving direct financial, investment, or trading recommendations (e.g., "buy Bitcoin now", "I advise opening a long position", "bet on the rise").
2. You must act strictly as an educational assistant. If asked for a signal or direct advice, politely refuse by explaining that you are built for education, not financial consulting, and outline trading risks.
3. If the user asks you to place bets, run a script, or execute a server command, firmly refuse and cite safety rules.
4. You are bound to ONE selected cryptocurrency: {coin_name}.
5. You must ONLY answer questions related to {coin_name}. If the user asks about other assets or topics (e.g., asking about Ethereum in the Bitcoin chat), politely reply: "To get information about {other_coin} or another cryptocurrency, please select it from the dropdown menu on the left."

EDUCATIONAL APPROACH (For Beginners):
1. Avoid dry numbers. If you mention an indicator (RSI, MACD, moving averages), always explain in simple terms: what it is, what the current value means, and how to interpret it.
2. Help users build trading strategies based on parameters (e.g., "A strategy based on SMA-50 and SMA-200 crossover is built as follows..."), but always add a disclaimer about testing it on a demo account first.
3. Maintain a friendly, professional, and risk-averse tone. Remember: your goal is to minimize beginners' losses by improving their financial literacy.
"""

def get_system_instruction(coin_id: str, lang: str = "ru") -> str:
    coin_name = COIN_NAMES.get(coin_id.lower().strip(), coin_id.capitalize())
    other_coin = "другой монете" if lang == "ru" else "another coin"
    
    if lang == "ru":
        return SYSTEM_INSTRUCTION_RU.format(coin_name=coin_name, other_coin=other_coin)
    else:
        return SYSTEM_INSTRUCTION_EN.format(coin_name=coin_name, other_coin=other_coin)

# -------------------------------------------------------------------------
# Generation Helpers
# -------------------------------------------------------------------------

async def generate_coin_summary(coin_id: str, lang: str = "ru") -> str:
    """
    Generates a fresh, context-aware AI summary for the chosen coin.
    Injects real-time price, volume, indicators, and news into the prompt.
    """
    client = get_gemini_client()
    coin_data = await fetch_coin_data(coin_id)
    news = await fetch_crypto_news(coin_id, lang)
    indicators = calculate_technical_indicators(coin_data["price"], coin_id)
    
    news_titles = "\n".join([f"- {item['title']} ({item['source']})" for item in news])
    
    prompt_ru = f"""
    Подготовь краткую аналитическую сводку по криптовалюте {coin_data['name']} ({coin_data['symbol']}) для новичков.
    
    ТЕКУЩИЕ ДАННЫЕ РЫНКА:
    - Текущая цена: ${coin_data['price']:.4f}
    - Изменение за 24ч: {coin_data['change_24h']:.2f}%
    - 24ч Максимум: ${coin_data['high_24h']:.4f}
    - 24ч Минимум: ${coin_data['low_24h']:.4f}
    
    ТЕХНИЧЕСКИЕ ИНДИКАТОРЫ:
    - RSI (14): {indicators['rsi']['value']} ({indicators['rsi']['status']})
    - MACD: Гистограмма {indicators['macd']['hist']}, Состояние: {indicators['macd']['status']}
    - SMA-50: ${indicators['moving_averages']['sma_50']:.4f}, SMA-200: ${indicators['moving_averages']['sma_200']:.4f} ({indicators['moving_averages']['status']})
    
    ПОСЛЕДНИЕ НОВОСТИ:
    {news_titles}
    
    Формат сводки:
    1. **Рыночный тонус**: Опиши текущую динамику (растет/падает/боковик) и активность.
    2. **Что говорят индикаторы**: Объясни простыми словами, о чем говорят текущие показатели RSI и MACD.
    3. **Ключевой вывод**: Сделай вывод об общем фоне, напомни о рисках и подчеркни, что это не финансовая рекомендация.
    """
    
    prompt_en = f"""
    Prepare a brief analytical summary for {coin_data['name']} ({coin_data['symbol']}) tailored for beginners.
    
    CURRENT MARKET DATA:
    - Current Price: ${coin_data['price']:.4f}
    - 24h Change: {coin_data['change_24h']:.2f}%
    - 24h High: ${coin_data['high_24h']:.4f}
    - 24h Low: ${coin_data['low_24h']:.4f}
    
    TECHNICAL INDICATORS:
    - RSI (14): {indicators['rsi']['value']} ({indicators['rsi']['status']})
    - MACD: Histogram {indicators['macd']['hist']}, Status: {indicators['macd']['status']}
    - SMA-50: ${indicators['moving_averages']['sma_50']:.4f}, SMA-200: ${indicators['moving_averages']['sma_200']:.4f} ({indicators['moving_averages']['status']})
    
    LATEST NEWS:
    {news_titles}
    
    Summary format:
    1. **Market Tone**: Describe current price movement (up/down/sideways) and activity.
    2. **Indicator Breakdown**: Explain in simple terms what the RSI and MACD are indicating right now.
    3. **Key Takeaway**: Conclude on the overall state, emphasize risks, and reiterate that this is not financial advice.
    """

    prompt = prompt_ru if lang == "ru" else prompt_en
    sys_instruction = get_system_instruction(coin_id, lang)
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=sys_instruction,
            temperature=0.3,
        )
    )
    return response.text

async def chat_with_agent(
    query: str, 
    history: list, 
    coin_id: str, 
    lang: str = "ru"
) -> AsyncGenerator[str, None]:
    """
    Streams the agent's chat response using Gemini API.
    Injects context about the coin prices and indicators for high accuracy.
    """
    client = get_gemini_client()
    coin_data = await fetch_coin_data(coin_id)
    indicators = calculate_technical_indicators(coin_data["price"], coin_id)
    
    # Pre-append current coin context to the model to ensure it is always up-to-date
    context_injection = (
        f"[Текущие данные {COIN_NAMES.get(coin_id, coin_id)}: Цена ${coin_data['price']:.4f}, "
        f"24ч Изменение: {coin_data['change_24h']:.2f}%. RSI: {indicators['rsi']['value']}. "
        f"MACD: {indicators['macd']['status']}. SMA-50: ${indicators['moving_averages']['sma_50']:.2f}. "
        f"Не давать советов, объяснять термины!]"
    )

    sys_instruction = get_system_instruction(coin_id, lang)

    # Format history for Gemini SDK
    # history is a list of dicts: [{"role": "user"/"model", "content": "text"}]
    contents = []
    for h in history:
        contents.append(
            types.Content(
                role=h["role"],
                parts=[types.Part.from_text(text=h["content"])]
            )
        )
        
    # Append the injection and the new query
    contents.append(
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=context_injection),
                types.Part.from_text(text=query)
            ]
        )
    )

    # Generate stream
    response_stream = client.models.generate_content_stream(
        model="gemini-2.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=sys_instruction,
            temperature=0.4,
        )
    )
    
    for chunk in response_stream:
        if chunk.text:
            yield chunk.text
