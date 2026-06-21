import os
import re
import time
import asyncio
import numpy as np
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
   - Запомните: "Золотой крест" возникает, когда быстрая средняя (SMA-50) пересекает медленную (SMA-200) снизу вверх (бычий сигнал - зеленый).
   - "Смертельный крест" возникает при пересечении сверху вниз (медвежий сигнал - красный). Никогда не путайте эти направления!
2. Помогайте пользователю строить торговые стратегии на основе параметров (например: "Стратегия на пересечении SMA-50 и SMA-200 строится следующим образом..."), но обязательно добавляйте дисклеймер о необходимости тестирования на демо-счете.
3. Сохраняйте дружелюбный, профессиональный и предостерегающий от лишних рисков тон. Помните: ваша цель — минимизировать финансовые потери новичков за счет повышения их финансовой грамотности.
4. Если пользователь просит вас создать или написать торговую стратегию на языке Pine Script для TradingView, вы ДОЛЖНЫ предоставить корректный код на языке Pine Script версии 5 (с использованием //@version=5 в первой строке). Код должен быть простым, хорошо прокомментированным, использовать встроенные функции и быть легко вставляемым в Pine Editor в TradingView. Всегда напоминайте, что код является учебным и его нужно протестировать на демо-данных.
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
   - Note: A "Golden Cross" happens when the fast average (SMA-50) crosses the slow average (SMA-200) from below to above (bullish crossover - green).
   - A "Death Cross" happens when it crosses from above to below (bearish crossover - red). Never mix up these crossover directions!
2. Help users build trading strategies based on parameters (e.g., "A strategy based on SMA-50 and SMA-200 crossover is built as follows..."), but always add a disclaimer about testing it on a demo account first.
3. Maintain a friendly, professional, and risk-averse tone. Remember: your goal is to minimize beginners' losses by improving their financial literacy.
4. If the user asks you to create or write a TradingView Pine Script strategy, you MUST provide valid Pine Script v5 code (using //@version=5 in the first line). The code must be simple, well-commented, use built-in functions, and be easy to copy-paste into TradingView's Pine Editor. Always remind them that the code is educational and must be tested on a paper/demo account first.
"""

def get_system_instruction(coin_id: str, lang: str = "ru") -> str:
    coin_name = COIN_NAMES.get(coin_id.lower().strip(), coin_id.capitalize())
    other_coin = "другой монете" if lang == "ru" else "another coin"
    
    if lang == "ru":
        return SYSTEM_INSTRUCTION_RU.format(coin_name=coin_name, other_coin=other_coin)
    else:
        return SYSTEM_INSTRUCTION_EN.format(coin_name=coin_name, other_coin=other_coin)

# -------------------------------------------------------------------------
# Daily Cache for AI Summaries (key: {coin_id}_{lang}_{YYYY-MM-DD})
# -------------------------------------------------------------------------
from datetime import datetime, timezone
summary_daily_cache = {}

def get_summary_cache_key(coin_id: str, lang: str) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"{coin_id.lower().strip()}_{lang.lower().strip()}_{date_str}"

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
            return f"""Вы спросили о технических индикаторах в контексте {coin_name}.
В демо-режиме ИИ-консультант может объяснить основные принципы:
* **Индекс относительной силы (RSI)** измеряет скорость движения цены. Значения выше 70 указывают на [red]{{перекупленность}} (риск коррекции), а ниже 30 — на [green]{{перепроданность}} (потенциальный отскок).
* **MACD** показывает направление и силу тренда. Когда гистограмма выше 0, импульс считается [green]{{бычьим (восходящим)}}, когда ниже — [red]{{медвежтим (нисходящим)}}.
* **Полосы Боллинджера** указывают на волатильность: выход за границы часто предвещает разворот цены.

Это образовательная модель. Не используйте эти показатели для принятия реальных торговых решений без тестирования на демо-счете!"""
        elif any(w in query_lower for w in ["новост", "событи", "news", "halving", "халвинг"]):
            return f"""Что касается фундаментального анализа и новостей по {coin_name}:
В образовательных целях помните, что новости сильно влияют на крипторынок:
1. Позитивные новости (партнерства, обновления, регуляторное одобрение) могут вызвать [green]{{бычий импульс}}.
2. Негативные новости (взломы, запреты, FUD) часто вызывают [red]{{медвежью реакцию}}.

Всегда проверяйте источники новостей и не принимайте решения импульсивно!"""
        else:
            return f"""Привет! Я твой ИИ-преподаватель по {coin_name}.
Я могу рассказать тебе про:
* Технический анализ (индикаторы RSI, MACD, скользящие средние)
* Фундаментальный анализ и новости
* Риск-менеджмент и основы построения стратегий (например, Pine Script v5)

Задай мне более конкретный вопрос об этих темах! Обрати внимание, что сейчас включен демонстрационный режим."""
    else:
        # English
        if any(w in query_lower for w in ["rsi", "macd", "indicator", "average", "sma", "moving"]):
            return f"""You asked about technical indicators in the context of {coin_name}.
In demo mode, here is an educational overview of key concepts:
* **Relative Strength Index (RSI)** measures price momentum. Values above 70 indicate [red]{{overbought}} conditions (risk of pullback), while values below 30 indicate [green]{{oversold}} conditions (rebound opportunity).
* **MACD** shows trend direction and strength. A histogram above zero indicates [green]{{bullish momentum}}, whereas below zero indicates [red]{{bearish momentum}}.
* **Bollinger Bands** reflect volatility: price moving outside the bands often signals a potential reversal.

This is educational guidance. Always test your strategies on a demo account first!"""
        elif any(w in query_lower for w in ["news", "event", "halving", "fundamental"]):
            return f"""Regarding fundamental analysis and news for {coin_name}:
In cryptocurrency markets, news is a primary driver of price action:
1. Positive news (partnerships, tech upgrades, regulatory clearance) often drives a [green]{{bullish rally}}.
2. Negative news (hacks, crackdowns, FUD) typically triggers [red]{{bearish sell-offs}}.

Always verify news sources and avoid emotional trading!"""
        else:
            return f"""Hello! I am your AI educator for {coin_name}.
I can help you learn about:
* Technical indicators (RSI, MACD, Moving Averages)
* Fundamental analysis and crypto news
* Risk management and strategy basics (like Pine Script v5)

Please ask me a more specific question about these topics! Note that the app is currently running in demo mode."""

async def retrieve_relevant_news(query: str, news: list, client, limit: int = 2) -> list:
    if not news:
        return []
        
    try:
        texts = [f"{item['title']}. {item['body']}" for item in news]
        news_resp = client.models.embed_content(
            model="text-embedding-004",
            contents=texts
        )
        news_embeddings = [emb.values for emb in news_resp.embeddings]
        
        query_resp = client.models.embed_content(
            model="text-embedding-004",
            contents=query
        )
        query_embedding = query_resp.embeddings[0].values
        
        scored_news = []
        for i, item in enumerate(news):
            sim = cosine_similarity(query_embedding, news_embeddings[i])
            scored_news.append((sim, item))
            
        scored_news.sort(key=lambda x: x[0], reverse=True)
        return [item for score, item in scored_news[:limit]]
    except Exception as e:
        print(f"Error in retrieve_relevant_news RAG: {e}")
        query_words = set(query.lower().split())
        scored = []
        for item in news:
            text = (item["title"] + " " + item["body"]).lower()
            score = sum(1 for w in query_words if w in text)
            scored.append((score, item))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [item for score, item in scored[:limit]]

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))

async def route_query(client, query: str) -> str:
    """
    Classifies the user query into: 'tech', 'fundamental', or 'general'.
    """
    prompt = f"""
    Classify the following cryptocurrency user query into one of these three categories:
    - 'tech' (if the user is asking about specific technical indicators like RSI, MACD, SMA, Bollinger Bands, charts, or technical patterns)
    - 'fundamental' (if the user is asking about news, events, social sentiment, halving, or fundamental analysis)
    - 'general' (if it's a general question, greetings, risk management, general trading concept, or strategy building)
    
    Query: "{query}"
    
    Output strictly one word: either 'tech', 'fundamental', or 'general'. Do not output anything else.
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
            )
        )
        cat = response.text.strip().lower()
        if "tech" in cat: return "tech"
        if "fundamental" in cat or "news" in cat: return "fundamental"
        return "general"
    except Exception:
        return "general"

async def run_tech_agent(client, coin_name, price, indicators, lang) -> str:
    prompt = f"""
    Analyze the technical indicators for {coin_name}:
    - Current Price: ${price:.4f}
    - RSI (14): {indicators['rsi']['value']} ({indicators['rsi']['status']})
    - MACD: Histogram {indicators['macd']['hist']}, Status: {indicators['macd']['status']}
    - SMA-50: ${indicators['moving_averages']['sma_50']:.4f}, SMA-200: ${indicators['moving_averages']['sma_200']:.4f} ({indicators['moving_averages']['status']})
    - Bollinger Bands: Upper ${indicators['bollinger_bands']['upper']:.4f}, Lower ${indicators['bollinger_bands']['lower']:.4f} ({indicators['bollinger_bands']['status']})
    
    Provide an educational technical breakdown. Explain what these indicators mean in simple terms.
    Write in {'Russian' if lang == 'ru' else 'English'}.
    """
    sys_inst = (
        "Вы — ИИ-аналитик технического анализа. Специализируетесь на индикаторах, графиках и импульсах. "
        "Объясняйте все доступно для новичков. Не давайте финансовых советов."
        if lang == "ru" else
        "You are a Technical Analysis AI Agent. You specialize in indicators, chart patterns, and momentum. "
        "Explain everything in simple terms for beginners. Do not give financial advice."
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=sys_inst,
            temperature=0.2,
        )
    )
    return response.text

