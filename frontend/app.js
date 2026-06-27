// =========================================================================
// State Management & Logic for Educational Crypto AI Advisor Dashboard
// =========================================================================

// Global Configuration
const TRADINGVIEW_SYMBOLS = {
    "bitcoin": "BINANCE:BTCUSDT",
    "ethereum": "BINANCE:ETHUSDT",
    "solana": "BINANCE:SOLUSDT",
    "ripple": "BINANCE:XRPUSDT",
    "dogecoin": "BINANCE:DOGEUSDT",
    "shiba-inu": "BINANCE:SHIBUSDT",
    "pepe": "KRAKEN:PEPEUSD"
};

// UI Localization Dictionaries
// UI Localization Dictionaries
const LOCALIZATION = {
    ru: {
        subtitle: "Учебный ИИ-помощник & Дашборд по техническому анализу",
        lblSelectCoin: "Выберите актив",
        lblHigh24h: "24ч Макс",
        lblLow24h: "24ч Мин",
        lblVolume: "Объем (24ч)",
        lblCap: "Капитализация",
        tabSummary: "📝 Сводка ИИ",
        tabNews: "📰 Новости",
        lblAdvisorStatus: "ИИ-Преподаватель (Обучение)",
        chatDisclaimer: "⚠️ <strong>Внимание:</strong> Я даю только технический/фундаментальный анализ и обучаю концепциям торговли. Я НЕ даю сигналов и финансовых рекомендаций по покупке/продаже.",
        chatPlaceholder: "Задайте вопрос об активном токене...",
        lblLoadingSummary: "Генерация ИИ-анализа...",
        errorSummary: "Не удалось сгенерировать ИИ-сводку.",
        errorChat: "Произошла ошибка при получении ответа от ИИ.",
        welcomeMessage: "Привет! Я твой ИИ-преподаватель по техническому и фундаментальному анализу {coin}. Чем могу помочь тебе сегодня? Я могу рассказать про индикаторы (RSI, MACD), объяснить текущие новости или показать основы построения стратегий.",
        chips: [
            "Создать торговую стратегию для {coin}",
            "Какая монета сейчас наиболее интересна для покупки?",
            "Как минимизировать риски потерь новичку?",
            "indicator_of_the_day"
        ],
        lblIndicatorsTitle: "Технические индикаторы",
        lblSmaLabel: "Скользящие (SMA)",
        lblFgLabel: "Страх / Жадность",
        tipRsi: "Индекс относительной силы (RSI). Перекуплен >70, перепродан <30.",
        tipMacd: "Схождение/расхождение средних (MACD). Показывает импульс тренда.",
        tipSma: "SMA-50 и SMA-200. Золотой крест — бычий сигнал, Крест смерти — медвежий.",
        tipBb: "Полосы Боллинджера. Отражают волатильность рынка.",
        tipFg: "Индекс страха и жадности. Настроение инвесторов: 0 (страх) - 100 (жадность).",
        lblSecurityBadge: "🛡️ Защищен",
        lblSecurityBadgeTitle: "Полная безопасность от финансовых советов и вредоносных команд",
        langToggleTitle: "Переключить язык",
        sentimentLabels: {
            strongSell: "Активная продажа",
            sell: "Продажа",
            neutral: "Нейтрально",
            buy: "Покупка",
            strongBuy: "Активная покупка",
            sentimentTitle: "Настроение рынка"
        },
        lblExportBtn: "Скачать отчет",
        lblApiKeyTitle: "Ключ API Gemini",
        apiKeyPlaceholder: "Введите API-ключ...",
        btnApplyKey: "Применить ключ",
        lblRefreshBtn: "Обновить данные",
        tipRefreshStats: "Обновить только рыночные данные",
        lblPatternsLabel: "Свечные паттерны",
        tipPatterns: "Активные паттерны, сканируемые на дневном графике Binance (например, Доджи, Молот, Падающая звезда, Поглощение)."
    },
    en: {
        subtitle: "Educational AI Assistant & Dashboard",
        lblSelectCoin: "Select Crypto Asset",
        lblHigh24h: "24h High",
        lblLow24h: "24h Low",
        lblVolume: "Volume (24h)",
        lblCap: "Market Cap",
        tabSummary: "📝 AI Summary",
        tabNews: "📰 News",
        lblAdvisorStatus: "AI Educator (Educational Mode)",
        chatDisclaimer: "⚠️ <strong>Warning:</strong> I only provide technical/fundamental analysis and teach trading concepts. I DO NOT provide trading signals or direct buy/sell recommendations.",
        chatPlaceholder: "Ask a question about the active token...",
        lblLoadingSummary: "Generating AI Analysis...",
        errorSummary: "Failed to generate AI summary.",
        errorChat: "An error occurred while receiving a response from the AI.",
        welcomeMessage: "Hello! I am your AI educator for technical and fundamental analysis on {coin}. How can I help you today? I can explain indicators (RSI, MACD), explain recent news, or show the basics of strategy building.",
        chips: [
            "Create a trading strategy for {coin}",
            "Which coin looks most interesting to buy right now?",
            "How can a beginner minimize trading losses?",
            "indicator_of_the_day"
        ],
        lblIndicatorsTitle: "Technical Indicators",
        lblSmaLabel: "Moving Averages",
        lblFgLabel: "Fear & Greed",
        tipRsi: "Relative Strength Index (RSI). Overbought >70, oversold <30.",
        tipMacd: "Moving Average Convergence Divergence (MACD). Shows trend momentum.",
        tipSma: "SMA-50 and SMA-200. Golden Cross is bullish, Death Cross is bearish.",
        tipBb: "Bollinger Bands. Reflects market volatility.",
        tipFg: "Fear and Greed Index. Sentiment from 0 (fear) to 100 (greed).",
        lblSecurityBadge: "🛡️ Protected",
        lblSecurityBadgeTitle: "Full safety from financial advice and command injection",
        langToggleTitle: "Switch Language",
        sentimentLabels: {
            strongSell: "Strong Sell",
            sell: "Sell",
            neutral: "Neutral",
            buy: "Buy",
            strongBuy: "Strong Buy",
            sentimentTitle: "Market Sentiment"
        },
        lblExportBtn: "Export Report",
        lblApiKeyTitle: "Gemini API Key",
        apiKeyPlaceholder: "Enter API Key...",
        btnApplyKey: "Apply Key",
        lblRefreshBtn: "Refresh Data",
        tipRefreshStats: "Refresh market data only",
        lblPatternsLabel: "Candlestick Patterns",
        tipPatterns: "Active patterns scanned on the daily Binance chart (e.g. Doji, Hammer, Shooting Star, Engulfing)."
    }
};

// Version Check & State Reset on Redeploy
const APP_VERSION = "1.6.0";
const savedVersion = localStorage.getItem("app_version");
if (savedVersion !== APP_VERSION) {
    localStorage.clear();
    localStorage.setItem("app_version", APP_VERSION);
}

// State Variables
let currentLanguage = localStorage.getItem("lang") || "en";
let currentTheme = localStorage.getItem("theme") || "dark";
let currentCoin = "bitcoin";
let activeTab = "summary";
let tvWidgetInstance = null;
let currentSentimentTimeframe = "12h";
let lastRawSummary = "";

// Auth Headers Vault helper
function getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    const customKey = sessionStorage.getItem("custom_api_key");
    if (customKey) {
        headers["Authorization"] = `Bearer ${customKey}`;
    }
    return headers;
}

