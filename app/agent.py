import os
import re
import time
import asyncio
from typing import AsyncGenerator
from google import genai
from google.genai import types
from dotenv import load_dotenv
from app.tools import fetch_coin_data, fetch_crypto_news, calculate_technical_indicators, COIN_NAMES

# -------------------------------------------------------------------------
# In-Memory Quota Tracker (Free tier: 20 requests/day per model)
# -------------------------------------------------------------------------
FREE_TIER_LIMIT = 20  # Gemini free tier daily limit

quota_tracker = {
    "summary_calls": 0,
    "chat_calls": 0,
    "quota_exhausted": False,
    "reset_time": None,   # UTC timestamp when quota resets (midnight)
}

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

ПРАВИЛА ОФОРМЛЕНИЯ ТЕКСТА:
Для повышения читаемости текста и выделения важных моментов вы ДОЛЖНЫ использовать специальный синтаксис выделения цветом:
1. Оберните все позитивные, бычьи (bullish), восходящие сигналы, рост цены или зоны перепроданности в `[green]{{текст для выделения зеленым}}`. Пример: "Показатель RSI находится в зоне `[green]{{перепроданности}}`" или "Ожидается `[green]{{бычий прорыв}}`".
2. Оберните все негативные, медвежьи (bearish), нисходящие сигналы, падение цены или зоны перекупленности в `[red]{{текст для выделения красным}}`. Пример: "Импульс сменился на `[red]{{медвежий}}`" или "Индикатор находится в зоне `[red]{{перекупленности}}`".
Никогда не используйте HTML-теги для цвета. Пользуйтесь ТОЛЬКО синтаксисом `[green]{{текст}}` и `[red]{{текст}}`.

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

TEXT FORMATTING RULES:
To improve text readability and emphasize important market events, you MUST use the following custom color highlighting syntax:
1. Wrap positive, bullish, rising price signals, or oversold areas in `[green]{{text to highlight in green}}`. Example: "RSI is in the `[green]{{oversold}}` territory" or "We expect a `[green]{{bullish crossover}}`".
2. Wrap negative, bearish, falling price signals, or overbought areas in `[red]{{text to highlight in red}}`. Example: "The momentum shifted to `[red]{{bearish}}`" or "Indicators show the asset is `[red]{{overbought}}`".
Never use raw HTML tags for coloring. ONLY use `[green]{{text}}` and `[red]{{text}}` tags.

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

def get_simulated_summary(coin_id: str, lang: str = "ru") -> str:
    coin_name = COIN_NAMES.get(coin_id.lower().strip(), coin_id.capitalize())
    
    if lang == "ru":
        return f"""1. **Рыночный тонус**:
Криптовалюта {coin_name} демонстрирует смешанную динамику с умеренной торговой активностью. Наблюдается краткосрочный [green]{{бычий импульс}} с попыткой пробоя уровней локального сопротивления, однако объемы торгов [red]{{ниже среднего}}, что указывает на недостаточное подтверждение со стороны рынка.

2. **Что говорят индикаторы**:
Индикатор **RSI (14)** близок к отметке [red]{{70 (зона перекупленности)}}, что сигнализирует о возможном откате или паузе в росте. Гистограмма **MACD** пересекла сигнальную линию снизу вверх, подтверждая [green]{{положительный краткосрочный импульс}}. Скользящие средние (SMA-50 и SMA-200) удерживают долгосрочный [green]{{бычий тренд}}, однако [red]{{разрыв между ними сокращается}}, что может означать ослабление тренда.

3. **Ключевой вывод**:
Техническая картина по {coin_name} неоднозначна: есть [green]{{позитивные сигналы}} со стороны MACD и долгосрочного тренда, но RSI предупреждает о [red]{{риске коррекции}} в краткосрочной перспективе. Обратите внимание: данные смоделированы в учебных целях из-за временного исчерпания дневной квоты API (20 запросов/день)."""
    else:
        return f"""1. **Market Tone**:
The cryptocurrency {coin_name} is showing mixed dynamics with moderate trading activity. We observe a short-term [green]{{bullish push}} attempting to break through local resistance levels, however trading volumes are [red]{{below average}}, indicating insufficient market confirmation.

2. **Indicator Breakdown**:
The **RSI (14)** is approaching [red]{{overbought territory (near 70)}}, signaling a possible pullback or pause in the uptrend. The **MACD** histogram crossed above the signal line, confirming a [green]{{short-term positive momentum}}. Moving Averages (SMA-50 and SMA-200) maintain a long-term [green]{{bullish trend}}, however [red]{{the gap between them is narrowing}}, which may indicate a weakening trend.

3. **Key Takeaway**:
The technical picture for {coin_name} is mixed: there are [green]{{positive signals}} from the MACD and long-term trend, but the RSI warns of a [red]{{correction risk}} in the short term. Note: This analysis is simulated for educational purposes due to the temporary exhaustion of the daily API quota (20 requests/day)."""