async def run_fundamental_agent(client, coin_name, news_titles, lang) -> str:
    prompt = f"""
    Analyze the recent news for {coin_name}:
    {news_titles}
    
    Summarize the key news drivers and the general market sentiment for this coin.
    Write in {'Russian' if lang == 'ru' else 'English'}.
    """
    sys_inst = (
        "Вы — ИИ-специалист по фундаментальному анализу криптовалют. Анализируете новости, события и рыночные настроения. "
        "Не давайте финансовых советов."
        if lang == "ru" else
        "You are a Fundamental Analysis AI Agent. You analyze news, market events, and macro sentiment. "
        "Do not give financial advice."
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=sys_inst,
            temperature=0.2,
        )
    )
    return response.text

async def run_risk_educator_summary(client, coin_name, price, change_24h, tech_draft, fund_draft, lang) -> str:
    prompt_ru = f"""
    Подготовь итоговую аналитическую сводку по криптовалюте {coin_name} для новичков на основе черновиков от аналитиков:
    
    ЧЕРНОВИК ТЕХНИЧЕСКОГО АНАЛИЗА:
    {tech_draft}
    
    ЧЕРНОВИК НОВОСТНОГО АНАЛИЗА:
    {fund_draft}
    
    ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ:
    - Изменение цены за 24ч: {change_24h:.2f}%
    
    СТРОЖАЙШИЕ ПРАВИЛА ОФОРМЛЕНИЯ И СТРУКТУРЫ:
    1. Начни ответ СРАЗУ со строки: "1. **Рыночный тонус**". Не пиши никаких приветствий, вступлений или общих заголовков.
    2. Раздели ответ строго на 3 пункта:
       1. **Рыночный тонус**: Опиши общую динамику цены (рост, падение, боковик) и 24ч изменение.
       2. **Что говорят индикаторы**: Объясни показатели RSI, MACD и скользящие средние (SMA-50 и SMA-200). Пиши это строго в виде единого абзаца. Категорически запрещено разделять индикаторы или скользящие средние на отдельные пункты списка (типа "- SMA-50...", "* SMA..."). Опиши всё слитно в одном тексте.
       3. **Ключевой вывод**: Сделай вывод об общем фоне, напомни о рисках, предупреди, что торговля сопряжена с рисками, и подчеркни, что это не финансовая рекомендация.
    3. Выделяй важные моменты цветом, используя синтаксис `[green]{{текст}}` для роста/бычьих сигналов и `[red]{{текст}}` для падения/медвежьих сигналов.
    4. Не используйте HTML-теги для цвета. Пользуйтесь ТОЛЬКО синтаксисом `[green]{{текст}}` и `[red]{{текст}}`.
    """
    
    prompt_en = f"""
    Prepare the final analytical summary for {coin_name} for beginners based on drafts from the analyst agents:
    
    TECHNICAL ANALYSIS DRAFT:
    {tech_draft}
    
    NEWS ANALYSIS DRAFT:
    {fund_draft}
    
    ADDITIONAL DATA:
    - 24h Price Change: {change_24h:.2f}%
    
    STRICT FORMATTING & STRUCTURE RULES:
    1. Start your answer IMMEDIATELY with the first section. Do not output any greetings, introductions, or headers. Start strictly with: "1. **Market Tone**".
    2. Divide the response strictly into 3 sections:
       1. **Market Tone**: Describe current price movement (up/down/sideways) and the 24h change.
       2. **Indicator Breakdown**: Explain the RSI, MACD, and Moving Averages (SMA-50 and SMA-200) indications. Write this strictly as a single cohesive paragraph. You are forbidden from separating indicators or moving averages into bulleted or dashed list items (such as "- SMA-50..." or "* SMA..."). Describe everything together in plain text.
       3. **Key Takeaway**: Conclude on the overall state, emphasize risks, warn that trading is risky, and reiterate that this is not financial advice.
    3. Use `[green]{{text}}` for bullish/rising signals and `[red]{{text}}` for bearish/falling signals.
    4. Do not use HTML tags for coloring. ONLY use `[green]{{text}}` and `[red]{{text}}`.
    """
    
    prompt = prompt_ru if lang == "ru" else prompt_en
    sys_inst = (
        "Вы — Старший ИИ-консультант и Преподаватель. Вы собираете отчеты аналитиков и преобразуете их в понятный учебный текст с жестким соблюдением правил разметки и безопасности."
        if lang == "ru" else
        "You are a Senior AI Advisor and Educator. You compile reports from analyst agents and transform them into clear educational text while strictly enforcing formatting and safety rules."
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=sys_inst,
            temperature=0.3,
        )
    )
    return response.text

