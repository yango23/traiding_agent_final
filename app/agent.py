import os
import re
import time
import asyncio
from datetime import datetime, timezone
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

import json

QUOTA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "quota_tracker.json")

def load_quota() -> dict:
    default_quota = {
        "summary_calls": 0,
        "chat_calls": 0,
        "quota_exhausted": False,
        "reset_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
    if os.path.exists(QUOTA_FILE):
        try:
            with open(QUOTA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Check if it was saved today
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            if data.get("reset_date") == today_str:
                return data
            else:
                return default_quota
        except Exception:
            return default_quota
    return default_quota

def save_quota(quota: dict):
    try:
        quota["reset_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        with open(QUOTA_FILE, "w", encoding="utf-8") as f:
            json.dump(quota, f)
    except Exception as e:
        print(f"Failed to save quota: {e}")

quota_tracker = load_quota()

def is_quota_error(e: Exception) -> bool:
    err_str = str(e).lower()
    return "429" in err_str or "quota" in err_str or "limit" in err_str or "exhausted" in err_str

# Load environment variables
load_dotenv()

# Setup Gemini Client
def get_gemini_client(custom_api_key: str = None) -> genai.Client:
    api_key = custom_api_key or os.getenv("GEMINI_API_KEY")
    use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "False").lower() == "true"
    
    if use_vertex and not custom_api_key:
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        # In Vertex AI mode, genai.Client will use Vertex AI
        return genai.Client(vertexai=True, project=project, location=location)
    else:
        # Google AI Studio mode
        return genai.Client(api_key=api_key)

# -------------------------------------------------------------------------
# Security Guardrails: Input Prompt Shield, Output Guardrails & Key Masking
# -------------------------------------------------------------------------
class SafetyGuard:
    """
    Handles all security checks, input query sanitization, API key leakage protection,
    and output recommendation guardrails.
    """
    API_KEY_REGEX = re.compile(r"AIzaSy[A-Za-z0-9_\-]{33}")
    PROJECT_ID_REGEX = re.compile(r"project-[a-f0-9\-]{36}")

    # Prohibited financial advice terms that are direct calls to action
    FINANCIAL_ADVICE_PATTERNS = [
        r"\b(покупайте|купите|купить|продать|продавайте|продайте|инвестируйте|заходите в лонг|открывайте лонг|открывайте шорт)\b",
        r"\b(buy now|sell now|invest in|open long|open short|buy order|sell order|buy|sell)\b",
        r"\b(я советую купить|я рекомендую купить|я советую продать|я рекомендую продать)\b",
        r"\b(i advise buying|i recommend buying|i advise selling|i recommend selling)\b",
    ]

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
        
        # New Jailbreak / Bypass defenses
        r"\b(dan|jailbreak|developer\s+mode|do\s+anything\s+now)\b",
        r"reveal\s+your\s+system\s+prompt",
        r"reveal\s+(your\s+)?instructions",
        r"раскрой\s+(свой\s+)?системный\s+промпт",
        r"раскрой\s+(свои\s+)?инструкции",
        r"system\s+override",
        r"обход\s+ограничений",
    ]

    @classmethod
    def is_query_safe(cls, query: str) -> bool:
        """
        Checks user input queries for malicious patterns, jailbreaks, shell commands, or system leaks.
        """
        query_lower = query.lower()
        for pattern in cls.SUSPICIOUS_PATTERNS:
            if re.search(pattern, query_lower):
                return False
        return True

    @classmethod
    def mask_sensitive_data(cls, text: str) -> str:
        """
        Redacts leaked API keys and sensitive project IDs from the text to protect credentials.
        """
        text = cls.API_KEY_REGEX.sub("[REDACTED_API_KEY]", text)
        text = cls.PROJECT_ID_REGEX.sub("YOUR_GCP_PROJECT_ID", text)
        return text

    @classmethod
    def validate_agent_output(cls, response_text: str, lang: str = "ru") -> str:
        """
        Validates model output to ensure it does not contain direct buy/sell recommendations or command runs.
        Neutralizes advice by appending warnings or sanitizing text.
        """
        response_lower = response_text.lower()
        contains_advice = False
        for pattern in cls.FINANCIAL_ADVICE_PATTERNS:
            if re.search(pattern, response_lower):
                contains_advice = True
                break

        if contains_advice:
            # Append warning disclaimer about unauthorized financial advice detected
            warning_msg = (
                "\n\n> [!CAUTION]\n> **Обнаружено возможное нарушение правил безопасности:** Бот сгенерировал фразу, напоминающую финансовую рекомендацию. Пожалуйста, помните, что данный помощник работает исключительно в учебных целях и НЕ дает торговых сигналов."
                if lang == "ru" else
                "\n\n> [!CAUTION]\n> **Possible safety violation detected:** The bot generated a response resembling direct financial advice. Please remember that this assistant operates strictly for educational purposes and does NOT provide trade recommendations."
            )
            # Remove any direct buy/sell phrases to satisfy compliance
            clean_text = response_text
            for pattern in cls.FINANCIAL_ADVICE_PATTERNS:
                clean_text = re.sub(pattern, "[REDACTED ADVICE]", clean_text, flags=re.IGNORECASE)
            return clean_text + warning_msg
        return response_text

def is_query_safe(query: str) -> bool:
    """
    Wrapper for SafetyGuard check.
    """
    return SafetyGuard.is_query_safe(query)

# -------------------------------------------------------------------------
# System Instructions
# -------------------------------------------------------------------------
SYSTEM_INSTRUCTION_RU = """Вы — высококвалифицированный Старший ИИ-консультант по всем финансовым рынкам, ценным бумагам (акциям, финотчетности компаний, ETF, сырью, форексу) и криптовалютам.
Ваша главная цель — обучать пользователей концепциям технического и фундаментального анализа, финансовой грамотности, помогать понимать отчетность компаний (10-K, квартальные отчеты Alphabet/Google, Apple, Microsoft и др.), рыночные индикаторы и разрабатывать торговые стратегии.

ПРАВИЛА ОФОРМЛЕНИЯ ТЕКСТА:
Для повышения читаемости текста и выделения важных моментов вы ДОЛЖНЫ использовать специальный синтаксис выделения цветом:
1. Оберните все позитивные, бычьи (bullish), восходящие сигналы, рост цены или зоны перепроданности в `[green]{{текст для выделения зеленым}}`. Пример: "Показатель RSI находится в зоне `[green]{{перепроданности}}`" или "Ожидается `[green]{{бычий прорыв}}`".
2. Оберните все негативные, медвежьи (bearish), нисходящие сигналы, падение цены или зоны перекупленности в `[red]{{текст для выделения красным}}`. Пример: "Импульс сменился на `[red]{{медвежий}}`" или "Индикатор находится в зоне `[red]{{перекупленности}}`".
Никогда не используйте HTML-теги для цвета. Пользуйтесь ТОЛЬКО синтаксисом `[green]{{текст}}` и `[red]{{текст}}`.

ПРАВИЛА БЕЗОПАСНОСТИ:
1. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО давать прямые финансовые, инвестиционные или торговые рекомендации (например: "покупайте акции прямым ходом прямо сейчас", "советую открыть лонг", "делайте ставки на рост"). 
2. Вы должны выступать исключительно как образовательный помощник. Если вас просят дать прямой сигнал или финансовый совет, вежливо откажитесь, объяснив, что вы созданы для обучения, а не индивидуального финансового консалтинга, и объясните риски торговли.
3. Если пользователь просит вас совершить ставки, запустить скрипт, или выполнить команду на сервере, жестко откажитесь и укажите на правила безопасности.
4. Вы консультируете по абсолютно ЛЮБЫМ финансовым рынкам, ценным бумагам, акциям и отчетам компаний. В данный момент на главном экране открыт график: {coin_name}, но пользователь может свободно задавать вопросы о любых других активах, компаниях (Alphabet, Apple и др.), новостях и рынках.

ОБУЧАЮЩИЙ ПОДХОД (Для Новичков и Инвесторов):
1. Не давайте сухих цифр. Если вы упоминаете индикатор (RSI, MACD, скользящие средние, P/E, EPS) или отчетность компаний, всегда объясняйте простыми словами: что это такое, что означает текущее значение и как его интерпретировать.
   - Запомните: "Золотой крест" возникает, когда быстрая средняя (SMA-50) пересекает медленную (SMA-200) снизу вверх (бычий сигнал - зеленый).
   - "Смертельный крест" возникает при пересечении сверху вниз (медвежий сигнал - красный). Никогда не путайте эти направления!
2. Помогайте пользователю анализировать финансовую отчетность, квартальные отметки и строить торговые стратегии на основе параметров (например: "Стратегия на пересечении SMA-50 и SMA-200 строится следующим образом..."), но обязательно добавляйте дисклеймер о необходимости тестирования на демо-счете.
3. Сохраняйте дружелюбный, профессиональный и предостерегающий от лишних рисков тон. Помните: ваша цель — минимизировать финансовые потери инвесторов за счет повышения их финансовой грамотности.
4. Если пользователь просит вас создать или написать торговую стратегию на языке Pine Script для TradingView, вы ДОЛЖНЫ предоставить корректный код на языке Pine Script версии 5 (с использованием //@version=5 в первой строке). Код должен быть простым, хорошо прокомментированным, использовать встроенные функции и быть легко вставляемым в Pine Editor в TradingView. Всегда напоминайте, что код является учебным и его нужно протестировать на демо-данных.
"""

SYSTEM_INSTRUCTION_EN = """You are a highly qualified Senior AI Advisor for Financial Markets, Securities (Stocks, Corporate Earnings Reports, ETFs, Commodities, Forex), and Cryptocurrencies.
Your main goal is to educate users in technical and fundamental analysis, corporate report analysis (10-K, quarterly earnings calls for Alphabet/Google, Apple, Microsoft, etc.), market indicators, and trading strategies.

TEXT FORMATTING RULES:
To improve text readability and emphasize important market events, you MUST use the following custom color highlighting syntax:
1. Wrap positive, bullish, rising price signals, or oversold areas in `[green]{{text to highlight in green}}`. Example: "RSI is in the `[green]{{oversold}}` territory" or "We expect a `[green]{{bullish crossover}}`".
2. Wrap negative, bearish, falling price signals, or overbought areas in `[red]{{text to highlight in red}}`. Example: "The momentum shifted to `[red]{{bearish}}`" or "Indicators show the asset is `[red]{{overbought}}`".
Never use raw HTML tags for coloring. ONLY use `[green]{{text}}` and `[red]{{text}}` tags.

SAFETY RULES:
1. STRICTLY FORBIDDEN from giving direct financial, investment, or trading recommendations (e.g., "buy Apple stock right now", "I advise opening a long position", "bet on the rise").
2. You must act strictly as an educational assistant. If asked for a signal or direct advice, politely refuse by explaining that you are built for education, not financial consulting, and outline trading risks.
3. If the user asks you to place bets, run a script, or execute a server command, firmly refuse and cite safety rules.
4. You advise on ANY financial market, security, corporate report, or stock. The asset currently open on the main screen is: {coin_name}, but users can freely ask questions about any other stocks, earnings reports (Alphabet, Apple, etc.), financial news, or market instruments.

EDUCATIONAL APPROACH (For Beginners and Investors):
1. Avoid dry numbers. If you mention an indicator (RSI, MACD, moving averages, P/E, EPS) or corporate reports, always explain in simple terms: what it is, what the current value means, and how to interpret it.
   - Note: A "Golden Cross" happens when the fast average (SMA-50) crosses the slow average (SMA-200) from below to above (bullish crossover - green).
   - A "Death Cross" happens when it crosses from above to below (bearish crossover - red). Never mix up these crossover directions!
2. Help users analyze financial reports, quarterly metrics, and build trading strategies based on parameters (e.g., "A strategy based on SMA-50 and SMA-200 crossover is built as follows..."), but always add a disclaimer about testing it on a demo account first.
3. Maintain a friendly, professional, and risk-averse tone. Remember: your goal is to minimize investors' losses by improving their financial literacy.
4. If the user asks you to create or write a TradingView Pine Script strategy, you MUST provide valid Pine Script v5 code (using //@version=5 in the first line). The code must be simple, well-commented, use built-in functions, and be easy to copy-paste into TradingView's Pine Editor. Always remind them that the code is educational and must be tested on a paper/demo account first.
"""

def get_system_instruction(coin_id: str, lang: str = "ru") -> str:
    coin_name = COIN_NAMES.get(coin_id.lower().strip(), coin_id.capitalize())
    
    if lang == "ru":
        return SYSTEM_INSTRUCTION_RU.format(coin_name=coin_name)
    else:
        return SYSTEM_INSTRUCTION_EN.format(coin_name=coin_name)

# -------------------------------------------------------------------------
# Daily Cache for AI Summaries (key: {coin_id}_{lang}_{YYYY-MM-DD})
# -------------------------------------------------------------------------
# datetime and timezone imported at top
summary_daily_cache = {}

def get_summary_cache_key(coin_id: str, lang: str) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"{coin_id.lower().strip()}_{lang.lower().strip()}_{date_str}"

# -------------------------------------------------------------------------
# Generation Helpers
# -------------------------------------------------------------------------


def get_simulated_summary(coin_id: str, lang: str = "ru") -> str:
    coin_name = COIN_NAMES.get(coin_id.lower().strip(), coin_id.capitalize())
    is_stock = coin_id.lower().strip() in ["alphabet", "apple", "microsoft", "nvidia", "amazon", "meta", "tesla"]
    
    if lang == "ru":
        if is_stock:
            return f"""1. **Рыночный тонус**:
Акции {coin_name} демонстрируют уверенную динамику в торговой сессии США. Наблюдается краткосрочный [green]{{бычий импульс}} на фоне устойчивых фундаментальных показателей, инвестиций в ИИ и высоких технологических доходов. Объемы торгов остаются [green]{{выше среднего}}.

2. **Что говорят индикаторы**:
Индикатор **RSI (14)** находится на отметке 56.4 ([green]{{нейтрально-бычья зона}}), оставляя запас для дальнейшего роста. Гистограмма **MACD** пересекла сигнальную линию снизу вверх, подтверждая [green]{{восходящий импульс}}. Скользящие средние (SMA-50 и SMA-200) удерживают долгосрочный [green]{{Золотой крест}}, что подчеркивает глобальный растущий тренд по ценной бумаге. **Полосы Боллинджера** сужаются перед возможным импульсным пробоем. Индекс корпоративного настроения равен 64 ([green]{{умеренный оптимизм}}).

3. **Ключевой вывод**:
Техническая и фундаментальная картина по акциям {coin_name} сохраняет [green]{{позитивный потенциал}}. Обратите внимание: данные смоделированы в учебных целях для демонстрации анализа акций."""
        return f"""1. **Рыночный тонус**:
Криптовалюта {coin_name} демонстрирует смешанную динамику с умеренной торговой активностью. Наблюдается краткосрочный [green]{{бычий импульс}} с попыткой пробоя уровней локального сопротивления, однако объемы торгов [red]{{ниже среднего}}, что указывает на недостаточное подтверждение со стороны рынка.

2. **Что говорят индикаторы**:
Индикатор **RSI (14)** близок к отметке [red]{{70 (зона перекупленности)}}, что сигнализирует о возможном откате или паузе в росте. Гистограмма **MACD** пересекла сигнальную линию снизу вверх, подтверждая [green]{{положительный краткосрочный импульс}}. Скользящие средние (SMA-50 и SMA-200) удерживают долгосрочный [green]{{бычий тренд}}, но [red]{{разрыв между ними сокращается}}. **Стохастический осциллятор** (%K=78.5, %D=75.2) подтверждает умеренную перекупленность. Текущая цена тестирует уровень классической **точки разворота (Pivot)**, находясь чуть выше поддержки S1. **Индекс страха и жадности** равен 58 ([green]{{умеренная жадность}}), указывая на преобладание позитивных настроений среди участников рынка.

3. **Ключевой вывод**:
Техническая картина по {coin_name} неоднозначна: есть [green]{{позитивные сигналы}} со стороны MACD, индекса страха/жадности и долгосрочного тренда, но RSI и Стохастик предупреждают о [red]{{риске коррекции}} в краткосрочной перспективе. Обратите внимание: данные смоделированы в учебных целях из-за временного исчерпания дневной квоты API (20 запросов/день)."""
    else:
        if is_stock:
            return f"""1. **Market Tone**:
The stock {coin_name} shows solid momentum during US market trading hours. We observe a short-term [green]{{bullish push}} supported by strong fundamentals, enterprise AI investment, and solid corporate revenue. Trading volume remains [green]{{above average}}.

2. **Indicator Breakdown**:
The **RSI (14)** sits at 56.4 ([green]{{neutral-bullish zone}}), leaving room for upside expansion. The **MACD** histogram crossed above its signal line, confirming a [green]{{positive momentum}}. Moving averages (SMA-50 and SMA-200) maintain a long-term [green]{{Golden Cross}}, reinforcing the structural uptrend of this equity. **Bollinger Bands** are contracting prior to a potential breakout. Market sentiment score stands at 64 ([green]{{moderate optimism}}).

3. **Key Takeaway**:
Technical and fundamental signals for {coin_name} shares remain [green]{{constructive}}. Note: Data is simulated for educational purposes to demonstrate equity market analysis."""
        return f"""1. **Market Tone**:
The cryptocurrency {coin_name} is showing mixed dynamics with moderate trading activity. We observe a short-term [green]{{bullish push}} attempting to break through local resistance levels, however trading volumes are [red]{{below average}}, indicating insufficient market confirmation.

2. **Indicator Breakdown**:
The **RSI (14)** is approaching [red]{{overbought territory (near 70)}}, signaling a possible pullback or pause in the uptrend. The **MACD** histogram crossed above the signal line, confirming a [green]{{short-term positive momentum}}. Moving Averages (SMA-50 and SMA-200) maintain a long-term [green]{{bullish trend}}, however [red]{{the gap between them is narrowing}}. The **Stochastic Oscillator** (%K=78.5, %D=75.2) suggests neutral-to-overbought momentum. The price tests the classic **Pivot Point** level, trading just above the S1 support. The **Fear & Greed Index** is at 58 ([green]{{moderate greed}}), indicating general optimism among market participants.

3. **Key Takeaway**:
The technical picture for {coin_name} is mixed: there are [green]{{positive signals}} from the MACD, Fear & Greed index, and long-term trend, but the RSI and Stochastic warn of a [red]{{correction risk}} in the short term. Note: This analysis is simulated for educational purposes due to the temporary exhaustion of the daily API quota (20 requests/day)."""

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
        response = await client.aio.models.generate_content(
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

async def generate_coin_summary(
    coin_id: str, 
    lang: str = "ru", 
    force_refresh: bool = False, 
    custom_api_key: str = None,
    config: dict = None
) -> str:
    """
    Generates a fresh, context-aware AI summary for the chosen coin.
    Uses a single highly-structured prompt to save quota and reduce latency.
    """
    has_custom_config = False
    if config:
        defaults = {
            "rsi_length": 14, "rsi_overbought": 70, "rsi_oversold": 30,
            "macd_fast": 12, "macd_slow": 26, "macd_signal": 9,
            "sma_fast": 50, "sma_slow": 200, "bb_length": 20, "bb_stddev": 2.0
        }
        has_custom_config = any(config.get(k) != defaults[k] for k in defaults if k in config)

    cache_key = get_summary_cache_key(coin_id, lang)
    if not has_custom_config and not force_refresh and cache_key in summary_daily_cache:
        print(f"Serving cached AI summary for {coin_id} ({lang})")
        return summary_daily_cache[cache_key]

    if not custom_api_key and (quota_tracker["quota_exhausted"] or os.getenv("FORCE_DEMO_MODE", "False").lower() == "true"):
        quota_tracker["quota_exhausted"] = True
        return get_simulated_summary(coin_id, lang)

    try:
        client = get_gemini_client(custom_api_key)
        coin_data = await fetch_coin_data(coin_id, force_refresh=force_refresh)
        news = await fetch_crypto_news(coin_id, lang, force_refresh=force_refresh)
        indicators = await calculate_technical_indicators(coin_data["price"], coin_id, lang, config)
        
        news_titles = "\n".join([f"- {item['title']} ({item['source']})" for item in news])
        
        quota_tracker["summary_calls"] += 1
        save_quota(quota_tracker)
        
        # Prepare the single prompt to perform Tech and Fundamental analysis + risk education in 1 call
        if lang == "ru":
            prompt = f"""
            Подготовь итоговую аналитическую сводку по криптовалюте {coin_data['name']} для новичков на основе следующих данных:
            
            ТЕКУЩИЕ ДАННЫЕ РЫНКА:
            - Текущая цена: ${coin_data['price']:.4f}
            - Изменение цены за 24ч: {coin_data['change_24h']:.2f}%
            
            ТЕХНИЧЕСКИЕ ИНДИКАТОРЫ:
            - RSI (14): {indicators['rsi']['value']} ({indicators['rsi']['status']})
            - MACD: Гистограмма {indicators['macd']['hist']}, Статус: {indicators['macd']['status']}
            - SMA-50: ${indicators['moving_averages']['sma_50']:.4f}, SMA-200: ${indicators['moving_averages']['sma_200']:.4f} ({indicators['moving_averages']['status']})
            - Bollinger Bands: Upper ${indicators['bollinger_bands']['upper']:.4f}, Lower ${indicators['bollinger_bands']['lower']:.4f} ({indicators['bollinger_bands']['status']})
            - Стохастический осциллятор (Stochastic Oscillator): %K={indicators['stochastic']['k']:.2f}, %D={indicators['stochastic']['d']:.2f} ({indicators['stochastic']['status']})
            - Точки разворота (Pivot Points Classic): Pivot ${indicators['pivot_points']['pivot']:.4f}, Поддержка S1 ${indicators['pivot_points']['s1']:.4f}, Сопротивление R1 ${indicators['pivot_points']['r1']:.4f}
            - Индекс страха и жадности (Fear & Greed Index): {indicators['fear_greed']['value']} ({indicators['fear_greed']['status']})
            - Обнаруженные свечные паттерны (Detected Candlestick Patterns): {', '.join(indicators['detected_patterns']) if indicators['detected_patterns'] else 'Нет'}
            
            АКТУАЛЬНЫЕ НОВОСТИ:
            {news_titles}
            
            СТРОЖАЙШИЕ ПРАВИЛА ОФОРМЛЕНИЯ И СТРУКТУРЫ:
            1. Начни ответ СРАЗУ со строки: "1. **Рыночный тонус**". Не пиши никаких приветствий, вступлений или общих заголовков.
            2. Раздели ответ строго на 3 пункта:
               1. **Рыночный тонус**: Опиши общую динамику цены (рост, падение, боковик) и 24ч изменение.
               2. **Что говорят индикаторы**: Объясни показатели RSI, MACD, скользящие средние (SMA-50 и SMA-200), полосы Боллинджера, Стохастический осциллятор, Точки разворота, Индекс страха и жадности и обнаруженные свечные паттерны (если они есть). Пиши это строго в виде единого абзаца. Категорически запрещено разделять индикаторы на отдельные пункты списка (типа "- SMA-50...", "* Стохастик..."). Опиши всё слитно в одном тексте.
               3. **Ключевой вывод**: Сделай вывод об общем фоне на основе новостей и технической картины, напомни о рисках, предупреди, что торговля сопряжена с рисками, и подчеркни, что это не финансовая рекомендация.
            4. Выделяй важные моменты цветом, используя синтаксис `[green]{{текст}}` для роста/бычьих сигналов и `[red]{{текст}}` для падения/медвежьих сигналов.
            5. Не используйте HTML-теги для цвета. Пользуйтесь ТОЛЬКО синтаксисом `[green]{{текст}}` и `[red]{{текст}}`.
            """
            sys_inst = "Вы — Старший ИИ-консультант и Преподаватель. Вы преобразуете технические и фундаментальные данные рынка в понятный учебный текст с жестким соблюдением правил разметки и безопасности."
        else:
            prompt = f"""
            Prepare the final analytical summary for {coin_data['name']} for beginners based on the following data:
            
            CURRENT MARKET DATA:
            - Current Price: ${coin_data['price']:.4f}
            - 24h Price Change: {coin_data['change_24h']:.2f}%
            
            TECHNICAL INDICATORS:
            - RSI (14): {indicators['rsi']['value']} ({indicators['rsi']['status']})
            - MACD: Histogram {indicators['macd']['hist']}, Status: {indicators['macd']['status']}
            - SMA-50: ${indicators['moving_averages']['sma_50']:.4f}, SMA-200: ${indicators['moving_averages']['sma_200']:.4f} ({indicators['moving_averages']['status']})
            - Bollinger Bands: Upper ${indicators['bollinger_bands']['upper']:.4f}, Lower ${indicators['bollinger_bands']['lower']:.4f} ({indicators['bollinger_bands']['status']})
            - Stochastic Oscillator: %K={indicators['stochastic']['k']:.2f}, %D={indicators['stochastic']['d']:.2f} ({indicators['stochastic']['status']})
            - Classic Pivot Points: Pivot ${indicators['pivot_points']['pivot']:.4f}, Support S1 ${indicators['pivot_points']['s1']:.4f}, Resistance R1 ${indicators['pivot_points']['r1']:.4f}
            - Fear & Greed Index: {indicators['fear_greed']['value']} ({indicators['fear_greed']['status']})
            - Detected Candlestick Patterns: {', '.join(indicators['detected_patterns']) if indicators['detected_patterns'] else 'None'}
            
            RECENT NEWS:
            {news_titles}
            
            STRICT FORMATTING & STRUCTURE RULES:
            1. Start your answer IMMEDIATELY with the first section. Do not output any greetings, introductions, or headers. Start strictly with: "1. **Market Tone**".
            2. Divide the response strictly into 3 sections:
               1. **Market Tone**: Describe current price movement (up/down/sideways) and the 24h change.
               2. **Indicator Breakdown**: Explain the RSI, MACD, Moving Averages (SMA-50 and SMA-200), Bollinger Bands, Stochastic Oscillator, Pivot Points, the Fear & Greed Index, and any detected candlestick patterns (if any). Write this strictly as a single cohesive paragraph. You are forbidden from separating indicators into bulleted or dashed list items. Describe everything together in plain text.
               3. **Key Takeaway**: Conclude on the overall state based on news and indicators, emphasize risks, warn that trading is risky, and reiterate that this is not financial advice.
            3. Use `[green]{{text}}` for bullish/rising signals and `[red]{{text}}` for bearish/falling signals.
            4. Do not use HTML tags for coloring. ONLY use `[green]{{text}}` and `[red]{{text}}`.
            """
            sys_inst = "You are a Senior AI Advisor and Educator. You transform technical and fundamental market data into clear educational text while strictly enforcing formatting and safety rules."

        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=sys_inst,
                temperature=0.3,
            )
        )
        summary_text = response.text
        
        quota_tracker["quota_exhausted"] = False
        save_quota(quota_tracker)
        
        # Apply output safety guardrails and sensitive data masking
        summary_text = SafetyGuard.validate_agent_output(summary_text, lang)
        summary_text = SafetyGuard.mask_sensitive_data(summary_text)
        
        summary_daily_cache[cache_key] = summary_text
        return summary_text
    except Exception as e:
        if is_quota_error(e):
            quota_tracker["quota_exhausted"] = True
            save_quota(quota_tracker)
        print(f"API Error in generate_coin_summary, falling back to simulated: {e}")
        if custom_api_key:
            raise e
        return get_simulated_summary(coin_id, lang)