// TA Quiz Database
const QUIZ_QUESTIONS = {
    ru: [
        {
            q: "Что означает пересечение линии SMA-50 выше SMA-200?",
            options: [
                "«Смертельный крест» — медвежий сигнал на продажу",
                "«Золотой крест» — бычий сигнал на покупку",
                "Сигнал о сильной перекупленности по RSI",
                "Сигнал о росте волатильности рынка"
            ],
            answer: 1,
            explanation: "Пересечение краткосрочной скользящей средней (SMA-50) снизу вверх через долгосрочную (SMA-200) называется «Золотым крестом» и является классическим бычьим сигналом."
        },
        {
            q: "Какой уровень RSI традиционно указывает на перепроданность актива?",
            options: [
                "Выше 70",
                "Около 50",
                "Ниже 30",
                "Равный 0"
            ],
            answer: 2,
            explanation: "Значения RSI ниже 30 традиционно считаются признаком перепроданности, что указывает на возможное завершение нисходящего тренда и отскок вверх."
        },
        {
            q: "Какое поведение цены характерно при выходе за верхнюю границу полос Боллинджера?",
            options: [
                "Цена считается перекупленной, возможен откат",
                "Цена считается перепроданной, возможен рост",
                "Начинается фаза консолидации",
                "Это гарантирует продолжение бесконечного роста"
            ],
            answer: 0,
            explanation: "Полосы Боллинджера отражают волатильность. Выход цены за верхнюю полосу указывает на перекупленность и повышает вероятность отката к средней линии."
        },
        {
            q: "Что показывает гистограмма индикатора MACD?",
            options: [
                "Объем торгов на бирже",
                "Расстояние между линией MACD и сигнальной линией",
                "Сумму всех скользящих средних",
                "Уровень страха мелких инвесторов"
            ],
            answer: 1,
            explanation: "Гистограмма MACD визуализирует разницу (расстояние) между линией MACD и сигнальной линией. Рост гистограммы выше нуля подтверждает усиление бычьего импульса."
        },
        {
            q: "Что обычно сигнализирует свечной паттерн Доджи (Doji)?",
            options: [
                "Резкое продолжение текущего сильного тренда",
                "Неопределенность на рынке и возможный близкий разворот тренда",
                "Обязательное падение цены в ближайшие 24 часа",
                "Полное отсутствие торгов по активу на бирже"
            ],
            answer: 1,
            explanation: "Свеча Доджи формируется, когда цена открытия и закрытия практически равны. Это показывает равенство сил быков и медведей, сигнализируя о неопределенности и возможном развороте."
        },
        {
            q: "Что происходит, когда цена пробивает сильный уровень сопротивления (Resistance) снизу вверх?",
            options: [
                "Этот уровень сопротивления часто становится новым уровнем поддержки (Support)",
                "Этот уровень сопротивления исчезает навсегда и больше не влияет на цену",
                "Цена гарантированно упадет обратно ниже этого уровня на следующей свече",
                "Индикатор Fear & Greed автоматически падает до зоны экстремального страха"
            ],
            answer: 0,
            explanation: "Когда уровень сопротивления пробивается вверх, роли меняются: бывшее сопротивление часто превращается в новый уровень поддержки (зеркальный уровень)."
        },
        {
            q: "Как интерпретируются значения Стохастического осциллятора (Stochastic) выше 80?",
            options: [
                "Актив перепродан, формируется сигнал на покупку",
                "Актив перекуплен, возможен разворот цены вниз",
                "Объем торгов вырос более чем на 80% за последние сутки",
                "Тренд перешел в стадию долгосрочной консолидации"
            ],
            answer: 1,
            explanation: "Традиционно значения Стохастика выше 80 указывают на перекупленность актива, а значения ниже 20 — на перепроданность."
        },
        {
            q: "Какое значение имеет рост объемов торгов при пробое ценового уровня?",
            options: [
                "Объем не имеет значения при техническом анализе пробоев",
                "Высокий объем подтверждает истинность пробоя и силу импульса",
                "Высокий объем указывает на ложный пробой и скорый возврат цены",
                "Это означает, что маркетмейкеры полностью вышли из данного актива"
            ],
            answer: 1,
            explanation: "Объем подтверждает тренд. Пробой уровня на высоком объеме торгов указывает на сильный интерес участников рынка и повышает вероятность продолжения движения."
        },
        {
            q: "Что означает дивергенция (divergence) между графиком цены и индикатором RSI?",
            options: [
                "Сигнал о продолжении текущего сильного тренда без изменений",
                "Расхождение цены и индикатора, предвещающее возможный разворот тренда",
                "Сигнал о временном закрытии торгов по данному активу",
                "Указание на равенство объемов торгов покупателей и продавцов"
            ],
            answer: 1,
            explanation: "Дивергенция возникает, когда цена обновляет экстремум (максимум или минимум), а индикатор этого не подтверждает. Это один из сильнейших сигналов о затухании импульса и возможном развороте тренда."
        },
        {
            q: "Какую роль играет линия шеи (neckline) в фигуре разворота «Голова и плечи» (Head and Shoulders)?",
            options: [
                "Это уровень поддержки, пробой которого вниз подтверждает разворот тренда",
                "Это уровень сопротивления, пробой которого вверх означает продолжение роста",
                "Это средняя скользящая, рассчитываемая за последние 100 дней",
                "Это индикатор волатильности, аналогичный полосам Боллинджера"
            ],
            answer: 0,
            explanation: "Линия шеи строится по минимумам фигуры. В классическом техническом анализе пробой этой линии сверху вниз завершает формирование фигуры «Голова и плечи» и служит сигналом к продаже."
        },
        {
            q: "Какой тип скользящей средней (Moving Average) реагирует на последние изменения цены быстрее?",
            options: [
                "Простая скользящая средняя (SMA)",
                "Экспоненциальная скользящая средняя (EMA)",
                "Взвешенная скользящая средняя (WMA)",
                "Все скользящие средние реагируют с абсолютно одинаковой скоростью"
            ],
            answer: 1,
            explanation: "Экспоненциальная скользящая средняя (EMA) придает больший вес последним ценовым данным, поэтому она реагирует на изменения цен быстрее, чем простая скользящая средняя (SMA)."
        },
        {
            q: "Какое рыночное состояние характеризуется паттерном «Флаг» (Flag)?",
            options: [
                "Долгосрочный разворот тренда в противоположную сторону",
                "Краткосрочная пауза (консолидация) перед продолжением предшествующего движения",
                "Полный флэт без какого-либо направления в течение нескольких месяцев",
                "Переход актива в фазу делистинга"
            ],
            answer: 1,
            explanation: "Паттерн «Флаг» является фигурой продолжения тренда. После сильного импульсного движения цена консолидируется в узком канале, после чего обычно следует пробой в направлении первоначального импульса."
        }
    ],
    en: [
        {
            q: "What does it mean when the SMA-50 line crosses above the SMA-200?",
            options: [
                "'Death Cross' — a bearish sell signal",
                "'Golden Cross' — a bullish buy signal",
                "RSI indicates overbought conditions",
                "Bollinger Bands show volatility growth"
            ],
            answer: 1,
            explanation: "When a shorter-term moving average (SMA-50) crosses above a longer-term moving average (SMA-200), it forms a 'Golden Cross', which is a classic bullish indicator."
        },
        {
            q: "Which RSI level traditionally indicates that an asset is oversold?",
            options: [
                "Above 70",
                "Around 50",
                "Below 30",
                "Exactly 0"
            ],
            answer: 2,
            explanation: "RSI values below 30 traditionally indicate that the asset is oversold, suggesting a potential price rebound or trend reversal."
        },
        {
            q: "What price behavior is expected when it exits above the upper Bollinger Band?",
            options: [
                "The asset is overbought, suggesting a potential pullback",
                "The asset is oversold, suggesting a potential pump",
                "Market enters consolidation phase",
                "It guarantees a continuation of parabolic growth"
            ],
            answer: 0,
            explanation: "Bollinger Bands reflect volatility. When price reaches or exceeds the upper band, it is considered relatively high (overbought), increasing the likelihood of a pullback."
        },
        {
            q: "What does the MACD histogram show?",
            options: [
                "Market trading volume",
                "The difference between the MACD line and the signal line",
                "The sum of all moving averages",
                "The retail investor fear level"
            ],
            answer: 1,
            explanation: "The MACD histogram represents the difference between the MACD line and its signal line. An increasing histogram above zero indicates growing bullish momentum."
        },
        {
            q: "What does a Doji candlestick pattern typically signal?",
            options: [
                "A strong continuation of the current trend",
                "Market indecision and a potential trend reversal",
                "An obligatory price drop in the next 24 hours",
                "A complete lack of trading volume on the exchange"
            ],
            answer: 1,
            explanation: "A Doji candle is formed when the opening and closing prices are virtually equal. It shows that bulls and bears are at an impasse, indicating market indecision and a potential trend change."
        },
        {
            q: "What often happens when the price breaks above a strong resistance level?",
            options: [
                "The resistance level often turns into a new support level",
                "The resistance level disappears forever and no longer affects price",
                "The price is guaranteed to drop back below this level on the next candle",
                "The Fear & Greed Index automatically drops to the Extreme Fear zone"
            ],
            answer: 0,
            explanation: "When a resistance level is broken to the upside, roles reverse: the former resistance often becomes a new support level (known as support/resistance flip)."
        },
        {
            q: "How are Stochastic Oscillator values above 80 traditionally interpreted?",
            options: [
                "The asset is oversold, generating a buy signal",
                "The asset is overbought, suggesting a potential downward reversal",
                "Trading volume has increased by over 80% in the last 24 hours",
                "The trend has entered a long-term consolidation phase"
            ],
            answer: 1,
            explanation: "Traditionally, Stochastic values above 80 indicate that the asset is overbought, while values below 20 indicate that the asset is oversold."
        },
        {
            q: "What is the significance of rising trading volume during a price level breakout?",
            options: [
                "Volume has no significance in the technical analysis of breakouts",
                "High volume confirms the validity of the breakout and momentum strength",
                "High volume indicates a fake breakout (fakeout) and quick price return",
                "It means market makers have completely exited the asset"
            ],
            answer: 1,
            explanation: "Volume confirms the trend. A breakout on high trading volume indicates strong market participant interest and increases the likelihood of a sustained move."
        },
        {
            q: "What does a divergence between the price chart and the RSI indicator signify?",
            options: [
                "A signal that the current trend will continue unchanged",
                "A disagreement between price and momentum, signaling a potential trend reversal",
                "An indication that trading for the asset has been temporarily suspended",
                "A sign that buy and sell trading volumes are perfectly equal"
            ],
            answer: 1,
            explanation: "Divergence occurs when the price makes a new high or low but the indicator does not. It is one of the strongest signals of momentum loss and potential trend reversal."
        },
        {
            q: "What role does the neckline play in a Head and Shoulders reversal pattern?",
            options: [
                "It is a support level, and breaking below it confirms the trend reversal",
                "It is a resistance level, and breaking above it signals continued growth",
                "It is a moving average calculated over the last 100 days",
                "It is a volatility indicator similar to Bollinger Bands"
            ],
            answer: 0,
            explanation: "The neckline is drawn by connecting the lows of the pattern. In classical technical analysis, a breakout below this line completes the Head and Shoulders pattern and serves as a sell signal."
        },
        {
            q: "Which type of Moving Average responds to recent price changes faster?",
            options: [
                "Simple Moving Average (SMA)",
                "Exponential Moving Average (EMA)",
                "Weighted Moving Average (WMA)",
                "All moving averages respond with the exact same speed"
            ],
            answer: 1,
            explanation: "The Exponential Moving Average (EMA) places a greater weight on the most recent price data, allowing it to react to price fluctuations faster than a Simple Moving Average (SMA)."
        },
        {
            q: "What market condition is characterized by a Flag chart pattern?",
            options: [
                "A long-term trend reversal in the opposite direction",
                "A short-term pause (consolidation) before continuing the prior trend",
                "A complete flat market without any direction for several months",
                "The transition of the asset into a delisting phase"
            ],
            answer: 1,
            explanation: "The Flag pattern is a trend continuation pattern. Following a sharp price movement, the price consolidates in a narrow channel, which is typically followed by a breakout in the direction of the initial move."
        }
    ]
};