async def generate_coin_summary(coin_id: str, lang: str = "ru") -> str:
    """
    Generates a fresh, context-aware AI summary for the chosen coin.
    Orchestrates Technical and Fundamental agents to produce the output.
    """
    cache_key = get_summary_cache_key(coin_id, lang)
    if cache_key in summary_daily_cache:
        print(f"Serving cached AI summary for {coin_id} ({lang})")
        return summary_daily_cache[cache_key]

    if quota_tracker["quota_exhausted"] or os.getenv("FORCE_DEMO_MODE", "False").lower() == "true":
        quota_tracker["quota_exhausted"] = True
        return get_simulated_summary(coin_id, lang)

    try:
        client = get_gemini_client()
        coin_data = await fetch_coin_data(coin_id)
        news = await fetch_crypto_news(coin_id, lang)
        indicators = await calculate_technical_indicators(coin_data["price"], coin_id, lang)
        
        news_titles = "\n".join([f"- {item['title']} ({item['source']})" for item in news])
        
        quota_tracker["summary_calls"] += 1
        
        # Parallel execution of Tech and Fundamental agents
        tech_draft, fund_draft = await asyncio.gather(
            run_tech_agent(client, coin_data['name'], coin_data['price'], indicators, lang),
            run_fundamental_agent(client, coin_data['name'], news_titles, lang)
        )
        
        # Coordinator / Risk Educator compiles the final summary
        summary_text = await run_risk_educator_summary(
            client, coin_data['name'], coin_data['price'], coin_data['change_24h'], tech_draft, fund_draft, lang
        )
        
        quota_tracker["quota_exhausted"] = False
        summary_daily_cache[cache_key] = summary_text
        return summary_text
    except Exception as e:
        quota_tracker["quota_exhausted"] = True
        print(f"API Error in generate_coin_summary, falling back to simulated: {e}")
        return get_simulated_summary(coin_id, lang)