async def chat_with_agent(
    query: str, 
    history: list, 
    coin_id: str, 
    lang: str = "ru",
    custom_api_key: str = None
) -> AsyncGenerator[str, None]:
    """
    Streams the agent's chat response using Gemini API.
    Orchestrates Technical and Fundamental agents dynamically.
    """
    if not custom_api_key and (quota_tracker["quota_exhausted"] or os.getenv("FORCE_DEMO_MODE", "False").lower() == "true"):
        quota_tracker["quota_exhausted"] = True
        sim_response = get_simulated_chat_response(query, coin_id, lang)
        chunk_size = 8
        for i in range(0, len(sim_response), chunk_size):
            yield sim_response[i:i+chunk_size]
            await asyncio.sleep(0.04)
        return

    try:
        client = get_gemini_client(custom_api_key)
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
                f"Detected Candlestick Patterns: {', '.join(indicators['detected_patterns']) if indicators['detected_patterns'] else 'None'}. "
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

        # Generate stream asynchronously
        response_stream = await client.aio.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=sys_instruction,
                temperature=0.4,
            )
        )
        
        accumulated_text = ""
        async for chunk in response_stream:
            if chunk.text:
                masked_chunk = SafetyGuard.mask_sensitive_data(chunk.text)
                accumulated_text += masked_chunk
                yield masked_chunk

        # Check if the fully accumulated response contains direct financial advice.
        # If so, append the safety warning at the end of the stream.
        response_lower = accumulated_text.lower()
        contains_advice = False
        for pattern in SafetyGuard.FINANCIAL_ADVICE_PATTERNS:
            if re.search(pattern, response_lower):
                contains_advice = True
                break
        if contains_advice:
            warning_msg = (
                "\n\n> [!CAUTION]\n> **Обнаружено возможное нарушение правил безопасности:** Бот сгенерировал фразу, напоминающую финансовую рекомендацию. Пожалуйста, помните, что данный помощник работает исключительно в учебных целях и НЕ дает торговых сигналов."
                if lang == "ru" else
                "\n\n> [!CAUTION]\n> **Possible safety violation detected:** The bot generated a response resembling direct financial advice. Please remember that this assistant operates strictly for educational purposes and does NOT provide trade recommendations."
            )
            yield warning_msg
    except Exception as e:
        print(f"API Error in chat_with_agent, falling back to simulated: {e}")
        if custom_api_key:
            raise e
        if is_quota_error(e) and not custom_api_key:
            quota_tracker["quota_exhausted"] = True
            save_quota(quota_tracker)
        sim_response = get_simulated_chat_response(query, coin_id, lang)
        chunk_size = 8
        for i in range(0, len(sim_response), chunk_size):
            yield sim_response[i:i+chunk_size]
            await asyncio.sleep(0.04)