def get_simulated_chat_response(query: str, coin_id: str, lang: str = "ru") -> str:
    coin_name = COIN_NAMES.get(coin_id.lower().strip(), coin_id.capitalize())
    query_lower = query.lower()
    
    if lang == "ru":
        if any(w in query_lower for w in ["rsi", "macd", "индикатор", "средние", "sma", "мувинг"]):
            return f"""Вы спросили об индикаторах в контексте {coin_name}.
В демо-режиме ИИ-консультант может объяснить основные принципы технического анализа:
* **Индекс относительной силы (RSI)** измеряет скорость и изменение цены. Значения выше 70 указывают на зону [red]{{перекупленности}} (риск снижения), а ниже 30 — на зону [green]{{перепроданности}} (шанс роста). Сейчас по {coin_name} индикатор выглядит сбалансированно.
* **MACD** указывает на направление и силу тренда. Пересечение линий снизу вверх дает [green]{{бычий сигнал}}, а сверху вниз — [red]{{медвежье пересечение}}.
* **SMA (Простые скользящие средние)** помогают сгладить цену. Нахождение цены выше SMA-50 считается [green]{{восходящим краткосрочным трендом}}."""

        if any(w in query_lower for w in ["стратегия", "стратегию", "торговать", "план", "strategy"]):
            return f"""Для {coin_name} классическая образовательная стратегия строится следующим образом:
1. **Пересечение скользящих средних**:
   * Когда SMA-50 пересекает SMA-200 снизу вверх, формируется паттерн [green]{{Золотой крест}} (долгосрочный бычий сигнал).
   * При обратном пересечении сверху вниз формируется [red]{{Смертельный крест}} (медвежий сигнал).
2. **Фильтрация сигналов по RSI**:
   * Бычьи пересечения безопаснее искать, когда RSI только выходит из зоны [green]{{перепроданности}} (выше 30).
   * Медвежьи развороты часто подтверждаются дивергенцией RSI в зоне [red]{{перекупленности}}.
*Важно: Всегда тестируйте любые торговые гипотезы на демо-счете перед совершением реальных операций.*"""

        return f"""Привет! Я ваш ИИ-преподаватель по техническому анализу {coin_name}.
В настоящий момент приложение запущено в **демо-режиме** для экономии квоты API и бюджета. 

Тем не менее, я готов обучать вас основам трейдинга:
* Рассказать о работе технических индикаторов (**RSI**, **MACD**, **SMA**).
* Помочь разработать и разобрать учебную торговую стратегию.
* Объяснить любые термины (кликните на подчеркнутые слова на панели слева).

Задайте ваш вопрос об индикаторах или стратегиях для {coin_name}!"""

    else:
        if any(w in query_lower for w in ["rsi", "macd", "indicator", "average", "sma", "moving"]):
            return f"""You asked about technical indicators for {coin_name}.
In demo mode, the AI educator can explain the foundational principles of technical analysis:
* **Relative Strength Index (RSI)** measures speed and price change. Levels above 70 point to [red]{{overbought}} territory (downside risk), and levels below 30 suggest [green]{{oversold}} conditions (potential recovery).
* **MACD** indicates trend direction and strength. A crossover above the signal line yields a [green]{{bullish signal}}, whereas a crossover below is a [red]{{bearish crossover}}.
* **Simple Moving Averages (SMA)** help smooth price action. Trading above SMA-50 implies a [green]{{short-term uptrend}}."""

        if any(w in query_lower for w in ["strategy", "strategies", "trade", "plan"]):
            return f"""For {coin_name}, a classic educational trading strategy works as follows:
1. **Moving Average Crossover**:
   * When SMA-50 crosses above SMA-200, a [green]{{Golden Cross}} is formed (long-term bullish indicator).
   * When SMA-50 crosses below SMA-200, a [red]{{Death Cross}} is formed (long-term bearish indicator).
2. **RSI Filtering**:
   * Bullish crossovers are typically safer when RSI is recovering from [green]{{oversold territory}} (rising above 30).
   * Bearish reversals are confirmed when RSI shows divergence in [red]{{overbought territory}}.
*Remember: Always test your trading ideas on a paper/demo account before committing real capital.*"""

        return f"""Hello! I am your AI educator for {coin_name} technical analysis.
The app is currently running in **demo mode** to preserve API quotas and keys.

However, I am fully equipped to teach you trading foundations:
* Explain technical indicators (**RSI**, **MACD**, **SMA**).
* Help you design and discuss educational trading strategies.
* Answer questions about any term (click dotted terms in the left panel).

Ask me about indicator concepts or strategy structures for {coin_name}!"""