const INDICATORS_OF_THE_DAY = [
    {
        id: "rsi",
        name: {
            en: "RSI (Relative Strength Index)",
            ru: "RSI (Индекс относительной силы)"
        },
        desc: {
            en: "A momentum oscillator that measures the speed and change of price movements between 0 and 100.",
            ru: "Осциллятор импульса, измеряющий скорость и изменение ценовых движений в диапазоне от 0 до 100."
        },
        query: {
            en: "Tell me in detail about the RSI (Relative Strength Index) indicator. What is it, how does it work, what default settings to use (length 14, levels 30/70), and how to configure and apply it on the TradingView widget?",
            ru: "Расскажи подробно про индикатор RSI (Relative Strength Index). Что это такое, как он работает, какие стандартные настройки использовать (например, длина 14, уровни 30/70) и как настроить и применить его на виджете TradingView?"
        }
    },
    {
        id: "macd",
        name: {
            en: "MACD (Moving Average Convergence Divergence)",
            ru: "MACD (Схождение/расхождение скользящих средних)"
        },
        desc: {
            en: "A trend-following momentum indicator that shows the relationship between two moving averages of price.",
            ru: "Трендовый индикатор импульса, показывающий взаимосвязь между двумя скользящими средними цены."
        },
        query: {
            en: "Tell me in detail about the MACD indicator. What is it, how does it work (MACD line, signal line, histogram), what default settings to use (12, 26, 9), and how to configure and apply it on the TradingView widget?",
            ru: "Расскажи подробно про индикатор MACD. Что это такое, как он работает (линия MACD, сигнальная линия, гистограмма), какие стандартные настройки использовать (12, 26, 9) и как настроить и применить его на виджете TradingView?"
        }
    },
    {
        id: "bollinger",
        name: {
            en: "Bollinger Bands",
            ru: "Полосы Боллинджера"
        },
        desc: {
            en: "A volatility indicator consisting of a simple moving average and two standard deviation bands.",
            ru: "Индикатор волатильности, состоящий из простой скользящей средней и двух полос среднеквадратического отклонения."
        },
        query: {
            en: "Tell me in detail about the Bollinger Bands indicator. What is it, how does it work (upper, middle, lower bands), what default settings to use (20, 2), and how to configure and apply it on the TradingView widget?",
            ru: "Расскажи подробно про индикатор Bollinger Bands (Полосы Боллинджера). Что это такое, как он работает (верхняя, средняя и нижняя полосы), какие стандартные настройки использовать (20, 2) и как настроить и применить его на виджете TradingView?"
        }
    },
    {
        id: "stochastic",
        name: {
            en: "Stochastic Oscillator",
            ru: "Стохастический осциллятор"
        },
        desc: {
            en: "A momentum indicator comparing a closing price to its price range over a certain period.",
            ru: "Индикатор импульса, сравнивающий цену закрытия с диапазоном ее цен за определенный период."
        },
        query: {
            en: "Tell me in detail about the Stochastic Oscillator. What is it, how does it work (lines %K and %D, overbought/oversold levels), what settings to use (14, 3, 3), and how to configure and apply it on the TradingView widget?",
            ru: "Расскажи подробно про Стохастический осциллятор (Stochastic Oscillator). Что это такое, как он работает (линии %K и %D, зоны перекупленности/перепроданности), какие настройки использовать (14, 3, 3) и как настроить и применить его на виджете TradingView?"
        }
    },
    {
        id: "ema",
        name: {
            en: "EMA (Exponential Moving Average)",
            ru: "EMA (Экспоненциальная скользящая средняя)"
        },
        desc: {
            en: "A moving average that places a greater weight and significance on the most recent data points.",
            ru: "Скользящая средняя, придающая больший вес и значение самым последним ценовым точкам."
        },
        query: {
            en: "Tell me in detail about the EMA (Exponential Moving Average) indicator. What is it, how does it differ from SMA, what common periods to use (e.g. EMA 9, 20, 50, 200), and how to configure and apply it on the TradingView widget?",
            ru: "Расскажи подробно про индикатор EMA (Exponential Moving Average). Что это такое, чем отличается от SMA, какие стандартные периоды использовать (например, EMA 9, 20, 50, 200) и как настроить и применить его на виджете TradingView?"
        }
    },
    {
        id: "ichimoku",
        name: {
            en: "Ichimoku Cloud",
            ru: "Облако Ишимоку"
        },
        desc: {
            en: "A comprehensive indicator that defines support/resistance, trend direction, and momentum.",
            ru: "Комплексный индикатор, определяющий уровни поддержки/сопротивления, направление тренда и импульс."
        },
        query: {
            en: "Tell me in detail about the Ichimoku Cloud indicator. What is it, what lines is it composed of (Tenkan-sen, Kijun-sen, Senkou Span A/B, Chikou Span), how to read its signals, and how to configure it on the TradingView widget?",
            ru: "Расскажи подробно про индикатор Ichimoku Cloud (Облако Ишимоку). Что это такое, из каких линий оно состоит (Tenkan-sen, Kijun-sen, Senkou Span A/B, Chikou Span), как читать сигналы облака и как настроить его на виджете TradingView?"
        }
    },
    {
        id: "fibonacci",
        name: {
            en: "Fibonacci Retracement",
            ru: "Коррекция Фибоначчи"
        },
        desc: {
            en: "A tool using horizontal lines to indicate areas of support or resistance at the key Fibonacci levels.",
            ru: "Инструмент горизонтальных линий для отображения уровней поддержки/сопротивления на ключевых числах Фибоначчи."
        },
        query: {
            en: "Tell me in detail about the Fibonacci Retracement tool. What is it, which levels are key (0.382, 0.5, 0.618), how to draw the grid correctly, and how to configure and apply this tool on the TradingView widget?",
            ru: "Расскажи подробно про инструмент Коррекция Фибоначчи (Fibonacci Retracement). Что это такое, какие уровни являются ключевыми (0.382, 0.5, 0.618), как правильно натягивать сетку на график и как настроить и применить этот инструмент на виджете TradingView?"
        }
    },
    {
        id: "vwap",
        name: {
            en: "VWAP (Volume Weighted Average Price)",
            ru: "VWAP (Средневзвешенная объемом цена)"
        },
        desc: {
            en: "A trading benchmark that gives the average price an asset has traded at throughout the day, based on volume.",
            ru: "Торговый ориентир, показывающий среднюю цену актива за день с учетом объема торгов."
        },
        query: {
            en: "Tell me in detail about the VWAP (Volume Weighted Average Price) indicator. What is it, why is it important for intraday traders, how to interpret it, and how to configure and apply it on the TradingView widget?",
            ru: "Расскажи подробно про индикатор VWAP (Volume Weighted Average Price). Что это такое, почему он важен для внутридневных трейдеров, как его интерпретировать и как настроить и применить его на виджете TradingView?"
        }
    },
    {
        id: "atr",
        name: {
            en: "ATR (Average True Range)",
            ru: "ATR (Средний истинный диапазон)"
        },
        desc: {
            en: "A volatility indicator that shows how much an asset moves, on average, during a given time frame.",
            ru: "Индикатор волатильности, показывающий, насколько в среднем перемещается цена актива за определенный таймфрейм."
        },
        query: {
            en: "Tell me in detail about the ATR (Average True Range) indicator. What is it, how does it measure volatility, how to use it to set Stop Loss levels, and how to configure and apply it on the TradingView widget?",
            ru: "Расскажи подробно про индикатор ATR (Average True Range). Что это такое, как он измеряет волатильность, как использовать его для выставления стоп-лоссов (Stop Loss) и как настроить и применить его на виджете TradingView?"
        }
    },
    {
        id: "adx",
        name: {
            en: "ADX (Average Directional Index)",
            ru: "ADX (Индекс среднего направления)"
        },
        desc: {
            en: "An indicator used to measure the overall strength of a trend, regardless of its direction.",
            ru: "Индикатор для измерения общей силы тренда, независимо от его направления."
        },
        query: {
            en: "Tell me in detail about the ADX (Average Directional Index) indicator. What is it, how does it measure trend strength, what thresholds are important (e.g. above 25), and how to configure and apply it on the TradingView widget?",
            ru: "Расскажи подробно про индикатор ADX (Average Directional Index). Что это такое, как он измеряет силу тренда (в отличие от направления), какие уровни важны (например, выше 25) и как настроить и применить его на виджете TradingView?"
        }
    },
    {
        id: "parabolic_sar",
        name: {
            en: "Parabolic SAR",
            ru: "Parabolic SAR"
        },
        desc: {
            en: "A trend-following indicator used to determine direction and identify potential trend reversals.",
            ru: "Трендовый индикатор для определения направления движения цены и поиска потенциальных точек разворота."
        },
        query: {
            en: "Tell me in detail about the Parabolic SAR indicator. What is it, how do dots above or below the price show trend direction and reversal points, and how to configure and apply it on the TradingView widget?",
            ru: "Расскажи подробно про индикатор Parabolic SAR. Что это такое, как точки над и под ценой показывают направление тренда и точки разворота, и как настроить и применить его на виджете TradingView?"
        }
    },
    {
        id: "supertrend",
        name: {
            en: "Supertrend",
            ru: "Супертренд"
        },
        desc: {
            en: "A simple trend-following indicator based on ATR that plots buy/sell signals on the chart.",
            ru: "Простой трендовый индикатор на основе ATR, который строит линии поддержки/сопротивления и дает торговые сигналы."
        },
        query: {
            en: "Tell me in detail about the Supertrend indicator. What is it, how does it use ATR to construct support/resistance levels and generate buy/sell signals, and how to configure and apply it on the TradingView widget?",
            ru: "Расскажи подробно про индикатор Supertrend (Супертренд). Что это такое, как он использует ATR для построения уровней поддержки/сопротивления и генерации сигналов buy/sell, и как настроить и применить его на виджете TradingView?"
        }
    }
];

// Calculate default indicator of the day based on the day of the year
const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
let currentIndicatorIndex = dayOfYear % INDICATORS_OF_THE_DAY.length;

let currentQuizQuestionIndex = 0;
let quizScore = parseInt(localStorage.getItem("quiz_score") || "0");

// Chat histories cached by coin ID
let chatHistories = {};
try {
    const savedHistories = localStorage.getItem("chat_histories");
    if (savedHistories) {
        chatHistories = JSON.parse(savedHistories);
    }
} catch (e) {
    console.error("Failed to parse chat histories on startup", e);
    chatHistories = {};
}

// DOM Elements
const coinSelector = document.getElementById("coin-selector");
const langToggleBtn = document.getElementById("lang-toggle-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const chatInput = document.getElementById("chat-input");
const chatSendBtn = document.getElementById("chat-send-btn");
const chatMessagesContainer = document.getElementById("chat-messages-container");
const quickChipsContainer = document.getElementById("quick-chips-container");
const aiSummaryText = document.getElementById("ai-summary-text");
const summaryLoading = document.getElementById("summary-loading");
const newsContainerList = document.getElementById("news-container-list");

// Stats display elements
const coinDisplayName = document.getElementById("coin-display-name");
const coinDisplayPrice = document.getElementById("coin-display-price");
const coinDisplayChange = document.getElementById("coin-display-change");
const valHigh24h = document.getElementById("val-high-24h");
const valLow24h = document.getElementById("val-low-24h");
const valVolume = document.getElementById("val-volume");
const valCap = document.getElementById("val-cap");

// -------------------------------------------------------------------------
// Theme & Language Initialization
// -------------------------------------------------------------------------

function initTheme() {
    if (currentTheme === "light") {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        themeToggleBtn.textContent = "☀️";
    } else {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        themeToggleBtn.textContent = "🌙";
    }
}

function toggleTheme() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", currentTheme);
    initTheme();
    renderTradingViewWidget(); // Re-render chart to apply theme
}

function toggleLanguage() {
    currentLanguage = currentLanguage === "ru" ? "en" : "ru";
    localStorage.setItem("lang", currentLanguage);
    langToggleBtn.textContent = currentLanguage.toUpperCase();
    
    localizeUI();
    loadAIContent(); // Reload AI Summary & news in new language
    initChatSession(); // Restore/re-render chat history or initialize welcome message
}