def set_custom_api_key(key: str):
    # Update in environment so get_gemini_client picks it up
    os.environ["GEMINI_API_KEY"] = key
    
    # Write to local .env file to persist it across restarts
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            key_replaced = False
            for line in lines:
                if line.strip().startswith("GEMINI_API_KEY="):
                    new_lines.append(f"GEMINI_API_KEY={key}\n")
                    key_replaced = True
                elif line.strip().startswith("FORCE_DEMO_MODE="):
                    new_lines.append("FORCE_DEMO_MODE=False\n")
                else:
                    new_lines.append(line)
            if not key_replaced:
                new_lines.append(f"\nGEMINI_API_KEY={key}\n")
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception as e:
            print(f"Failed to write API key to .env: {e}")
            
    # Clear daily caches
    global summary_daily_cache
    summary_daily_cache.clear()
    
    # Reset quota exhausted tracker and call counters
    quota_tracker["quota_exhausted"] = False
    quota_tracker["summary_calls"] = 0
    quota_tracker["chat_calls"] = 0
    save_quota(quota_tracker)

async def generate_pine_script(
    prompt: str,
    coin_id: str,
    lang: str = "ru",
    custom_api_key: str = None
) -> str:
    """
    Generates a valid TradingView Pine Script v5 indicator/strategy using Gemini.
    """
    if not custom_api_key and (quota_tracker["quota_exhausted"] or os.getenv("FORCE_DEMO_MODE", "False").lower() == "true"):
        quota_tracker["quota_exhausted"] = True
        
        # Mock simulated Pine Script response
        if lang == "ru":
            return """```pinescript
//@version=5
indicator("Пересечение скользящих средних (Демо)", overlay=true)

// Настройки
fast_len = input.int(9, title="Быстрая МА")
slow_len = input.int(21, title="Медленная МА")

// Расчет
fast_ma = ta.ema(close, fast_len)
slow_ma = ta.ema(close, slow_len)

// Отрисовка
plot(fast_ma, color=color.blue, title="Быстрая EMA")
plot(slow_ma, color=color.orange, title="Медленная EMA")

// Сигналы пересечения
buy_signal = ta.crossover(fast_ma, slow_ma)
sell_signal = ta.crossunder(fast_ma, slow_ma)

plotshape(buy_signal, title="Сигнал на Покупку", style=shape.triangleup, location=location.belowbar, color=color.green, size=size.small)
plotshape(sell_signal, title="Сигнал на Продажу", style=shape.triangledown, location=location.abovebar, color=color.red, size=size.small)

// Примечание: Это симуляция Pine Script. Подключите собственный API-ключ для генерации пользовательских скриптов.
```"""
        else:
            return """```pinescript
//@version=5
indicator("Moving Average Crossover (Simulated)", overlay=true)

// Settings
fast_len = input.int(9, title="Fast MA")
slow_len = input.int(21, title="Slow MA")

// Calculations
fast_ma = ta.ema(close, fast_len)
slow_ma = ta.ema(close, slow_len)

// Plotting
plot(fast_ma, color=color.blue, title="Fast EMA")
plot(slow_ma, color=color.orange, title="Slow EMA")

// Cross Signals
buy_signal = ta.crossover(fast_ma, slow_ma)
sell_signal = ta.crossunder(fast_ma, slow_ma)

plotshape(buy_signal, title="Buy Signal", style=shape.triangleup, location=location.belowbar, color=color.green, size=size.small)
plotshape(sell_signal, title="Sell Signal", style=shape.triangledown, location=location.abovebar, color=color.red, size=size.small)

// Note: This is a simulated script. Enter your custom API Key to generate custom indicators.
```"""

    try:
        client = get_gemini_client(custom_api_key)
        coin_name = COIN_NAMES.get(coin_id.lower().strip(), coin_id.capitalize())
        
        sys_instruction = (
            "Вы — ИИ-программист TradingView Pine Script v5. Ваша задача — написать чистый, рабочий и компилируемый "
            "код индикатора или стратегии на языке Pine Script v5. Отвечайте ТОЛЬКО кодом, оформленным в стандартный блок "
            "кода markdown. Внутри кода обязательно используйте понятные комментарии на русском языке. Не пишите "
            "никакого сопроводительного текста вне блока кода."
            if lang == "ru" else
            "You are a TradingView Pine Script v5 developer. Your task is to write clean, working, and compilable "
            "Pine Script v5 code. Respond ONLY with the markdown code block containing the script. Use clear "
            "comments inside the script. Do not write any conversational text outside the code block."
        )
        
        user_prompt = (
            f"Создай скрипт для {coin_name} на основе следующего описания: {prompt}."
            if lang == "ru" else
            f"Generate a Pine Script for {coin_name} based on this description: {prompt}."
        )
        
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=sys_instruction,
                temperature=0.2,
            )
        )
        
        script = response.text
        return SafetyGuard.mask_sensitive_data(script)
    except Exception as e:
        print(f"API Error in generate_pine_script: {e}")
        if custom_api_key:
            raise e
        # Fallback to simulated
        quota_tracker["quota_exhausted"] = True
        save_quota(quota_tracker)
        # Call again without key to trigger simulated response
        return await generate_pine_script(prompt, coin_id, lang, custom_api_key=None)