async def chat_with_agent(
    query: str, 
    history: list, 
    coin_id: str, 
    lang: str = "ru"
) -> AsyncGenerator[str, None]:
    """
    Streams the agent's chat response using Gemini API.
    Orchestrates Technical and Fundamental agents dynamically.
    """
    if quota_tracker["quota_exhausted"] or os.getenv("FORCE_DEMO_MODE", "False").lower() == "true":
        quota_tracker["quota_exhausted"] = True
        sim_response = get_simulated_chat_response(query, coin_id, lang)
        chunk_size = 8
        for i in range(0, len(sim_response), chunk_size):
            yield sim_response[i:i+chunk_size]
            await asyncio.sleep(0.04)
        return

    try:
        client = get_gemini_client()
        coin_data = await fetch_coin_data(coin_id)
        indicators = await calculate_technical_indicators(coin_data["price"], coin_id, lang)
        
        # 1. Routing step (Multi-agent classification)
        category = await route_query(client, query)
        print(f"Chat routed to category: {category}")
        
        # 2. Context preparation depending on category
        if category == "tech":
            # Technical agent context
            context_injection = (
                f"[Контекст Технического Анализа: Цена ${coin_data['price']:.4f}, "
                f"24ч Изменение: {coin_data['change_24h']:.2f}%. RSI: {indicators['rsi']['value']} ({indicators['rsi']['status']}). "
                f"MACD: {indicators['macd']['status']} (hist={indicators['macd']['hist']}). "
                f"SMA-50: ${indicators['moving_averages']['sma_50']:.2f}, SMA-200: ${indicators['moving_averages']['sma_200']:.2f} ({indicators['moving_averages']['status']}). "
                f"Bollinger Bands: Upper ${indicators['bollinger_bands']['upper']:.2f}, Lower ${indicators['bollinger_bands']['lower']:.2f}. "
                f"Отвечайте на вопросы пользователя по индикаторам и графикам, объясняйте термины просто.]"
            )
            # Route to Tech instruction
            sys_instruction = (
                "Вы — ИИ-аналитик технического анализа. Специализируетесь на индикаторах, графиках и импульсах. "
                "Ответьте на технический вопрос пользователя. Соблюдайте правила оформления текста: выделяйте "
                "бычьи/зеленые сигналы в [green]{...} и медвежьи/красные сигналы в [red]{...}. Не давайте финансовых рекомендаций!"
                if lang == "ru" else
                "You are a Technical Analysis AI Agent. You specialize in indicators, chart patterns, and momentum. "
                "Answer the user's technical question. Follow formatting rules: wrap positive/bullish signals "
                "in [green]{...} and negative/bearish in [red]{...}. Do not give financial advice!"
            )
            
        elif category == "fundamental":
            # Fetch news and run RAG search
            news = await fetch_crypto_news(coin_id, lang)
            relevant_news = await retrieve_relevant_news(query, news, client, limit=2)
            
            news_context_parts = []
            for item in relevant_news:
                news_context_parts.append(f"- {item['title']} (Источник: {item['source']}): {item['body']}")
            news_context_str = "\n".join(news_context_parts)
            
            context_injection = (
                f"[Контекст Новости и RAG: Актуальные релевантные новости для ответа на запрос:\n{news_context_str}\n"
                f"Отвечайте пользователю строго на основе этих новостей, делайте выводы о настроениях рынка.]"
            )
            # Route to Fundamental instruction
            sys_instruction = (
                "Вы — ИИ-специалист по фундаментальному анализу. Анализируете новости, события и настроения рынка. "
                "Ответьте на вопрос пользователя на основе предоставленных новостей. Соблюдайте правила оформления текста: "
                "выделяйте бычьи/зеленые сигналы в [green]{...} и медвежьи/красные сигналы в [red]{...}. Не давайте финансовых рекомендаций!"
                if lang == "ru" else
                "You are a Fundamental Analysis AI Agent. You analyze news, events, and sentiment. "
                "Answer the user's question based on the provided news context. Follow formatting rules: "
                "wrap positive/bullish signals in [green]{...} and negative/bearish in [red]{...}. Do not give financial advice!"
            )
            
        else: # general
            # General coordinator / Risk educator context
            context_injection = (
                f"[Общий контекст: Текущая цена ${coin_data['price']:.4f}, 24ч Изменение: {coin_data['change_24h']:.2f}%. "
                f"Обучайте пользователя риск-менеджменту, помогайте строить стратегии, объясняйте общие понятия, "
                f"генерируйте скрипты Pine Script v5 при запросе. Запрещено давать сигналы на покупку/продажу.]"
            )
            sys_instruction = get_system_instruction(coin_id, lang)

        # Format history for Gemini SDK
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
    except Exception as e:
        print(f"API Error in chat_with_agent, falling back to simulated: {e}")
        quota_tracker["quota_exhausted"] = True
        sim_response = get_simulated_chat_response(query, coin_id, lang)
        chunk_size = 8
        for i in range(0, len(sim_response), chunk_size):
            yield sim_response[i:i+chunk_size]
            await asyncio.sleep(0.04)