function localizeUI() {
    const t = LOCALIZATION[currentLanguage];
    if (langToggleBtn) {
        langToggleBtn.textContent = currentLanguage.toUpperCase();
    }
    document.getElementById("header-subtitle").textContent = t.subtitle;
    document.getElementById("label-select-coin").textContent = t.lblSelectCoin;
    document.getElementById("lbl-high-24h").textContent = t.lblHigh24h;
    document.getElementById("lbl-low-24h").textContent = t.lblLow24h;
    document.getElementById("lbl-volume").textContent = t.lblVolume;
    document.getElementById("lbl-cap").textContent = t.lblCap;
    document.getElementById("tab-summary-btn").textContent = t.tabSummary;
    document.getElementById("tab-news-btn").textContent = t.tabNews;
    document.getElementById("lbl-advisor-status").textContent = t.lblAdvisorStatus;
    document.getElementById("chat-disclaimer-text").innerHTML = t.chatDisclaimer;
    chatInput.placeholder = t.chatPlaceholder;
    document.getElementById("lbl-loading-summary").textContent = t.lblLoadingSummary;
    
    // Additional elements localized dynamically
    document.getElementById("lbl-indicators-title").textContent = t.lblIndicatorsTitle;
    document.getElementById("lbl-indicator-sma-label").textContent = t.lblSmaLabel;
    document.getElementById("lbl-indicator-fg-label").textContent = t.lblFgLabel;
    const patternsLabel = document.getElementById("lbl-indicator-patterns-label");
    if (patternsLabel) patternsLabel.textContent = t.lblPatternsLabel;
    
    document.getElementById("tip-rsi").setAttribute("data-tooltip", t.tipRsi);
    document.getElementById("tip-macd").setAttribute("data-tooltip", t.tipMacd);
    document.getElementById("tip-sma").setAttribute("data-tooltip", t.tipSma);
    document.getElementById("tip-bb").setAttribute("data-tooltip", t.tipBb);
    document.getElementById("tip-fg").setAttribute("data-tooltip", t.tipFg);
    const patternsTip = document.getElementById("tip-patterns");
    if (patternsTip) patternsTip.setAttribute("data-tooltip", t.tipPatterns);
    
    const secBadge = document.getElementById("lbl-security-badge");
    secBadge.textContent = t.lblSecurityBadge;
    secBadge.setAttribute("title", t.lblSecurityBadgeTitle);
    
    langToggleBtn.setAttribute("title", t.langToggleTitle);
    
    const closeBtn = document.getElementById("btn-close-disclaimer");
    if (closeBtn) {
        closeBtn.setAttribute("title", currentLanguage === "ru" ? "Закрыть предупреждение" : "Close warning");
    }

    const expBtnLabel = document.getElementById("lbl-export-btn");
    if (expBtnLabel) {
        expBtnLabel.textContent = t.lblExportBtn;
    }
    
    const refBtnLabel = document.getElementById("lbl-refresh-btn");
    if (refBtnLabel) {
        refBtnLabel.textContent = t.lblRefreshBtn;
    }
    
    const refStatsBtn = document.getElementById("refresh-stats-btn");
    if (refStatsBtn) {
        refStatsBtn.setAttribute("title", t.tipRefreshStats);
    }
    
    // Translate Market Sentiment Title and Update Gauge
    document.getElementById("lbl-sentiment-title").textContent = t.sentimentLabels.sentimentTitle;
    updateSentimentUI();

    // Translate API Key Card
    const apiKeyTitle = document.getElementById("lbl-api-key-title");
    const apiKeyInput = document.getElementById("api-key-input");
    const apiKeyBtn = document.getElementById("api-key-submit-btn");
    if (apiKeyTitle) apiKeyTitle.textContent = t.lblApiKeyTitle;
    if (apiKeyInput) apiKeyInput.placeholder = t.apiKeyPlaceholder;
    if (apiKeyBtn) apiKeyBtn.textContent = t.btnApplyKey;

    // Translate Backtester
    const lblSelectStrat = document.getElementById("lbl-select-strategy");
    if (lblSelectStrat) lblSelectStrat.textContent = currentLanguage === "ru" ? "Стратегия" : "Strategy";
    const runBtBtn = document.getElementById("run-backtest-btn");
    if (runBtBtn) runBtBtn.textContent = currentLanguage === "ru" ? "Запустить бэктест" : "Run Backtest";
    const lblLoadingBt = document.getElementById("lbl-loading-backtest");
    if (lblLoadingBt) lblLoadingBt.textContent = currentLanguage === "ru" ? "Запуск симуляции стратегии..." : "Running Strategy Simulation...";
    const lblBtProfit = document.getElementById("lbl-bt-profit");
    if (lblBtProfit) lblBtProfit.textContent = currentLanguage === "ru" ? "Чистая прибыль" : "Net Profit";
    const lblBtWinrate = document.getElementById("lbl-bt-winrate");
    if (lblBtWinrate) lblBtWinrate.textContent = currentLanguage === "ru" ? "Доля побед" : "Win Rate";
    const lblBtTrades = document.getElementById("lbl-bt-trades");
    if (lblBtTrades) lblBtTrades.textContent = currentLanguage === "ru" ? "Всего сделок" : "Total Trades";
    const lblBtDrawdown = document.getElementById("lbl-bt-drawdown");
    if (lblBtDrawdown) lblBtDrawdown.textContent = currentLanguage === "ru" ? "Макс. просадка" : "Max Drawdown";
    const lblBtCurve = document.getElementById("lbl-bt-curve");
    if (lblBtCurve) lblBtCurve.textContent = currentLanguage === "ru" ? "График роста капитала" : "Equity Growth Curve";

    // Translate Quiz
    const lblQuizTitle = document.getElementById("lbl-quiz-title");
    if (lblQuizTitle) lblQuizTitle.textContent = currentLanguage === "ru" ? "Викторина по тех. анализу" : "Technical Analysis Quiz";
    loadQuizQuestion();
}

// -------------------------------------------------------------------------
// TradingView Integration
// -------------------------------------------------------------------------

function renderTradingViewWidget() {
    const symbol = TRADINGVIEW_SYMBOLS[currentCoin] || "BINANCE:BTCUSDT";
    
    // Clear container
    document.getElementById("tv-chart-container").innerHTML = "";
    
    tvWidgetInstance = new TradingView.widget({
        "width": "100%",
        "height": "100%",
        "symbol": symbol,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": currentTheme,
        "style": "1",
        "locale": currentLanguage === "ru" ? "ru" : "en",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": false,
        "container_id": "tv-chart-container"
    });
}

// -------------------------------------------------------------------------
// Market & AI Data Loading
// -------------------------------------------------------------------------