async def generate_coin_summary(coin_id: str, lang: str = "ru") -> str:
    """
    Generates a fresh, context-aware AI summary for the chosen coin.
    Injects real-time price, volume, indicators, and news into the prompt.
    """
    if os.getenv("FORCE_DEMO_MODE", "False").lower() == "true":
        quota_tracker["quota_exhausted"] = True
        return get_simulated_summary(coin_id, lang)

    client = get_gemini_client()

    coin_data = await fetch_coin_data(coin_id)
    news = await fetch_crypto_news(coin_id, lang)
    indicators = calculate_technical_indicators(coin_data["price"], coin_id, lang)
    
    news_titles = "\n".join([f"- {item['title']} ({item['source']})" for item in news])
    
    prompt_ru = f"""
    Подготовь краткую аналитическую сводку по криптовалюте {coin_data['name']} ({coin_data['symbol']}) для новичков.
    
    СТРОЖАЙШЕЕ ПРАВИЛО: Начни ответ СРАЗУ с первого пункта. Не пиши никаких приветствий, вводных слов, фраз вроде "Привет! Рад помочь...", "Давайте посмотрим на..." или общих заголовков вроде "Аналитическая сводка...". Начинай строго со строки: "1. **Рыночный тонус**".
    
    Выделяй важные моменты цветом, используя синтаксис `[green]{{текст}}` для роста/бычьих сигналов и `[red]{{текст}}` для падения/медвежьих сигналов.
    
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
    
    STRICT RULE: Start your answer IMMEDIATELY with the first section. Do not output any greetings, introductions, or headers like "Analytical Summary...". Start strictly with: "1. **Market Tone**".
    
    Use `[green]{{text}}` for bullish/rising signals and `[red]{{text}}` for bearish/falling signals.
    
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
    
    try:
        quota_tracker["summary_calls"] += 1
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=sys_instruction,
                temperature=0.3,
            )
        )
        quota_tracker["quota_exhausted"] = False
        return response.text
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            quota_tracker["quota_exhausted"] = True
        print(f"API Error in generate_coin_summary: {e}")
        raise e

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
    if os.getenv("FORCE_DEMO_MODE", "False").lower() == "true":
        quota_tracker["quota_exhausted"] = True
        sim_response = get_simulated_chat_response(query, coin_id, lang)
        chunk_size = 8
        for i in range(0, len(sim_response), chunk_size):
            yield sim_response[i:i+chunk_size]
            await asyncio.sleep(0.04)
        return

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