function renderSummaryError() {
    const retryText = currentLanguage === "ru" ? "🔄 Повторить попытку" : "🔄 Retry Generation";
    const errorText = LOCALIZATION[currentLanguage].errorSummary;
    
    aiSummaryText.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-secondary); background: rgba(244, 63, 94, 0.04); border: 1px dashed rgba(244, 63, 94, 0.2); border-radius: 12px; margin-top: 14px;">
            <p style="margin-bottom: 14px; color: var(--neon-rose); font-weight: 600; font-size: 0.95rem;">⚠️ ${errorText}</p>
            <button class="control-btn" style="margin: 0 auto; display: flex; align-items: center; gap: 8px; font-weight: 700; padding: 8px 16px; font-size: 0.85rem;" onclick="loadAIContent()">
                ${retryText}
            </button>
        </div>
    `;
    aiSummaryText.style.display = "block";
}

async function loadStatsOnly(forceRefresh = false) {
    try {
        const response = await fetch(`/api/market-data/${currentCoin}?lang=${currentLanguage}${forceRefresh ? '&force_refresh=true' : ''}`);
        const data = await response.json();
        if (data.success) {
            updateStatsUI(data.market_data);
            updateIndicatorsUI(data.indicators);
            renderNewsUI(data.news);
        }
    } catch (e) {
        console.error("Failed to load market data", e);
    }
}

async function loadAIContent(forceRefresh = false) {
    // 1. Fetch Stats, Indicators and News from API
    await loadStatsOnly(forceRefresh);

    // 2. Fetch AI Summary
    summaryLoading.style.display = "flex";
    aiSummaryText.style.display = "none";
    lastRawSummary = "";
    try {
        const response = await fetch("/api/summary", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ coin_id: currentCoin, lang: currentLanguage, force_refresh: forceRefresh })
        });
        const data = await response.json();
        if (data.success) {
            lastRawSummary = data.summary;
            aiSummaryText.innerHTML = formatMarkdown(data.summary);
            aiSummaryText.style.display = "block";
            // Show/hide simulated-mode warning banner
            const simBanner = document.getElementById("simulated-warning");
            const simText   = document.getElementById("simulated-warning-text");
            if (data.simulated) {
                simText.textContent = currentLanguage === "ru"
                    ? "⚠️ Квота AI исчерпана — показывается смоделированный анализ (демо-режим)"
                    : "⚠️ AI quota exhausted — showing simulated analysis (demo mode)";
                simBanner.style.display = "flex";
            } else {
                simBanner.style.display = "none";
            }
        } else {
            renderSummaryError();
        }
    } catch (e) {
        renderSummaryError();
    } finally {
        summaryLoading.style.display = "none";
        updateQuotaUI(); // refresh quota counters after each summary fetch
    }
}

async function refreshDashboardData() {
    const btn = document.getElementById("refresh-data-btn");
    const icon = btn ? btn.querySelector(".refresh-icon") : null;
    
    if (icon) {
        icon.classList.add("spinning");
    }
    if (btn) {
        btn.disabled = true;
        const label = document.getElementById("lbl-refresh-btn");
        if (label) {
            label.textContent = currentLanguage === "ru" ? "Обновление..." : "Refreshing...";
        }
    }
    
    const statsCard = document.getElementById("market-stats-card");
    if (statsCard) {
        statsCard.classList.add("refreshing-pulse");
    }
    
    try {
        await loadAIContent(true);
    } catch (e) {
        console.error("Refresh failed", e);
    } finally {
        if (icon) {
            icon.classList.remove("spinning");
        }
        if (statsCard) {
            statsCard.classList.remove("refreshing-pulse");
        }
        if (btn) {
            btn.disabled = false;
            const label = document.getElementById("lbl-refresh-btn");
            if (label) {
                label.textContent = LOCALIZATION[currentLanguage].lblRefreshBtn;
            }
        }
    }
}

async function refreshStatsOnly() {
    const btn = document.getElementById("refresh-stats-btn");
    const icon = btn ? btn.querySelector(".refresh-stats-icon") : null;
    
    if (icon) {
        icon.classList.add("spinning");
    }
    if (btn) {
        btn.disabled = true;
    }
    
    const statsCard = document.getElementById("market-stats-card");
    if (statsCard) {
        statsCard.classList.add("refreshing-pulse");
    }
    
    try {
        await loadStatsOnly(true);
    } catch (e) {
        console.error("Refresh stats failed", e);
    } finally {
        if (icon) {
            icon.classList.remove("spinning");
        }
        if (statsCard) {
            statsCard.classList.remove("refreshing-pulse");
        }
        if (btn) {
            btn.disabled = false;
        }
    }
}

// -------------------------------------------------------------------------
// Quota Status Indicator
// -------------------------------------------------------------------------
async function updateQuotaUI() {
    try {
        const res = await fetch("/api/quota-status");
        const q = await res.json();

        const limit = q.free_tier_limit || 20;
        const sUsed = q.summary_calls || 0;
        const cUsed = q.chat_calls    || 0;
        const exhausted = q.quota_exhausted || false;

        // --- counts ---
        const sEl = document.getElementById("quota-s");
        const cEl = document.getElementById("quota-c");
        if (sEl) sEl.textContent = exhausted ? limit : sUsed;
        if (cEl) cEl.textContent = exhausted ? limit : cUsed;

        // --- progress fills ---
        function setFill(fillId, used) {
            const el = document.getElementById(fillId);
            if (!el) return;
            const pct = Math.min((used / limit) * 100, 100);
            el.style.width = pct + "%";
            el.classList.remove("warn", "danger");
            if (pct >= 100 || exhausted) el.classList.add("danger");
            else if (pct >= 70)          el.classList.add("warn");
        }
        setFill("quota-fill-summary", sUsed);
        setFill("quota-fill-chat",    cUsed);

        // --- exhausted badge ---
        const badge = document.getElementById("quota-exhausted-badge");
        const badgeText = document.getElementById("quota-exhausted-text");
        if (badge) {
            badge.style.display = exhausted ? "inline" : "none";
            if (badgeText) {
                badgeText.textContent = currentLanguage === "ru" ? "Квота исчерпана" : "Quota exhausted";
            }
        }

        // --- reset countdown ---
        const resetEl = document.getElementById("quota-reset-time");
        const resetLabel = document.getElementById("quota-reset-label");
        if (resetEl && q.reset_label) {
            resetEl.textContent = q.reset_label;
        }

        // --- localize static labels ---
        const slbl = document.getElementById("quota-label-summary");
        const clbl = document.getElementById("quota-label-chat");
        if (slbl) slbl.textContent = currentLanguage === "ru" ? "Сводка" : "Summary";
        if (clbl) clbl.textContent = currentLanguage === "ru" ? "Чат"    : "Chat";
        if (resetLabel) {
            const prefix = currentLanguage === "ru" ? "🔄 Сброс через" : "🔄 Resets in";
            resetLabel.innerHTML = `${prefix} <strong id="quota-reset-time">${q.reset_label || "--"}</strong>`;
        }

        // --- bar color when exhausted ---
        const bar = document.getElementById("quota-status-bar");
        if (bar) {
            bar.style.opacity = exhausted ? "0.85" : "1";
        }

    } catch (e) {
        // silently ignore – not critical
    }
}


function updateStatsUI(data) {
    coinDisplayName.textContent = data.name;
    coinDisplayPrice.textContent = `$${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    
    const change = data.change_24h;
    coinDisplayChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    if (change >= 0) {
        coinDisplayChange.className = "change-text positive";
    } else {
        coinDisplayChange.className = "change-text negative";
    }

    valHigh24h.textContent = `$${data.high_24h.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
    valLow24h.textContent = `$${data.low_24h.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
    valVolume.textContent = formatLargeNumber(data.volume_24h);
    valCap.textContent = formatLargeNumber(data.market_cap);
}

function renderNewsUI(newsList) {
    newsContainerList.innerHTML = "";
    if (!newsList || newsList.length === 0) {
        newsContainerList.innerHTML = "<p>No news available.</p>";
        return;
    }

    newsList.forEach(item => {
        const itemEl = document.createElement("div");
        itemEl.className = "news-item";
        
        const date = new Date(item.time * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        
        itemEl.innerHTML = `
            <div class="news-meta">
                <span>${item.source}</span>
                <span>${date}</span>
            </div>
            <a href="${item.url}" target="_blank" class="news-title">${item.title}</a>
            <div class="news-body">${item.body}</div>
        `;
        newsContainerList.appendChild(itemEl);
    });
}

// -------------------------------------------------------------------------
// Chat Management & Session Retention
// -------------------------------------------------------------------------

function initChatSession() {
    // If no history exists for the coin, initialize it with a welcome message
    if (!chatHistories[currentCoin]) {
        const coinLabel = coinSelector.options[coinSelector.selectedIndex].text;
        chatHistories[currentCoin] = [{
            role: "model",
            content: LOCALIZATION[currentLanguage].welcomeMessage.replace("{coin}", coinLabel)
        }];
        saveHistories();
    }
    renderChatMessages();
    renderQuickChips();
}

function renderChatMessages() {
    chatMessagesContainer.innerHTML = "";
    const history = chatHistories[currentCoin] || [];
    
    history.forEach(msg => {
        const msgEl = document.createElement("div");
        msgEl.className = `chat-msg ${msg.role}`;
        msgEl.innerHTML = formatMarkdown(msg.content);

        // TTS speaker button for assistant model replies
        if (msg.role === "model") {
            const speakBtn = document.createElement("button");
            speakBtn.className = "tts-speak-btn";
            speakBtn.innerHTML = "🔊";
            speakBtn.title = currentLanguage === "ru" ? "Озвучить" : "Speak aloud";
            
            // Clean markdown for text synthesis
            const cleanText = msg.content
                .replace(/\[green\]\{([^}]+)\}/g, '$1')
                .replace(/\[red\]\{([^}]+)\}/g, '$1')
                .replace(/\[green\](.*?)\[\/green\]/gi, '$1')
                .replace(/\[red\](.*?)\[\/red\]/gi, '$1')
                .replace(/\[green\]([a-zA-Z0-9_-]+)/g, '$1')
                .replace(/\[red\]([a-zA-Z0-9_-]+)/g, '$1')
                .replace(/\*\*([^*]+)\*\*/g, '$1')
                .replace(/\*([^*]+)\*/g, '$1')
                .replace(/`([^`]+)`/g, '$1');
                
            speakBtn.onclick = (e) => {
                e.stopPropagation();
                speakMessage(cleanText, speakBtn);
            };
            msgEl.appendChild(speakBtn);
        }

        chatMessagesContainer.appendChild(msgEl);
    });
    
    // Auto scroll to bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

let currentSpeakingBtn = null;

function speakMessage(text, btn) {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (currentSpeakingBtn) {
            currentSpeakingBtn.innerHTML = "🔊";
        }
        if (currentSpeakingBtn === btn) {
            currentSpeakingBtn = null;
            return;
        }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const langCode = currentLanguage === "ru" ? "ru-RU" : "en-US";
    const voice = voices.find(v => v.lang.startsWith(langCode));
    if (voice) {
        utterance.voice = voice;
    }
    utterance.lang = langCode;

    utterance.onend = () => {
        btn.innerHTML = "🔊";
        currentSpeakingBtn = null;
    };
    utterance.onerror = () => {
        btn.innerHTML = "🔊";
        currentSpeakingBtn = null;
    };

    btn.innerHTML = "⏹️";
    currentSpeakingBtn = btn;
    window.speechSynthesis.speak(utterance);
}

function renderQuickChips() {
    quickChipsContainer.innerHTML = "";
    const coinLabel = coinSelector.options[coinSelector.selectedIndex].text;
    const chipsText = LOCALIZATION[currentLanguage].chips;
    
    // Select a fresh, unmentioned indicator of the day
    const ind = getFreshIndicatorOfTheDay();
    
    chipsText.forEach(text => {
        const chipEl = document.createElement("span");
        chipEl.className = "chip";
        
        if (text === "indicator_of_the_day") {
            const displayName = currentLanguage === "ru" ? `Изучить индикатор дня: ${ind.name.ru}` : `Study indicator of the day: ${ind.name.en}`;
            chipEl.textContent = displayName;
            chipEl.onclick = () => {
                chatInput.value = ind.query[currentLanguage];
                sendMessage();
            };
        } else {
            const formattedText = text.replace("{coin}", coinLabel);
            chipEl.textContent = formattedText;
            chipEl.onclick = () => {
                chatInput.value = formattedText;
                sendMessage();
            };
        }
        quickChipsContainer.appendChild(chipEl);
    });
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    chatInput.value = "";
    
    // 1. Add user message to history
    chatHistories[currentCoin].push({ role: "user", content: text });
    saveHistories();
    renderChatMessages();

    // Disable input
    chatInput.disabled = true;
    chatSendBtn.disabled = true;

    // 2. Add placeholder model response element
    const modelMsgEl = document.createElement("div");
    modelMsgEl.className = "chat-msg model";
    modelMsgEl.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; border-width: 2px; display: inline-block; vertical-align: middle; margin-right: 6px;"></span>...`;
    chatMessagesContainer.appendChild(modelMsgEl);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    // 3. Request Streaming response (SSE)
    try {
        const historyToSend = chatHistories[currentCoin].slice(0, -1); // send history excluding the new query itself
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                query: text,
                history: historyToSend,
                coin_id: currentCoin,
                lang: currentLanguage
            })
        });

        if (!response.body) {
            throw new Error("No response stream body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let modelResponseText = "";
        modelMsgEl.innerHTML = ""; // Clear loader spinner

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            // SSE chunks are formatted as "data: { ... }\n\n"
            const lines = chunk.split("\n");
            for (let line of lines) {
                line = line.trim();
                if (line.startsWith("data:")) {
                    const dataStr = line.substring(5).trim();
                    if (dataStr === "[DONE]") {
                        break;
                    }
                    let parsed;
                    try {
                        parsed = JSON.parse(dataStr);
                    } catch (e) {
                        // Skip parse errors if chunk is partial
                        continue;
                    }

                    if (parsed && parsed.text) {
                        modelResponseText += parsed.text;
                        modelMsgEl.innerHTML = formatMarkdown(modelResponseText);
                        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                    } else if (parsed && parsed.error) {
                        throw new Error(parsed.error);
                    }
                }
            }
        }

        // Save response to history
        chatHistories[currentCoin].push({ role: "model", content: modelResponseText });
        saveHistories();

    } catch (err) {
        console.error("Stream reading error", err);
        modelMsgEl.innerHTML = `<p style="color: var(--neon-rose);">${LOCALIZATION[currentLanguage].errorChat}</p>`;
    } finally {
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.focus();
        renderQuickChips();
    }
}

function saveHistories() {
    localStorage.setItem("chat_histories", JSON.stringify(chatHistories));
}

// -------------------------------------------------------------------------
// Tab Switching
// -------------------------------------------------------------------------

function switchTab(tabId) {
    activeTab = tabId;
    
    // Manage active headers
    document.getElementById("tab-summary-btn").classList.remove("active");
    document.getElementById("tab-news-btn").classList.remove("active");
    const btBtn = document.getElementById("tab-backtester-btn");
    if (btBtn) btBtn.classList.remove("active");
    
    document.getElementById(`tab-${tabId}-btn`).classList.add("active");
    
    // Manage active contents
    document.getElementById("tab-summary-content").classList.remove("active");
    document.getElementById("tab-news-content").classList.remove("active");
    const btContent = document.getElementById("tab-backtester-content");
    if (btContent) btContent.classList.remove("active");
    
    document.getElementById(`tab-${tabId}-content`).classList.add("active");

    if (tabId === "backtester") {
        const results = document.getElementById("backtest-results");
        if (results && results.style.display === "none") {
            runStrategyBacktest();
        }
    }
}

// -------------------------------------------------------------------------
// Formatting Helpers
// -------------------------------------------------------------------------

function preprocessMarkdownTerms(text) {
    let formatted = text;
    
    const termMapping = {
        "Bearish Engulfing": "Bearish Engulfing",
        "Bullish Engulfing": "Bullish Engulfing",
        "Shooting Star": "Shooting Star",
        "Hammer": "Hammer",
        "Doji": "Doji",
        "медвежье поглощение": "Bearish Engulfing",
        "бычье поглощение": "Bullish Engulfing",
        "медвежьего поглощения": "Bearish Engulfing",
        "бычьего поглощения": "Bullish Engulfing",
        "падающая звезда": "Shooting Star",
        "падающей звезды": "Shooting Star",
        "молот": "Hammer",
        "доджи": "Doji",
        
        "Death Cross": "SMA Crossover",
        "Golden Cross": "SMA Crossover",
        "SMA-50": "SMA Crossover",
        "SMA-200": "SMA Crossover",
        "SMA": "SMA Crossover",
        "RSI": "RSI",
        "MACD": "MACD",
        "Bollinger Bands": "Bollinger Bands",
        "Fear & Greed Index": "Fear & Greed Index",
        "Fear and Greed": "Fear & Greed Index",
        "consolidation phase": "Market Consolidation",
        "whales": "Market Whales",
        "whale": "Market Whales",
        "overbought": "RSI Overbought",
        "oversold": "RSI Oversold",
        "bearish": "Bearish Trend",
        "bullish": "Bullish Trend",
        "sideways": "Sideways Trend",
        
        "Крест смерти": "SMA Crossover",
        "Золотой крест": "SMA Crossover",
        "скользящие средние": "SMA Crossover",
        "скользящих средних": "SMA Crossover",
        "скользящая средняя": "SMA Crossover",
        "Полосы Боллинджера": "Bollinger Bands",
        "Индекс страха и жадности": "Fear & Greed Index",
        "консолидац": "Market Consolidation",
        "боковик": "Sideways Trend",
        "кит": "Market Whales",
        "перекуплен": "RSI Overbought",
        "перепродан": "RSI Oversold",
        "медвеж": "Bearish Trend",
        "быч": "Bullish Trend",
        "мувинг": "SMA Crossover"
    };
    
    const sortedTerms = Object.keys(termMapping).sort((a, b) => b.length - a.length);
    
    for (let term of sortedTerms) {
        const topic = termMapping[term];
        const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        // Match either already wrapped links or raw words to prevent double nesting, matching following letters (suffixes)
        const regex = new RegExp(`\\[[^\\]]+\\]\\{term:[^}]+\\}|(${escapedTerm}[а-яА-ЯёЁa-zA-Z]*)`, "gi");
        formatted = formatted.replace(regex, (match, g1) => {
            if (g1) {
                return `[${g1}]{term:${topic}}`;
            }
            return match;
        });
    }
    return formatted;
}

function formatMarkdown(text) {
    // 1. Clean HTML characters first (standard practice)
    let formatted = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
    // 2. Parse green/red highlights using curly braces or BBCode tags BEFORE preprocessing terms
    formatted = formatted
        .replace(/\[green\]\{([^}]+)\}/g, '<span class="text-neon-green" style="color: var(--neon-green); font-weight: 600; text-shadow: 0 0 8px rgba(16, 185, 129, 0.25);">$1</span>')
        .replace(/\[red\]\{([^}]+)\}/g, '<span class="text-neon-red" style="color: var(--neon-rose); font-weight: 600; text-shadow: 0 0 8px rgba(244, 63, 94, 0.25);">$1</span>')
        .replace(/\[green\](.*?)\[\/green\]/gi, '<span class="text-neon-green" style="color: var(--neon-green); font-weight: 600; text-shadow: 0 0 8px rgba(16, 185, 129, 0.25);">$1</span>')
        .replace(/\[red\](.*?)\[\/red\]/gi, '<span class="text-neon-red" style="color: var(--neon-rose); font-weight: 600; text-shadow: 0 0 8px rgba(244, 63, 94, 0.25);">$1</span>')
        .replace(/\[green\]([a-zA-Z0-9_-]+)/g, '<span class="text-neon-green" style="color: var(--neon-green); font-weight: 600; text-shadow: 0 0 8px rgba(16, 185, 129, 0.25);">$1</span>')
        .replace(/\[red\]([a-zA-Z0-9_-]+)/g, '<span class="text-neon-red" style="color: var(--neon-rose); font-weight: 600; text-shadow: 0 0 8px rgba(244, 63, 94, 0.25);">$1</span>');
        
    // 3. Preprocess terms to wrap them in [term]{term:Topic}
    formatted = preprocessMarkdownTerms(formatted);
    
    // 4. Parse bold, italic, code, term links
    formatted = formatted
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\[([^\]]+)\]\{term:([^}]+)\}/g, '<span class="term-link" onclick="askAgentAboutTerm(\'$1\', \'$2\')">$1</span>');

    // 5. Convert numbered section titles (e.g. 1. **Market Tone**:) into styled block headers
    formatted = formatted.replace(/(?:^|\n)\s*(\d+)\.\s+\*\*([^*]+)\*\*(:)?/g, (match, num, title, colon) => {
        return `\n<div class="summary-section-header" style="margin-top: 18px; margin-bottom: 8px;"><span class="section-number-badge">${num}</span> ${title}${colon || ''}</div>\n`;
    });

    // 6. Convert markdown list items (- or *) into proper HTML lists
    let lines = formatted.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith('- ') || line.startsWith('* ')) {
            let content = line.substring(2).trim();
            if (!inList) {
                lines[i] = `<ul style="margin: 6px 0 10px 16px; padding-left: 0; list-style-type: disc;"><li style="margin-bottom: 4px; line-height: 1.55;">${content}</li>`;
                inList = true;
            } else {
                lines[i] = `<li style="margin-bottom: 4px; line-height: 1.55;">${content}</li>`;
            }
        } else {
            if (inList) {
                lines[i - 1] += '</ul>';
                inList = false;
            }
        }
    }
    if (inList) {
        lines[lines.length - 1] += '</ul>';
    }
    formatted = lines.join('\n');

    // 7. Parse double newlines into clean paragraph blocks
    let blocks = formatted.split(/\n\s*\n+/);
    let processedBlocks = [];
    for (let block of blocks) {
        block = block.trim();
        if (!block) continue;
        if (block.startsWith('<ul') || block.startsWith('<div class="summary-section-header"')) {
            processedBlocks.push(block);
        } else {
            block = block.replace(/\n/g, '<br>');
            processedBlocks.push(`<p style="margin-bottom: 12px; line-height: 1.6; text-align: justify; text-justify: inter-word;">${block}</p>`);
        }
    }
    formatted = processedBlocks.join('\n');
        
    return formatted;
}


function formatLargeNumber(num) {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
}

// -------------------------------------------------------------------------
// Technical Indicators Rendering & Interaction
// -------------------------------------------------------------------------

function updateIndicatorsUI(indicators) {
    document.getElementById("val-indicator-rsi").innerHTML = `${indicators.rsi.value} (<span class="term-link" onclick="askAgentAboutTerm('${indicators.rsi.status}', 'RSI')">${indicators.rsi.status}</span>)`;
    document.getElementById("val-indicator-macd").innerHTML = `<span class="term-link" onclick="askAgentAboutTerm('${indicators.macd.status}', 'MACD')">${indicators.macd.status}</span>`;
    document.getElementById("val-indicator-sma").innerHTML = `<span class="term-link" onclick="askAgentAboutTerm('${indicators.moving_averages.status}', 'Moving Averages')">${indicators.moving_averages.status}</span>`;
    document.getElementById("val-indicator-bb").innerHTML = `<span class="term-link" onclick="askAgentAboutTerm('${indicators.bollinger_bands.status}', 'Bollinger Bands')">${indicators.bollinger_bands.status}</span>`;
    
    // Fear & Greed with trend indicator
    const fgVal = indicators.fear_greed.value;
    const fgPrev = indicators.fear_greed.previous_value;
    let trendHtml = "";
    if (fgPrev !== undefined) {
        const diff = fgVal - fgPrev;
        if (diff > 0) {
            trendHtml = ` <span class="trend-indicator up" style="color: var(--neon-green); font-size: 0.78rem; font-weight: 700; text-shadow: 0 0 8px rgba(16, 185, 129, 0.25);">↗ +${diff}</span>`;
        } else if (diff < 0) {
            trendHtml = ` <span class="trend-indicator down" style="color: var(--neon-rose); font-size: 0.78rem; font-weight: 700; text-shadow: 0 0 8px rgba(244, 63, 94, 0.25);">↘ ${diff}</span>`;
        } else {
            trendHtml = ` <span class="trend-indicator flat" style="color: var(--text-muted); font-size: 0.78rem;">→ 0</span>`;
        }
    }
    document.getElementById("val-indicator-fg").innerHTML = `${fgVal} (<span class="term-link" onclick="askAgentAboutTerm('${indicators.fear_greed.status}', 'Fear & Greed')">${indicators.fear_greed.status}</span>)${trendHtml}`;
    
    // Candlestick Patterns
    const patternsVal = document.getElementById("val-indicator-patterns");
    if (patternsVal) {
        const list = indicators.detected_patterns || [];
        if (list.length === 0) {
            patternsVal.innerHTML = currentLanguage === "ru" ? "Нет" : "None";
            patternsVal.style.color = "var(--text-primary)";
        } else {
            const listStr = list.join(", ");
            patternsVal.innerHTML = `<span class="term-link" onclick="askAgentAboutTerm('${listStr}', 'Candlestick Patterns')">${listStr}</span>`;
            // Color green if Hammer/Bullish, red if Shooting Star/Bearish, neutral otherwise
            const isBullish = list.some(p => p.toLowerCase().includes("bullish") || p.toLowerCase().includes("hammer"));
            const isBearish = list.some(p => p.toLowerCase().includes("bearish") || p.toLowerCase().includes("shooting"));
            if (isBullish && !isBearish) {
                patternsVal.style.color = "var(--neon-green)";
            } else if (isBearish && !isBullish) {
                patternsVal.style.color = "var(--neon-rose)";
            } else {
                patternsVal.style.color = "var(--text-primary)";
            }
        }
    }

    // Set visual indicators styling
    setIndicatorStatusColor("val-indicator-rsi", indicators.rsi.status);
    setIndicatorStatusColor("val-indicator-macd", indicators.macd.status);
    setIndicatorStatusColor("val-indicator-sma", indicators.moving_averages.status);
    setIndicatorStatusColor("val-indicator-bb", indicators.bollinger_bands.status);
    setIndicatorStatusColor("val-indicator-fg", indicators.fear_greed.status);
}

function setIndicatorStatusColor(elementId, status) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const lowerStatus = status.toLowerCase();
    
    const isRose = lowerStatus.includes("перекуплен") || lowerStatus.includes("медвеж") || 
                   lowerStatus.includes("смерти") || lowerStatus.includes("страх") ||
                   lowerStatus.includes("overbought") || lowerStatus.includes("bearish") || 
                   lowerStatus.includes("death") || lowerStatus.includes("fear");
                   
    const isGreen = lowerStatus.includes("перепродан") || lowerStatus.includes("быч") || 
                    lowerStatus.includes("золотой") || lowerStatus.includes("жадность") ||
                    lowerStatus.includes("oversold") || lowerStatus.includes("bullish") || 
                    lowerStatus.includes("golden") || lowerStatus.includes("greed");
    
    if (isRose) {
        el.style.color = "var(--neon-rose)";
    } else if (isGreen) {
        el.style.color = "var(--neon-green)";
    } else {
        el.style.color = "var(--text-primary)";
    }
}

function askAgentAboutIndicator(indicatorName) {
    const coinLabel = coinSelector.options[coinSelector.selectedIndex].text;
    const prompt = currentLanguage === "ru"
        ? `Объясни подробнее технический индикатор ${indicatorName} для ${coinLabel} простыми словами как для новичка.`
        : `Explain the ${indicatorName} technical indicator for ${coinLabel} in detail, in simple terms for a beginner.`;
    
    chatInput.value = prompt;
    sendMessage();
}

function askAgentAboutTerm(termName, indicatorName) {
    const coinLabel = coinSelector.options[coinSelector.selectedIndex].text;
    const prompt = currentLanguage === "ru"
        ? `Что означает показатель "${termName}" индикатора ${indicatorName} для ${coinLabel} в данном контексте?`
        : `What does the "${termName}" status for ${indicatorName} mean for ${coinLabel} in this context?`;
    
    chatInput.value = prompt;
    sendMessage();
}

function closeDisclaimer() {
    document.getElementById("chat-disclaimer").style.display = "none";
}

// -------------------------------------------------------------------------
// Resize Handle (Flexible Chat Panel Width)
// -------------------------------------------------------------------------

function initResizeHandle() {
    const resizeHandle = document.getElementById("resize-handle");
    const layout = document.querySelector(".app-main-layout");
    let isResizing = false;

    if (!resizeHandle || !layout) return;

    resizeHandle.addEventListener("mousedown", (e) => {
        isResizing = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        resizeHandle.classList.add("active");
    });

    document.addEventListener("mousemove", (e) => {
        if (!isResizing) return;
        
        // Width is calculated from right screen boundary
        const newWidth = window.innerWidth - e.clientX - 16;
        
        if (newWidth > 220 && newWidth < 800) {
            layout.style.setProperty("--chat-panel-width", `${newWidth}px`);
        }
    });

    document.addEventListener("mouseup", () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            resizeHandle.classList.remove("active");
        }
    });
}

// -------------------------------------------------------------------------
// Market Sentiment Gauge Logic
// -------------------------------------------------------------------------

const SENTIMENT_MAPPINGS = {
    "bitcoin": {
        "12h": 52,
        "1W": 72,
        "1M": 85,
        "3M": 38,
        "6M": 90
    },
    "ethereum": {
        "12h": 64,
        "1W": 48,
        "1M": 68,
        "3M": 50,
        "6M": 42
    },
    "solana": {
        "12h": 88,
        "1W": 92,
        "1M": 54,
        "3M": 70,
        "6M": 15
    },
    "ripple": {
        "12h": 45,
        "1W": 55,
        "1M": 35,
        "3M": 62,
        "6M": 48
    },
    "dogecoin": {
        "12h": 78,
        "1W": 40,
        "1M": 82,
        "3M": 30,
        "6M": 60
    },
    "shiba-inu": {
        "12h": 36,
        "1W": 64,
        "1M": 58,
        "3M": 42,
        "6M": 76
    },
    "pepe": {
        "12h": 82,
        "1W": 89,
        "1M": 44,
        "3M": 74,
        "6M": 28
    }
};

function getSentimentScore(coin, timeframe) {
    if (SENTIMENT_MAPPINGS[coin] && SENTIMENT_MAPPINGS[coin][timeframe] !== undefined) {
        return SENTIMENT_MAPPINGS[coin][timeframe];
    }
    // Fallback hash-based score between 10 and 90
    const str = `${coin}-${timeframe}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 10 + (Math.abs(hash) % 81); // 10 to 90
}

function updateSentimentUI() {
    const score = getSentimentScore(currentCoin, currentSentimentTimeframe);
    
    // Needle rotation: 0-100 maps to -90deg to +90deg
    // Formula: rotation = (score - 50) * 1.8;
    const rotation = (score - 50) * 1.8;
    const needleEl = document.getElementById("gauge-needle");
    if (needleEl) {
        needleEl.style.transform = `translate(-50%, 0) rotate(${rotation}deg)`;
    }
    
    // Sentiment Label
    let statusKey = "neutral";
    let colorClass = "var(--text-primary)";
    
    if (score <= 20) {
        statusKey = "strongSell";
        colorClass = "var(--neon-rose)";
    } else if (score <= 40) {
        statusKey = "sell";
        colorClass = "var(--neon-rose)";
    } else if (score <= 60) {
        statusKey = "neutral";
        colorClass = "var(--text-primary)";
    } else if (score <= 80) {
        statusKey = "buy";
        colorClass = "var(--neon-green)";
    } else {
        statusKey = "strongBuy";
        colorClass = "var(--neon-green)";
    }
    
    const valueEl = document.getElementById("gauge-value-text");
    if (valueEl) {
        const text = LOCALIZATION[currentLanguage].sentimentLabels[statusKey];
        valueEl.textContent = `${text} (${score})`;
        valueEl.style.color = colorClass;
    }
}

function changeSentimentTimeframe(timeframe) {
    currentSentimentTimeframe = timeframe;
    
    // Update active button class
    const buttons = document.querySelectorAll(".timeframe-buttons .tf-btn");
    buttons.forEach(btn => {
        if (btn.id === `tf-${timeframe}`) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    updateSentimentUI();
}

function askAgentAboutSentiment() {
    const coinLabel = coinSelector.options[coinSelector.selectedIndex].text;
    const score = getSentimentScore(currentCoin, currentSentimentTimeframe);
    
    let statusKey = "neutral";
    if (score <= 20) statusKey = "strongSell";
    else if (score <= 40) statusKey = "sell";
    else if (score <= 60) statusKey = "neutral";
    else if (score <= 80) statusKey = "buy";
    else statusKey = "strongBuy";
    
    const text = LOCALIZATION[currentLanguage].sentimentLabels[statusKey];
    
    const timeframeNames = {
        ru: { "12h": "12 часов", "1W": "1 неделю", "1M": "1 месяц", "3M": "3 месяца", "6M": "6 месяцев" },
        en: { "12h": "12 hours", "1W": "1 week", "1M": "1 month", "3M": "3 months", "6M": "6 months" }
    };
    const tfReadable = timeframeNames[currentLanguage][currentSentimentTimeframe];
    
    const prompt = currentLanguage === "ru"
        ? `Что означает рыночное настроение "${text} (${score})" для ${coinLabel} на интервале ${tfReadable}? Объясни подробно простыми словами для новичка, как интерпретировать этот показатель.`
        : `What does the market sentiment "${text} (${score})" for ${coinLabel} over the ${tfReadable} timeframe mean? Explain in detail in simple terms for a beginner how to interpret this indicator.`;
        
    chatInput.value = prompt;
    sendMessage();
}

// -------------------------------------------------------------------------
// Event Listeners & Bootstrapping
// -------------------------------------------------------------------------

coinSelector.onchange = (e) => {
    currentCoin = e.target.value;
    applyCoinTheme(currentCoin);
    renderTradingViewWidget();
    initChatSession();
    loadAIContent();
    updateSentimentUI();
};

langToggleBtn.onclick = toggleLanguage;
themeToggleBtn.onclick = toggleTheme;
chatInput.onkeydown = (e) => {
    if (e.key === "Enter") sendMessage();
};
chatSendBtn.onclick = sendMessage;

function exportReport() {
    const coinLabel = coinDisplayName.textContent || coinSelector.options[coinSelector.selectedIndex].text;
    const price = coinDisplayPrice.textContent;
    const change = coinDisplayChange.textContent;
    const high = valHigh24h.textContent;
    const low = valLow24h.textContent;
    const vol = valVolume.textContent;
    const cap = valCap.textContent;
    
    const rsi = document.getElementById("val-indicator-rsi").textContent;
    const macd = document.getElementById("val-indicator-macd").textContent;
    const sma = document.getElementById("val-indicator-sma").textContent;
    const bb = document.getElementById("val-indicator-bb").textContent;
    const fg = document.getElementById("val-indicator-fg").textContent;
    
    const sentiment = document.getElementById("gauge-value-text").textContent;
    const sentimentTimeframe = currentSentimentTimeframe;
    
    const now = new Date().toLocaleString();
    
    let reportMd = "";
    if (currentLanguage === "ru") {
        reportMd = `# Отчет по анализу криптовалюты: ${coinLabel}
Дата/Время: ${now}

## Обзор рынка
- **Текущая цена**: ${price} (${change})
- **Максимум / Минимум (24ч)**: ${high} / ${low}
- **Объем торгов (24ч)**: ${vol}
- **Рыночная капитализация**: ${cap}

## Технические индикаторы
- **RSI (14)**: ${rsi}
- **MACD**: ${macd}
- **Скользящие средние (SMA)**: ${sma}
- **Полосы Боллинджера**: ${bb}
- **Индекс страха и жадности**: ${fg}
- **Настроение рынка (${sentimentTimeframe})**: ${sentiment}

## Сводка ИИ-анализа
${lastRawSummary || "Нет доступных данных по анализу."}
`;
    } else {
        reportMd = `# Crypto Market Analysis Report: ${coinLabel}
Date/Time: ${now}

## Market Overview
- **Current Price**: ${price} (${change})
- **24h High / Low**: ${high} / ${low}
- **24h Volume**: ${vol}
- **Market Cap**: ${cap}

## Technical Indicators
- **RSI (14)**: ${rsi}
- **MACD**: ${macd}
- **Moving Averages**: ${sma}
- **Bollinger Bands**: ${bb}
- **Fear & Greed**: ${fg}
- **Market Sentiment (${sentimentTimeframe})**: ${sentiment}

## AI Analysis Summary
${lastRawSummary || "No AI analysis summary available."}
`;
    }
    
    // Download file
    const blob = new Blob([reportMd], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${currentCoin}_analysis_report.md`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const COIN_THEMES = {
    "bitcoin": { accent: "#F7931A", rgb: "247, 147, 26" },
    "ethereum": { accent: "#818CF8", rgb: "129, 140, 248" }, 
    "solana": { accent: "#14F195", rgb: "20, 241, 149" }, 
    "ripple": { accent: "#006097", rgb: "0, 96, 151" },
    "dogecoin": { accent: "#F59E0B", rgb: "245, 158, 11" }, 
    "shiba-inu": { accent: "#EF4444", rgb: "239, 68, 68" }, 
    "pepe": { accent: "#10B981", rgb: "16, 185, 129" }
};

function applyCoinTheme(coinId) {
    const theme = COIN_THEMES[coinId] || COIN_THEMES["bitcoin"];
    document.documentElement.style.setProperty("--accent-color", theme.accent);
    document.documentElement.style.setProperty("--accent-rgb", theme.rgb);
    document.documentElement.style.setProperty("--accent-glow", `rgba(${theme.rgb}, 0.15)`);
}

// Mouse tracking bg glow
document.addEventListener("mousemove", (e) => {
    const glowBg = document.getElementById("glow-bg");
    if (glowBg) {
        const x = e.clientX;
        const y = e.clientY;
        glowBg.style.setProperty("--mouse-x", `${x}px`);
        glowBg.style.setProperty("--mouse-y", `${y}px`);
    }
});

// Indicator of the Day helper functions
function isIndicatorMentioned(ind) {
    const history = chatHistories[currentCoin] || [];
    const idLower = ind.id.toLowerCase();
    const nameEnLower = ind.name.en.toLowerCase();
    const nameRuLower = ind.name.ru.toLowerCase();
    
    for (const msg of history) {
        const text = (msg.content || "").toLowerCase();
        if (text.includes(idLower) || text.includes(nameEnLower) || text.includes(nameRuLower)) {
            return true;
        }
        if (ind.id === "bollinger" && text.includes("боллинджер")) return true;
        if (ind.id === "stochastic" && text.includes("стохастик")) return true;
        if (ind.id === "ichimoku" && text.includes("ишимоку")) return true;
        if (ind.id === "fibonacci" && text.includes("фибоначч")) return true;
    }
    return false;
}

function getFreshIndicatorOfTheDay() {
    const baseIndex = dayOfYear % INDICATORS_OF_THE_DAY.length;
    for (let i = 0; i < INDICATORS_OF_THE_DAY.length; i++) {
        const candidateIndex = (baseIndex + i) % INDICATORS_OF_THE_DAY.length;
        const ind = INDICATORS_OF_THE_DAY[candidateIndex];
        if (!isIndicatorMentioned(ind)) {
            return ind;
        }
    }
    return INDICATORS_OF_THE_DAY[baseIndex];
}

// Initial Bootstrap
initTheme();
applyCoinTheme(currentCoin);
localizeUI();
renderTradingViewWidget();
initChatSession();
loadAIContent();
initResizeHandle();
updateQuotaUI();
loadQuizQuestion();
// Refresh quota indicator every 60 seconds
setInterval(updateQuotaUI, 60000);

// TA Quiz helper functions
function loadQuizQuestion() {
    const lang = currentLanguage;
    const questions = QUIZ_QUESTIONS[lang];
    currentQuizQuestionIndex = currentQuizQuestionIndex % questions.length;
    const qObj = questions[currentQuizQuestionIndex];

    const qContainer = document.getElementById("quiz-question-container");
    const oContainer = document.getElementById("quiz-options-container");
    const explanationDiv = document.getElementById("quiz-explanation");
    const scoreVal = document.getElementById("quiz-score-val");
    const levelVal = document.getElementById("quiz-level-val");

    if (scoreVal) scoreVal.textContent = quizScore;
    if (levelVal) {
        let levelText = "";
        if (quizScore >= 8) levelText = lang === "ru" ? "Профи" : "Pro";
        else if (quizScore >= 4) levelText = lang === "ru" ? "Продвинутый" : "Advanced";
        else levelText = lang === "ru" ? "Новичок" : "Novice";
        levelVal.textContent = levelText;
    }

    if (explanationDiv) {
        explanationDiv.style.display = "none";
        explanationDiv.innerHTML = "";
    }

    if (qContainer) {
        qContainer.textContent = qObj.q;
        qContainer.style.cursor = "pointer";
        qContainer.title = lang === "ru" ? "Спросить ИИ об этом вопросе" : "Ask AI about this question";
        qContainer.onclick = () => {
            chatInput.value = qObj.q;
            sendMessage();
        };
    }

    if (oContainer) {
        oContainer.innerHTML = "";
        qObj.options.forEach((opt, idx) => {
            const label = document.createElement("label");
            label.className = "quiz-option-label";
            label.style.display = "flex";
            label.style.alignItems = "center";
            label.style.gap = "8px";
            label.style.padding = "8px 10px";
            label.style.background = "var(--input-bg)";
            label.style.border = "1px solid var(--card-border)";
            label.style.borderRadius = "8px";
            label.style.fontSize = "0.78rem";
            label.style.cursor = "pointer";
            label.style.transition = "all 0.2s ease";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "quiz-choice";
            radio.value = idx;
            radio.style.cursor = "pointer";

            label.appendChild(radio);
            label.appendChild(document.createTextNode(opt));
            oContainer.appendChild(label);
            
            label.onclick = (e) => {
                if (e.target !== radio) {
                    radio.checked = true;
                }
                document.querySelectorAll(".quiz-option-label").forEach(l => {
                    l.style.borderColor = "var(--card-border)";
                    l.style.background = "var(--input-bg)";
                });
                label.style.borderColor = "var(--accent-color)";
                label.style.background = "rgba(var(--accent-rgb), 0.05)";
            };
        });
    }

    const submitBtn = document.getElementById("quiz-submit-btn");
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = lang === "ru" ? "Проверить ответ" : "Submit Answer";
        submitBtn.onclick = submitQuizAnswer;
    }
}

function submitQuizAnswer() {
    const selectedRadio = document.querySelector('input[name="quiz-choice"]:checked');
    if (!selectedRadio) {
        alert(currentLanguage === "ru" ? "Пожалуйста, выберите вариант ответа!" : "Please select an answer!");
        return;
    }

    const answerIdx = parseInt(selectedRadio.value);
    const questions = QUIZ_QUESTIONS[currentLanguage];
    const qObj = questions[currentQuizQuestionIndex];
    const explanationDiv = document.getElementById("quiz-explanation");
    const submitBtn = document.getElementById("quiz-submit-btn");

    document.querySelectorAll('input[name="quiz-choice"]').forEach(r => r.disabled = true);

    const labels = document.querySelectorAll(".quiz-option-label");
    labels.forEach((label, idx) => {
        label.style.cursor = "default";
        label.onclick = null;
        if (idx === qObj.answer) {
            label.style.borderColor = "var(--neon-green)";
            label.style.background = "rgba(16, 185, 129, 0.08)";
        } else if (idx === answerIdx) {
            label.style.borderColor = "var(--neon-rose)";
            label.style.background = "rgba(244, 63, 94, 0.08)";
        }
    });

    const isCorrect = (answerIdx === qObj.answer);
    if (isCorrect) {
        quizScore += 2;
    } else {
        quizScore = Math.max(0, quizScore - 1);
    }
    localStorage.setItem("quiz_score", quizScore);

    const scoreVal = document.getElementById("quiz-score-val");
    if (scoreVal) scoreVal.textContent = quizScore;

    if (explanationDiv) {
        explanationDiv.innerHTML = `
            <strong style="color: ${isCorrect ? 'var(--neon-green)' : 'var(--neon-rose)'};">
                ${isCorrect ? (currentLanguage === "ru" ? "Правильно!" : "Correct!") : (currentLanguage === "ru" ? "Неверно!" : "Incorrect!")}
            </strong><br>
            ${qObj.explanation}
        `;
        explanationDiv.style.display = "block";
    }

    if (submitBtn) {
        submitBtn.textContent = currentLanguage === "ru" ? "Следующий вопрос" : "Next Question";
        submitBtn.onclick = () => {
            currentQuizQuestionIndex++;
            loadQuizQuestion();
        };
    }
}

// Strategy backtesting runner logic
async function runStrategyBacktest() {
    const strategySelector = document.getElementById("backtest-strategy-selector");
    const strategy = strategySelector.value;
    const loading = document.getElementById("backtest-loading");
    const results = document.getElementById("backtest-results");
    const runBtn = document.getElementById("run-backtest-btn");

    if (runBtn) runBtn.disabled = true;
    if (loading) loading.style.display = "block";
    if (results) results.style.display = "none";

    try {
        const response = await fetch("/api/backtest", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ coin_id: currentCoin, strategy: strategy })
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("val-bt-profit").textContent = `${data.net_profit >= 0 ? '+' : ''}${data.net_profit.toFixed(2)}%`;
            document.getElementById("val-bt-profit").style.color = data.net_profit >= 0 ? "var(--neon-green)" : "var(--neon-rose)";
            
            document.getElementById("val-bt-winrate").textContent = `${data.win_rate.toFixed(2)}%`;
            document.getElementById("val-bt-trades").textContent = data.total_trades;
            document.getElementById("val-bt-drawdown").textContent = `${data.max_drawdown.toFixed(2)}%`;

            const chartContainer = document.getElementById("backtest-chart");
            const labelsContainer = document.getElementById("backtest-chart-labels");
            
            if (chartContainer && labelsContainer) {
                chartContainer.innerHTML = "";
                labelsContainer.innerHTML = "";
                
                const curve = data.equity_curve || [];
                if (curve.length > 0) {
                    const values = curve.map(c => c.value);
                    const minVal = Math.min(...values);
                    const maxVal = Math.max(...values);
                    const valRange = maxVal - minVal || 1.0;

                    curve.forEach(pt => {
                        const barCol = document.createElement("div");
                        barCol.className = "backtest-chart-col";
                        barCol.style.flex = "1";
                        barCol.style.height = "100%";
                        barCol.style.display = "flex";
                        barCol.style.flexDirection = "column";
                        barCol.style.justifyContent = "flex-end";
                        barCol.style.alignItems = "center";
                        barCol.style.position = "relative";

                        const pct = ((pt.value - minVal) / valRange) * 80 + 10;
                        
                        const bar = document.createElement("div");
                        bar.style.width = "70%";
                        bar.style.height = `${pct}%`;
                        bar.style.borderRadius = "3px 3px 0 0";
                        bar.style.background = pt.value >= 1000 ? "rgba(16, 185, 129, 0.65)" : "rgba(244, 63, 94, 0.65)";
                        bar.style.transition = "height 0.4s ease";
                        bar.title = `$${pt.value.toFixed(2)}`;

                        barCol.appendChild(bar);
                        chartContainer.appendChild(barCol);

                        const lbl = document.createElement("span");
                        lbl.style.flex = "1";
                        lbl.style.textAlign = "center";
                        lbl.textContent = pt.label;
                        labelsContainer.appendChild(lbl);
                    });
                }
            }

            if (results) results.style.display = "block";
        } else {
            alert(currentLanguage === "ru" ? "Ошибка выполнения бэктеста." : "Failed to run backtest simulation.");
        }
    } catch (e) {
        console.error("Backtest error", e);
        alert(currentLanguage === "ru" ? "Ошибка соединения при выполнении бэктеста." : "Connection error running backtest.");
    } finally {
        if (loading) loading.style.display = "none";
        if (runBtn) runBtn.disabled = false;
    }
}

function saveApiKey() {
    const keyInput = document.getElementById("api-key-input");
    const statusDiv = document.getElementById("api-key-status");
    const key = keyInput.value.trim();
    if (!key) {
        statusDiv.textContent = currentLanguage === "ru" ? "❌ Пожалуйста, введите ключ" : "❌ Please enter a key";
        statusDiv.style.color = "var(--neon-rose)";
        statusDiv.style.display = "block";
        return;
    }

    try {
        sessionStorage.setItem("custom_api_key", key);
        statusDiv.textContent = currentLanguage === "ru" ? "✅ Ключ успешно применен!" : "✅ Key applied successfully!";
        statusDiv.style.color = "var(--neon-green)";
        statusDiv.style.display = "block";
        keyInput.value = ""; // clear input
        
        // Reload content to use the new key
        loadAIContent();
        // Clear current chat session and re-welcome user to get live interaction
        chatHistories[currentCoin] = null;
        initChatSession();
        
        // Hide status after 4 seconds
        setTimeout(() => {
            statusDiv.style.display = "none";
        }, 4000);
    } catch (e) {
        statusDiv.textContent = currentLanguage === "ru" ? "❌ Ошибка сохранения" : "❌ Storage error";
        statusDiv.style.color = "var(--neon-rose)";
        statusDiv.style.display = "block";
    }
}
