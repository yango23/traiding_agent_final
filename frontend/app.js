// =========================================================================
// State Management & Logic for Educational Crypto AI Advisor Dashboard
// =========================================================================

// Global Configuration
const TRADINGVIEW_SYMBOLS = {
    // Crypto
    "bitcoin": "BINANCE:BTCUSDT",
    "ethereum": "BINANCE:ETHUSDT",
    "solana": "BINANCE:SOLUSDT",
    "ripple": "BINANCE:XRPUSDT",
    "dogecoin": "BINANCE:DOGEUSDT",
    "shiba-inu": "BINANCE:SHIBUSDT",
    "pepe": "KRAKEN:PEPEUSD",
    // US Stocks
    "alphabet": "NASDAQ:GOOGL",
    "apple": "NASDAQ:AAPL",
    "microsoft": "NASDAQ:MSFT",
    "nvidia": "NASDAQ:NVDA",
    "amazon": "NASDAQ:AMZN",
    "meta": "NASDAQ:META",
    "tesla": "NASDAQ:TSLA"
};

const CRYPTO_ASSETS = [
    { value: "bitcoin", label: "Bitcoin (BTC)" },
    { value: "ethereum", label: "Ethereum (ETH)" },
    { value: "solana", label: "Solana (SOL)" },
    { value: "ripple", label: "Ripple (XRP)" },
    { value: "dogecoin", label: "Dogecoin (DOGE)" },
    { value: "shiba-inu", label: "Shiba Inu (SHIB)" },
    { value: "pepe", label: "Pepe (PEPE)" }
];

const STOCK_ASSETS = [
    { value: "alphabet", label: "Alphabet / Google (GOOGL)" },
    { value: "apple", label: "Apple Inc. (AAPL)" },
    { value: "microsoft", label: "Microsoft (MSFT)" },
    { value: "nvidia", label: "NVIDIA (NVDA)" },
    { value: "amazon", label: "Amazon (AMZN)" },
    { value: "meta", label: "Meta Platforms (META)" },
    { value: "tesla", label: "Tesla Inc. (TSLA)" }
];

// UI Localization Dictionaries
const LOCALIZATION = {
    ru: {
        subtitle: "Учебный дашборд по техническому анализу",
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
            "Сделай анализ всех последних новостей, относящихся к активу",
            "indicator_of_the_day"
        ],
        lblToggleDrawer: "Чат",
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
        tipPatterns: "Активные паттерны, сканируемые на дневном графике Binance (например, Доджи, Молот, Падающая звезда, Поглощение).",
        tipApiKey: "Вы можете указать свой собственный API-ключ Gemini для сброса ограничений суточной квоты или выхода из демонстрационного режима. Все ключи хранятся исключительно в сессионном хранилище вашего браузера и никогда не передаются автору и не используются в сторонних целях."
    },
    en: {
        subtitle: "Educational Dashboard & Technical Analysis",
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
            "Analyze all recent news related to the active asset",
            "indicator_of_the_day"
        ],
        lblToggleDrawer: "Chat",
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
        tipPatterns: "Active patterns scanned on the daily Binance chart (e.g. Doji, Hammer, Shooting Star, Engulfing).",
        tipApiKey: "Users can specify their own Gemini API key to bypass daily quota limits or exit demo mode. Keys are stored securely in session storage, the author never collects, saves, or uses your keys for any other purpose."
    }
};

// Version Check & State Reset on Redeploy
const APP_VERSION = "2.0.0";
const savedVersion = localStorage.getItem("app_version");
if (savedVersion !== APP_VERSION) {
    localStorage.clear();
    localStorage.setItem("app_version", APP_VERSION);
}

// State Variables
let currentLanguage = localStorage.getItem("lang") || "en";
let currentTheme = localStorage.getItem("theme") || "dark";
let currentMarketType = "crypto";
let currentCoin = "bitcoin";
let activeTab = "summary";
let tvWidgetInstance = null;
let currentSentimentTimeframe = "12h";
let lastRawSummary = "";
const clientSummaryCache = {};

function switchMarketType(marketType) {
    if (currentMarketType === marketType) return;
    currentMarketType = marketType;
    
    // Toggle active tab buttons
    const cryptoBtn = document.getElementById("tab-market-crypto");
    const stocksBtn = document.getElementById("tab-market-stocks");
    if (cryptoBtn) cryptoBtn.classList.toggle("active", marketType === "crypto");
    if (stocksBtn) stocksBtn.classList.toggle("active", marketType === "stocks");

    // Populate selector dropdown
    const selector = document.getElementById("coin-selector");
    if (selector) {
        selector.innerHTML = "";
        const assetsList = marketType === "stocks" ? STOCK_ASSETS : CRYPTO_ASSETS;
        assetsList.forEach(asset => {
            const opt = document.createElement("option");
            opt.value = asset.value;
            opt.textContent = asset.label;
            selector.appendChild(opt);
        });

        // Default selected: "alphabet" for stocks, "bitcoin" for crypto
        const defaultAsset = marketType === "stocks" ? "alphabet" : "bitcoin";
        selector.value = defaultAsset;
        currentCoin = defaultAsset;
    }

    // Trigger full asset refresh
    applyCoinTheme(currentCoin);
    renderTradingViewWidget();
    loadAIContent(true);
    initChatSession();
}

// Auth Headers Vault helper
function getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    
    // User session token
    const sessionToken = localStorage.getItem("session_token");
    if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
    }
    
    // Gemini API key
    const customKey = sessionStorage.getItem("custom_api_key");
    if (customKey) {
        headers["X-Gemini-API-Key"] = customKey;
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
    document.documentElement.lang = currentLanguage;
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
    
    const apiKeyTip = document.getElementById("tip-api-key");
    if (apiKeyTip) apiKeyTip.setAttribute("data-tooltip", t.tipApiKey);
    
    
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

    const toggleDrawerBtn = document.getElementById("lbl-toggle-drawer");
    if (toggleDrawerBtn) {
        toggleDrawerBtn.textContent = t.lblToggleDrawer;
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
    if (apiKeyInput) {
        const activeKey = sessionStorage.getItem("custom_api_key");
        if (activeKey) {
            apiKeyInput.placeholder = currentLanguage === "ru" ? "•••••••• (Активен)" : "•••••••• (Active)";
        } else {
            apiKeyInput.placeholder = t.apiKeyPlaceholder;
        }
    }
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

let tvIntervalSetting = "D";
let tvStyleSetting = "1";

function renderTradingViewWidget() {
    const symbol = TRADINGVIEW_SYMBOLS[currentCoin] || "BINANCE:BTCUSDT";
    
    // Clear container
    document.getElementById("tv-chart-container").innerHTML = "";
    
    tvWidgetInstance = new TradingView.widget({
        "autosize": true,
        "symbol": symbol,
        "interval": tvIntervalSetting,
        "timezone": "Etc/UTC",
        "theme": currentTheme,
        "style": tvStyleSetting,
        "locale": currentLanguage === "ru" ? "ru" : "en",
        "toolbar_bg": currentTheme === "dark" ? "#0f172a" : "#ffffff",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "show_popup_button": true,
        "popup_width": "1200",
        "popup_height": "800",
        "save_image": true,
        "details": true,
        "calendar": true,
        "hotlist": true,
        "withdateranges": true,
        "studies": [
            "STD;Volume"
        ],
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
        const response = await fetch(`/api/market-data/${currentCoin}?lang=${currentLanguage}${forceRefresh ? '&force_refresh=true' : ''}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success) {
            updateStatsUI(data.market_data);
            updateIndicatorsUI(data.indicators);
            renderNewsUI(data.news);
            if (typeof checkTriggeredAlerts === "function") {
                checkTriggeredAlerts(data.triggered_alerts);
            }
        }
    } catch (e) {
        console.error("Failed to load market data", e);
    }
}

async function loadAIContent(forceRefresh = false) {
    // 1. Fetch Stats, Indicators and News from API
    await loadStatsOnly(forceRefresh);

    const cacheKey = `${currentCoin.toLowerCase()}_${currentLanguage.toLowerCase()}`;
    
    // Check client-side memory cache if not force refreshing
    if (!forceRefresh && clientSummaryCache[cacheKey]) {
        const cached = clientSummaryCache[cacheKey];
        lastRawSummary = cached.summary;
        aiSummaryText.innerHTML = formatMarkdown(cached.summary);
        aiSummaryText.style.display = "block";
        summaryLoading.style.display = "none";
        
        const simBanner = document.getElementById("simulated-warning");
        const simText   = document.getElementById("simulated-warning-text");
        if (cached.simulated) {
            simText.textContent = currentLanguage === "ru"
                ? "⚠️ Квота AI исчерпана — показывается смоделированный анализ (демо-режим)"
                : "⚠️ AI quota exhausted — showing simulated analysis (demo mode)";
            simBanner.style.display = "flex";
        } else {
            simBanner.style.display = "none";
        }
        return;
    }

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
            clientSummaryCache[cacheKey] = {
                summary: data.summary,
                simulated: data.simulated
            };
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
        
        const customKeyActive = !!sessionStorage.getItem("custom_api_key");
        const exhausted = customKeyActive ? false : (q.quota_exhausted || false);

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
            if (customKeyActive) {
                badge.style.display = "inline";
                badge.style.background = "rgba(16, 185, 129, 0.15)";
                badge.style.borderColor = "rgba(16, 185, 129, 0.3)";
                badge.style.color = "var(--neon-green)";
                if (badgeText) {
                    badgeText.textContent = currentLanguage === "ru" ? "Свой API Ключ" : "Custom API Key";
                }
            } else {
                badge.style.display = exhausted ? "inline" : "none";
                badge.style.background = ""; // Reset inline override
                badge.style.borderColor = "";
                badge.style.color = "";
                if (badgeText) {
                    badgeText.textContent = currentLanguage === "ru" ? "Квота исчерпана" : "Quota exhausted";
                }
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

async function initChatSession() {
    const sessionToken = localStorage.getItem("session_token");
    if (sessionToken) {
        try {
            const resp = await fetch(`/api/user/chat-history/${currentCoin}?lang=${currentLanguage}`, {
                headers: getAuthHeaders()
            });
            const data = await resp.json();
            if (data.success && data.history) {
                if (data.history.length === 0) {
                    const coinLabel = coinSelector ? coinSelector.options[coinSelector.selectedIndex].text : currentCoin;
                    const isStock = currentMarketType === "stocks" || STOCK_ASSETS.some(a => a.value === currentCoin);
                    let welcomeTemplate = LOCALIZATION[currentLanguage].welcomeMessage;
                    if (isStock) {
                        welcomeTemplate = currentLanguage === "ru"
                            ? "Привет! Я твой ИИ-преподаватель по фундаментальному и техническому анализу акций {coin}. Чем могу помочь тебе сегодня? Я могу рассказать про индикаторы (RSI, MACD, SMA), объяснить финансовую отчетность компании или показать основы построения стратегий."
                            : "Hello! I am your AI educator for technical and fundamental analysis of {coin} shares. How can I help you today? I can explain indicators (RSI, MACD, SMA), corporate financial reports, or strategy building basics.";
                    }
                    const welcomeMsg = welcomeTemplate.replace("{coin}", coinLabel);
                    chatHistories[currentCoin] = [{
                        role: "model",
                        content: welcomeMsg
                    }];
                } else {
                    chatHistories[currentCoin] = data.history;
                }
            }
        } catch (e) {
            console.error("Failed to load chat history from server", e);
            fallbackToLocalHistory();
        }
    } else {
        fallbackToLocalHistory();
    }
    renderChatMessages();
    renderQuickChips();
}

function fallbackToLocalHistory() {
    if (!chatHistories[currentCoin]) {
        const coinLabel = coinSelector ? coinSelector.options[coinSelector.selectedIndex].text : currentCoin;
        const isStock = currentMarketType === "stocks" || STOCK_ASSETS.some(a => a.value === currentCoin);
        let welcomeTemplate = LOCALIZATION[currentLanguage].welcomeMessage;
        if (isStock) {
            welcomeTemplate = currentLanguage === "ru"
                ? "Привет! Я твой ИИ-преподаватель по фундаментальному и техническому анализу акций {coin}. Чем могу помочь тебе сегодня? Я могу рассказать про индикаторы (RSI, MACD, SMA), объяснить финансовую отчетность компании или показать основы построения стратегий."
                : "Hello! I am your AI educator for technical and fundamental analysis of {coin} shares. How can I help you today? I can explain indicators (RSI, MACD, SMA), corporate financial reports, or strategy building basics.";
        }
        chatHistories[currentCoin] = [{
            role: "model",
            content: welcomeTemplate.replace("{coin}", coinLabel)
        }];
        saveHistories();
    }
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
            createAndAttachSpeakButton(msg.content, msgEl);
        }

        chatMessagesContainer.appendChild(msgEl);
    });
    
    // Auto scroll to bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

let currentSpeakingBtn = null;
let currentTtsAudio = null;
let ttsAudioQueue = [];
let currentQueueIndex = 0;

/**
 * Creates and returns a TTS speak button for an AI model message element.
 * Attaches click handler and appends the button to the message container.
 * @param {string} rawText - Raw markdown text of the message to be spoken.
 * @param {HTMLElement} msgEl - The message element to append the button to.
 */
function createAndAttachSpeakButton(rawText, msgEl) {
    const speakBtn = document.createElement("button");
    speakBtn.className = "tts-speak-btn";
    speakBtn.innerHTML = `🔊 <span style="font-size: 0.75rem; font-family: inherit; margin-left: 4px;">${currentLanguage === "ru" ? "Прослушать" : "Listen"}</span>`;
    speakBtn.title = currentLanguage === "ru" ? "Озвучить" : "Speak aloud";
    const cleanText = getCleanTtsText(rawText);
    speakBtn.onclick = (e) => {
        e.stopPropagation();
        speakMessage(cleanText, speakBtn);
    };
    msgEl.appendChild(speakBtn);
    return speakBtn;
}

function stopActiveTts() {
    if (currentTtsAudio) {
        currentTtsAudio.pause();
        currentTtsAudio = null;
    }
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    ttsAudioQueue = [];
    currentQueueIndex = 0;
    if (currentSpeakingBtn) {
        const prevLang = currentSpeakingBtn.title === "Озвучить" ? "ru" : "en";
        const prevListenLabel = prevLang === "ru" ? "Прослушать" : "Listen";
        currentSpeakingBtn.innerHTML = `🔊 <span style="font-size: 0.75rem; font-family: inherit; margin-left: 4px;">${prevListenLabel}</span>`;
        currentSpeakingBtn = null;
    }
}

function splitTextIntoTtsChunks(text) {
    const maxLen = 160;
    const rawParts = text.split(/([.!?;\n,]+)/g);
    const chunks = [];
    let currentChunk = "";

    for (let i = 0; i < rawParts.length; i++) {
        const part = rawParts[i];
        if (!part) continue;
        
        if (currentChunk.length + part.length > maxLen) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            if (part.length > maxLen) {
                // Hard split by space
                const words = part.split(/\s+/);
                let wordChunk = "";
                for (const word of words) {
                    if (wordChunk.length + word.length + 1 > maxLen) {
                        if (wordChunk.trim()) chunks.push(wordChunk.trim());
                        wordChunk = word;
                    } else {
                        wordChunk += (wordChunk ? " " : "") + word;
                    }
                }
                currentChunk = wordChunk;
            } else {
                currentChunk = part;
            }
        } else {
            currentChunk += part;
        }
    }
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
}

function playTtsQueue(lang, btn) {
    if (currentQueueIndex >= ttsAudioQueue.length) {
        stopActiveTts();
        return;
    }

    const chunk = ttsAudioQueue[currentQueueIndex];
    // Use our backend proxy to avoid CORS restrictions from browser
    const url = `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(chunk)}`;
    
    currentTtsAudio = new Audio(url);
    currentTtsAudio.onended = () => {
        currentQueueIndex++;
        playTtsQueue(lang, btn);
    };
    currentTtsAudio.onerror = (e) => {
        console.warn("Google TTS proxy chunk error, falling back to browser voice", e);
        fallbackSpeechSynthesis(chunk, lang, btn);
    };
    currentTtsAudio.play().catch(err => {
        console.warn("Autoplay error, falling back to browser voice", err);
        fallbackSpeechSynthesis(chunk, lang, btn);
    });
}

function fallbackSpeechSynthesis(chunkText, lang, btn) {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(chunkText);
    const voices = window.speechSynthesis.getVoices();
    const langCode = lang === "ru" ? "ru-RU" : "en-US";
    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(lang));
    let selectedVoice = null;
    
    if (langVoices.length > 0) {
        const priorityKeywords = ["natural", "google", "neural", "microsoft", "desktop", "mobile"];
        for (const kw of priorityKeywords) {
            selectedVoice = langVoices.find(v => v.name.toLowerCase().includes(kw));
            if (selectedVoice) break;
        }
        if (!selectedVoice) {
            selectedVoice = langVoices[0];
        }
    }
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    utterance.lang = langCode;

    utterance.onend = () => {
        currentQueueIndex++;
        playTtsQueue(lang, btn);
    };
    utterance.onerror = () => {
        currentQueueIndex++;
        playTtsQueue(lang, btn);
    };
    window.speechSynthesis.speak(utterance);
}

function getCleanTtsText(content) {
    let clean = content
        .replace(/\[green\]\{([^}]+)\}/g, '$1')
        .replace(/\[red\]\{([^}]+)\}/g, '$1')
        .replace(/\[green\](.*?)\[\/green\]/gi, '$1')
        .replace(/\[red\](.*?)\[\/red\]/gi, '$1')
        .replace(/\[green\]([a-zA-Z0-9_-]+)/g, '$1')
        .replace(/\[red\]([a-zA-Z0-9_-]+)/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^[-\*\+]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '');

    if (currentLanguage === "ru") {
        clean = clean
            .replace(/\bRSI\b/gi, "эр эс и")
            .replace(/\bMACD\b/gi, "мак ди")
            .replace(/\bSMA\b/gi, "скользящая средняя")
            .replace(/\bEMA\b/gi, "экспоненциальная скользящая средняя")
            .replace(/\bBollinger Bands\b/gi, "полосы Боллинджера")
            .replace(/\bBollinger\b/gi, "Боллинджера")
            .replace(/\bDeath Cross\b/gi, "крест смерти")
            .replace(/\bGolden Cross\b/gi, "золотой крест")
            .replace(/\boversold\b/gi, "перепроданность")
            .replace(/\boverbought\b/gi, "перекупленность")
            .replace(/\bbullish\b/gi, "бычий")
            .replace(/\bbearish\b/gi, "медвежий")
            .replace(/\bBTC\b/g, "биткоин")
            .replace(/\bETH\b/g, "эфириум")
            .replace(/\bSOL\b/g, "солана")
            .replace(/\bXRP\b/g, "рипл")
            .replace(/\bDOGE\b/g, "догикоин")
            .replace(/\bSHIB\b/g, "шиба ину")
            .replace(/\bPEPE\b/g, "пепе");
    }
    return clean;
}

function speakMessage(text, btn) {
    const stopLabel = currentLanguage === "ru" ? "Остановить" : "Stop";

    if (currentSpeakingBtn) {
        const wasClickedBtn = (currentSpeakingBtn === btn);
        stopActiveTts();
        if (wasClickedBtn) {
            return;
        }
    }

    const chunks = splitTextIntoTtsChunks(text);
    if (chunks.length === 0) return;

    ttsAudioQueue = chunks;
    currentQueueIndex = 0;
    currentSpeakingBtn = btn;
    btn.innerHTML = `⏹️ <span style="font-size: 0.75rem; font-family: inherit; margin-left: 4px;">${stopLabel}</span>`;

    playTtsQueue(currentLanguage, btn);
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
            chipEl.className = "chip indicator-chip-wrapper";
            chipEl.style.position = "relative";
            chipEl.style.display = "inline-flex";
            chipEl.style.alignItems = "center";
            chipEl.style.gap = "6px";
            chipEl.style.cursor = "default";
            
            const indName = ind.name[currentLanguage];
            const labelSpan = document.createElement("span");
            labelSpan.style.cursor = "pointer";
            labelSpan.textContent = currentLanguage === "ru" ? `Изучить индикатор: ${indName}` : `Study indicator: ${indName}`;
            labelSpan.onclick = (e) => {
                e.stopPropagation();
                chatInput.value = ind.query[currentLanguage];
                sendMessage();
            };
            
            const arrowBtn = document.createElement("span");
            arrowBtn.className = "indicator-select-arrow";
            arrowBtn.innerHTML = " ▾";
            arrowBtn.style.cursor = "pointer";
            arrowBtn.style.padding = "2px 6px";
            arrowBtn.style.borderRadius = "4px";
            arrowBtn.style.background = "rgba(255, 255, 255, 0.08)";
            arrowBtn.title = currentLanguage === "ru" ? "Выбрать другой индикатор" : "Select another indicator";
            
            // Dropdown menu element
            const selectMenu = document.createElement("div");
            selectMenu.className = "indicator-dropdown-menu";
            selectMenu.style.display = "none";
            selectMenu.style.position = "absolute";
            selectMenu.style.bottom = "100%";
            selectMenu.style.left = "0";
            selectMenu.style.marginBottom = "6px";
            selectMenu.style.background = "rgba(15, 23, 42, 0.95)";
            selectMenu.style.backdropFilter = "blur(12px)";
            selectMenu.style.border = "1px solid rgba(255, 255, 255, 0.15)";
            selectMenu.style.borderRadius = "10px";
            selectMenu.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
            selectMenu.style.zIndex = "100";
            selectMenu.style.maxHeight = "220px";
            selectMenu.style.overflowY = "auto";
            selectMenu.style.padding = "6px 0";
            selectMenu.style.minWidth = "240px";
            
            INDICATORS_OF_THE_DAY.forEach(item => {
                const menuItem = document.createElement("div");
                menuItem.className = "indicator-dropdown-item";
                menuItem.style.padding = "8px 14px";
                menuItem.style.fontSize = "0.82rem";
                menuItem.style.cursor = "pointer";
                menuItem.style.color = "#e2e8f0";
                menuItem.style.transition = "background 0.2s ease";
                menuItem.textContent = item.name[currentLanguage];
                
                menuItem.onmouseenter = () => { menuItem.style.background = "rgba(249, 115, 22, 0.2)"; };
                menuItem.onmouseleave = () => { menuItem.style.background = "transparent"; };
                menuItem.onclick = (e) => {
                    e.stopPropagation();
                    selectMenu.style.display = "none";
                    labelSpan.textContent = currentLanguage === "ru" ? `Изучить индикатор: ${item.name.ru}` : `Study indicator: ${item.name.en}`;
                    chatInput.value = item.query[currentLanguage];
                    sendMessage();
                };
                selectMenu.appendChild(menuItem);
            });
            
            arrowBtn.onclick = (e) => {
                e.stopPropagation();
                const isOpen = selectMenu.style.display === "block";
                document.querySelectorAll(".indicator-dropdown-menu").forEach(m => m.style.display = "none");
                selectMenu.style.display = isOpen ? "none" : "block";
            };

            chipEl.appendChild(labelSpan);
            chipEl.appendChild(arrowBtn);
            chipEl.appendChild(selectMenu);
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
    if (!localStorage.getItem("session_token")) {
        saveHistories();
    }
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

        // Bug fix: don't save empty responses to history (e.g. if stream yields nothing)
        if (modelResponseText.trim()) {
            chatHistories[currentCoin].push({ role: "model", content: modelResponseText });
            if (!localStorage.getItem("session_token")) {
                saveHistories();
            }
            // Add TTS speak button using shared helper
            createAndAttachSpeakButton(modelResponseText, modelMsgEl);
        }


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
    const pineBtn = document.getElementById("tab-pine-btn");
    if (pineBtn) pineBtn.classList.remove("active");
    
    document.getElementById(`tab-${tabId}-btn`).classList.add("active");
    
    // Manage active contents
    document.getElementById("tab-summary-content").classList.remove("active");
    document.getElementById("tab-news-content").classList.remove("active");
    const btContent = document.getElementById("tab-backtester-content");
    if (btContent) btContent.classList.remove("active");
    const pineContent = document.getElementById("tab-pine-content");
    if (pineContent) pineContent.classList.remove("active");
    
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

    // 1.5 Join consecutive blockquote lines starting with &gt;
    let lines = formatted.split('\n');
    let insideBlockquote = false;
    let bqType = null; // 'note', 'warning', 'caution', 'tip', or 'normal'
    let bqLines = [];
    let newLines = [];
    
    for (let line of lines) {
        let trimmed = line.trim();
        if (trimmed.startsWith('&gt;')) {
            let content = trimmed.substring(4).trim();
            if (content.startsWith('[!NOTE]')) {
                bqType = 'note';
                content = content.replace('[!NOTE]', '').trim();
            } else if (content.startsWith('[!WARNING]')) {
                bqType = 'warning';
                content = content.replace('[!WARNING]', '').trim();
            } else if (content.startsWith('[!CAUTION]')) {
                bqType = 'caution';
                content = content.replace('[!CAUTION]', '').trim();
            } else if (content.startsWith('[!TIP]')) {
                bqType = 'tip';
                content = content.replace('[!TIP]', '').trim();
            } else if (!insideBlockquote) {
                bqType = 'normal';
            }
            bqLines.push(content);
            insideBlockquote = true;
        } else {
            if (insideBlockquote) {
                let fullContent = bqLines.join(' ');
                let wrapperClass = bqType === 'normal' ? '' : ` class="callout-${bqType}"`;
                newLines.push(`<blockquote${wrapperClass}>${fullContent}</blockquote>`);
                bqLines = [];
                insideBlockquote = false;
                bqType = null;
            }
            newLines.push(line);
        }
    }
    if (insideBlockquote) {
        let fullContent = bqLines.join(' ');
        let wrapperClass = bqType === 'normal' ? '' : ` class="callout-${bqType}"`;
        newLines.push(`<blockquote${wrapperClass}>${fullContent}</blockquote>`);
    }
    formatted = newLines.join('\n');
        
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
    lines = formatted.split('\n');
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
        if (block.startsWith('<ul') || block.startsWith('<div class="summary-section-header"') || block.startsWith('<blockquote')) {
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
        el.classList.add("text-neon-red");
        el.classList.remove("text-neon-green");
    } else if (isGreen) {
        el.style.color = "var(--neon-green)";
        el.classList.add("text-neon-green");
        el.classList.remove("text-neon-red");
    } else {
        el.style.color = "var(--text-primary)";
        el.classList.remove("text-neon-red", "text-neon-green");
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

function toggleAIChatDrawer(isOpen) {
    const rightPanel = document.querySelector(".right-panel");
    const backdrop = document.getElementById("chat-drawer-backdrop");
    if (!rightPanel) return;

    if (isOpen === undefined) {
        isOpen = !rightPanel.classList.contains("open");
    }

    if (isOpen) {
        rightPanel.classList.add("open");
        if (backdrop) backdrop.classList.add("active");
    } else {
        rightPanel.classList.remove("open");
        if (backdrop) backdrop.classList.remove("active");
    }
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
// Vertical Resize Handle (Flexible TradingView Chart Height)
// -------------------------------------------------------------------------

function initVerticalChartResize() {
    const handle = document.getElementById("chart-resize-handle");
    const chartCard = document.getElementById("chart-card-container");
    const chartContainer = document.getElementById("tv-chart-container");
    const centerPanel = document.querySelector(".center-panel");
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    if (!handle || !chartCard || !centerPanel) return;

    const startDrag = (clientY) => {
        isResizing = true;
        startY = clientY;
        startHeight = chartCard.getBoundingClientRect().height;
        handle.classList.add("dragging");
        document.body.style.cursor = "row-resize";
        document.body.style.userSelect = "none";
        if (chartContainer) {
            chartContainer.style.pointerEvents = "none";
        }
    };

    const doDrag = (clientY) => {
        if (!isResizing) return;
        const dy = clientY - startY;
        const panelHeight = centerPanel.getBoundingClientRect().height;
        const newHeight = Math.max(180, Math.min(panelHeight - 120, startHeight + dy));
        
        chartCard.style.height = `${newHeight}px`;
        chartCard.style.flex = "none";
    };

    const stopDrag = () => {
        if (isResizing) {
            isResizing = false;
            handle.classList.remove("dragging");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            if (chartContainer) {
                chartContainer.style.pointerEvents = "auto";
            }
            if (typeof renderTradingViewWidget === "function") {
                renderTradingViewWidget();
            }
        }
    };

    handle.addEventListener("mousedown", (e) => startDrag(e.clientY));
    document.addEventListener("mousemove", (e) => doDrag(e.clientY));
    document.addEventListener("mouseup", stopDrag);

    // Touch support for tablet/mobile
    handle.addEventListener("touchstart", (e) => {
        if (e.touches && e.touches[0]) startDrag(e.touches[0].clientY);
    }, { passive: true });
    document.addEventListener("touchmove", (e) => {
        if (e.touches && e.touches[0]) doDrag(e.touches[0].clientY);
    }, { passive: true });
    document.addEventListener("touchend", stopDrag);

    // Keep chart within visible bounds on window resize
    window.addEventListener("resize", () => {
        if (!chartCard || !centerPanel) return;
        const panelHeight = centerPanel.getBoundingClientRect().height;
        const currentChartHeight = chartCard.getBoundingClientRect().height;
        if (currentChartHeight > panelHeight - 120 && panelHeight > 300) {
            chartCard.style.height = `${Math.max(180, panelHeight - 140)}px`;
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
    if (e.key === "Enter") {
        if (e.ctrlKey || e.shiftKey) {
            return; // Allow newline
        }
        e.preventDefault();
        sendMessage();
    }
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
let studiedIndicators = [];

function isIndicatorMentioned(ind) {
    const idLower = ind.id.toLowerCase();
    if (studiedIndicators.includes(idLower)) {
        return true;
    }

    const history = chatHistories[currentCoin] || [];
    const nameEnLower = ind.name.en.toLowerCase();
    const nameRuLower = ind.name.ru.toLowerCase();
    
    for (const msg of history) {
        const text = (msg.content || "").toLowerCase();
        if (text.includes(idLower) || text.includes(nameEnLower) || text.includes(nameRuLower)) {
            markIndicatorAsStudied(idLower);
            return true;
        }
        if (ind.id === "bollinger" && text.includes("боллинджер")) {
            markIndicatorAsStudied("bollinger");
            return true;
        }
        if (ind.id === "stochastic" && text.includes("стохастик")) {
            markIndicatorAsStudied("stochastic");
            return true;
        }
        if (ind.id === "ichimoku" && text.includes("ишимоку")) {
            markIndicatorAsStudied("ichimoku");
            return true;
        }
        if (ind.id === "fibonacci" && text.includes("фибоначч")) {
            markIndicatorAsStudied("fibonacci");
            return true;
        }
    }
    return false;
}

function getFreshIndicatorOfTheDay() {
    const unstudied = INDICATORS_OF_THE_DAY.filter(ind => !isIndicatorMentioned(ind));
    if (unstudied.length > 0) {
        const randomIndex = Math.floor(Math.random() * unstudied.length);
        return unstudied[randomIndex];
    }
    const randomIndex = Math.floor(Math.random() * INDICATORS_OF_THE_DAY.length);
    return INDICATORS_OF_THE_DAY[randomIndex];
}

// Close dropdowns on outside click
document.addEventListener("click", () => {
    document.querySelectorAll(".indicator-dropdown-menu").forEach(m => m.style.display = "none");
});

// Initial Bootstrap
document.documentElement.lang = currentLanguage;
initTheme();
applyCoinTheme(currentCoin);
localizeUI();
checkUserSession().then(async () => {
    await loadTradingViewSettings();
    renderTradingViewWidget();
    await loadStudiedIndicators();
    await loadApiKeysList();
    await initChatSession();
    await loadAIContent();
    await syncQuizProgressFromServer();
});
initResizeHandle();
initVerticalChartResize();
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
    
    if (!answeredQuestions.includes(currentQuizQuestionIndex)) {
        answeredQuestions.push(currentQuizQuestionIndex);
    }
    saveQuizProgressOnServer(quizScore, answeredQuestions);

    if (quizScore >= 10) {
        unlockBadge(currentLanguage === "ru" ? "Квиз-Мастер" : "Quiz Master");
    }

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

            // Render Chart.js line graph
            const canvas = document.getElementById("backtest-equity-canvas");
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (window.backtestChartInstance) {
                    window.backtestChartInstance.destroy();
                }
                
                const curve = data.equity_curve || [];
                const labels = curve.map(c => c.label);
                const values = curve.map(c => c.value);
                
                const finalVal = values[values.length - 1] || 1000;
                const lineColor = finalVal >= 1000 ? "#10B981" : "#F43F5E";
                const glowColor = finalVal >= 1000 ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)";
                
                window.backtestChartInstance = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: labels,
                        datasets: [{
                            label: currentLanguage === "ru" ? "Баланс ($)" : "Balance ($)",
                            data: values,
                            borderColor: lineColor,
                            borderWidth: 2,
                            backgroundColor: glowColor,
                            fill: true,
                            tension: 0.35,
                            pointRadius: 3,
                            pointBackgroundColor: lineColor,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: "rgba(15, 23, 42, 0.9)",
                                borderColor: "rgba(255, 255, 255, 0.08)",
                                borderWidth: 1,
                                titleColor: "#94A3B8",
                                bodyColor: "#F8FAFC",
                                callbacks: {
                                    label: function(context) {
                                        return ` $${context.parsed.y.toFixed(2)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: { color: "#94A3B8", font: { size: 9 } }
                            },
                            y: {
                                grid: { color: "rgba(255, 255, 255, 0.04)" },
                                ticks: { color: "#94A3B8", font: { size: 9 } }
                            }
                        }
                    }
                });
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

async function saveApiKey() {
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
        for (const k in clientSummaryCache) {
            delete clientSummaryCache[k];
        }
        
        const sessionToken = localStorage.getItem("session_token");
        if (sessionToken) {
            await addApiKeyToDB(key);
        }
        
        localizeUI();
        statusDiv.textContent = currentLanguage === "ru" ? "✅ Ключ успешно применен!" : "✅ Key applied successfully!";
        statusDiv.style.color = "var(--neon-green)";
        statusDiv.style.display = "block";
        keyInput.value = ""; // clear input
        
        // Reload content to use the new key with forceRefresh = true
        await loadAIContent(true);
        
        // Clear current chat session and re-welcome user to get live interaction
        if (sessionToken) {
            fetch(`/api/user/chat-history/clear/${currentCoin}?lang=${currentLanguage}`, {
                method: "POST",
                headers: getAuthHeaders()
            }).then(() => {
                chatHistories[currentCoin] = null;
                initChatSession();
            }).catch(e => {
                console.error("Failed to clear chat history on server", e);
                chatHistories[currentCoin] = null;
                initChatSession();
            });
        } else {
            chatHistories[currentCoin] = null;
            initChatSession();
        }
        
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

// -------------------------------------------------------------------------
// User Authentication State & Modal Handlers
// -------------------------------------------------------------------------
let currentAuthTab = "login";

function openAuthModal() {
    const modal = document.getElementById("auth-modal");
    const errorMsg = document.getElementById("auth-error-msg");
    const emailInput = document.getElementById("auth-email");
    const passwordInput = document.getElementById("auth-password");
    
    // Reset confirmation states
    document.getElementById("auth-form").style.display = "block";
    document.getElementById("auth-modal-header-sec").style.display = "block";
    document.getElementById("confirm-form").style.display = "none";
    
    if (errorMsg) errorMsg.style.display = "none";
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
    
    switchAuthTab("login");
    if (modal) modal.style.display = "flex";
    initGoogleAuth();
}

function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.style.display = "none";
}

function switchAuthTab(tab) {
    currentAuthTab = tab;
    const tabLogin = document.getElementById("tab-login-btn");
    const tabRegister = document.getElementById("tab-register-btn");
    const submitBtn = document.getElementById("auth-submit-btn");
    
    if (tab === "login") {
        if (tabLogin) {
            tabLogin.classList.add("active");
            tabLogin.style.color = "var(--text-primary)";
            tabLogin.style.borderBottom = "2px solid var(--neon-blue)";
        }
        if (tabRegister) {
            tabRegister.classList.remove("active");
            tabRegister.style.color = "var(--text-muted)";
            tabRegister.style.borderBottom = "2px solid transparent";
        }
        if (submitBtn) {
            submitBtn.textContent = currentLanguage === "ru" ? "Войти" : "Login";
        }
    } else {
        if (tabRegister) {
            tabRegister.classList.add("active");
            tabRegister.style.color = "var(--text-primary)";
            tabRegister.style.borderBottom = "2px solid var(--neon-blue)";
        }
        if (tabLogin) {
            tabLogin.classList.remove("active");
            tabLogin.style.color = "var(--text-muted)";
            tabLogin.style.borderBottom = "2px solid transparent";
        }
        if (submitBtn) {
            submitBtn.textContent = currentLanguage === "ru" ? "Зарегистрироваться" : "Register";
        }
    }
}

let tempRegistrationEmail = "";

async function handleAuthSubmit(event) {
    event.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const errorMsg = document.getElementById("auth-error-msg");
    const submitBtn = document.getElementById("auth-submit-btn");
    
    if (errorMsg) errorMsg.style.display = "none";
    
    if (currentAuthTab === "register" && password.length < 6) {
        if (errorMsg) {
            errorMsg.textContent = currentLanguage === "ru" ? "Пароль должен быть не менее 6 символов" : "Password must be at least 6 characters";
            errorMsg.style.display = "block";
        }
        return;
    }
    
    if (submitBtn) submitBtn.disabled = true;
    
    const url = currentAuthTab === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
            if (currentAuthTab === "register") {
                tempRegistrationEmail = email;
                tempRegistrationToken = data.token;
                document.getElementById("auth-form").style.display = "none";
                document.getElementById("auth-modal-header-sec").style.display = "none";
                const cf = document.getElementById("confirm-form");
                if (cf) cf.style.display = "block";
                const cd = document.getElementById("confirm-code");
                if (cd) {
                    cd.value = "";
                    cd.focus();
                }
            } else {
                localStorage.setItem("session_token", data.token);
                closeAuthModal();
                await checkUserSession();
                
                // Reload page states & history
                loadAIContent();
                chatHistories[currentCoin] = null;
                await initChatSession();
            }
        } else {
            if (errorMsg) {
                errorMsg.textContent = data.detail || (currentLanguage === "ru" ? "Ошибка авторизации" : "Authentication failed");
                errorMsg.style.display = "block";
            }
        }
    } catch (e) {
        console.error("Auth submit error", e);
        if (errorMsg) {
            errorMsg.textContent = currentLanguage === "ru" ? "Ошибка подключения к серверу" : "Connection error";
            errorMsg.style.display = "block";
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function logoutUser() {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            headers: getAuthHeaders()
        });
    } catch (e) {
        console.error("Logout request failed", e);
    }
    localStorage.removeItem("session_token");
    checkUserSession();
    
    // Clear and reload
    loadAIContent();
    chatHistories[currentCoin] = null;
    await initChatSession();
}

async function checkUserSession() {
    const loginBtn = document.getElementById("auth-login-btn");
    const profileSec = document.getElementById("user-profile-section");
    const emailDisp = document.getElementById("user-email-display");
    const apiKeysMgr = document.getElementById("api-keys-manager-sec");
    const alertsBell = document.getElementById("alerts-bell-container");
    const badgesShelf = document.getElementById("user-badges-shelf");
    const sessionToken = localStorage.getItem("session_token");
    
    if (!sessionToken) {
        if (loginBtn) loginBtn.style.display = "block";
        if (profileSec) profileSec.style.display = "none";
        if (apiKeysMgr) apiKeysMgr.style.display = "none";
        if (alertsBell) alertsBell.style.display = "none";
        if (badgesShelf) badgesShelf.innerHTML = "";
        return;
    }
    
    try {
        const resp = await fetch("/api/auth/me", {
            headers: getAuthHeaders()
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data.success) {
                if (loginBtn) loginBtn.style.display = "none";
                if (profileSec) profileSec.style.display = "flex";
                if (emailDisp) emailDisp.textContent = data.email;
                if (apiKeysMgr) apiKeysMgr.style.display = "block";
                if (alertsBell) alertsBell.style.display = "flex";
                
                // Load user achievements & alerts count
                loadUserBadges();
                updateAlertsCount();
                return;
            }
        }
    } catch (e) {
        console.error("Failed to validate user session", e);
    }
    
    // Session is invalid/expired
    localStorage.removeItem("session_token");
    if (loginBtn) loginBtn.style.display = "block";
    if (profileSec) profileSec.style.display = "none";
    if (apiKeysMgr) apiKeysMgr.style.display = "none";
    if (alertsBell) alertsBell.style.display = "none";
    if (badgesShelf) badgesShelf.innerHTML = "";
}

// Bind auth buttons click listeners
const authLoginBtn = document.getElementById("auth-login-btn");
const authLogoutBtn = document.getElementById("auth-logout-btn");
if (authLoginBtn) authLoginBtn.onclick = openAuthModal;
if (authLogoutBtn) authLogoutBtn.onclick = logoutUser;

// -------------------------------------------------------------------------
// Custom Indicator Settings Modal Handlers
// -------------------------------------------------------------------------
function openIndicatorSettingsModal() {
    const modal = document.getElementById("indicator-settings-modal");
    
    // Load current configuration and populate form fields
    loadIndicatorConfigIntoForm().then(() => {
        if (modal) modal.style.display = "flex";
    });
}

function closeIndicatorSettingsModal() {
    const modal = document.getElementById("indicator-settings-modal");
    if (modal) modal.style.display = "none";
}

async function loadIndicatorConfigIntoForm() {
    let config = {
        rsi_length: 14, rsi_overbought: 70, rsi_oversold: 30,
        macd_fast: 12, macd_slow: 26, macd_signal: 9,
        sma_fast: 50, sma_slow: 200, bb_length: 20, bb_stddev: 2.0
    };
    
    const sessionToken = localStorage.getItem("session_token");
    if (sessionToken) {
        try {
            const resp = await fetch("/api/user/indicators", {
                headers: getAuthHeaders()
            });
            const data = await resp.json();
            if (data.success && data.config) {
                config = data.config;
            }
        } catch (e) {
            console.error("Failed to load user indicator configs from server", e);
        }
    } else {
        // Load from localStorage for guest
        const saved = localStorage.getItem("guest_indicator_config");
        if (saved) {
            try {
                config = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse guest indicator configs", e);
            }
        }
    }
    
    // Populate fields
    document.getElementById("cfg-rsi-length").value = config.rsi_length || 14;
    document.getElementById("cfg-rsi-overbought").value = config.rsi_overbought || 70;
    document.getElementById("cfg-rsi-oversold").value = config.rsi_oversold || 30;
    document.getElementById("cfg-sma-fast").value = config.sma_fast || 50;
    document.getElementById("cfg-sma-slow").value = config.sma_slow || 200;
    document.getElementById("cfg-bb-length").value = config.bb_length || 20;
    document.getElementById("cfg-bb-stddev").value = config.bb_stddev || 2.0;
    document.getElementById("cfg-macd-fast").value = config.macd_fast || 12;
    document.getElementById("cfg-macd-slow").value = config.macd_slow || 26;
    document.getElementById("cfg-macd-signal").value = config.macd_signal || 9;
}

async function handleIndicatorSettingsSubmit(event) {
    event.preventDefault();
    const config = {
        rsi_length: parseInt(document.getElementById("cfg-rsi-length").value),
        rsi_overbought: parseInt(document.getElementById("cfg-rsi-overbought").value),
        rsi_oversold: parseInt(document.getElementById("cfg-rsi-oversold").value),
        sma_fast: parseInt(document.getElementById("cfg-sma-fast").value),
        sma_slow: parseInt(document.getElementById("cfg-sma-slow").value),
        bb_length: parseInt(document.getElementById("cfg-bb-length").value),
        bb_stddev: parseFloat(document.getElementById("cfg-bb-stddev").value),
        macd_fast: parseInt(document.getElementById("cfg-macd-fast").value),
        macd_slow: parseInt(document.getElementById("cfg-macd-slow").value),
        macd_signal: parseInt(document.getElementById("cfg-macd-signal").value)
    };
    
    const submitBtn = document.getElementById("cfg-submit-btn");
    if (submitBtn) submitBtn.disabled = true;
    
    const sessionToken = localStorage.getItem("session_token");
    if (sessionToken) {
        try {
            await fetch("/api/user/indicators", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(config)
            });
        } catch (e) {
            console.error("Failed to save custom indicator configs to server", e);
        }
    } else {
        localStorage.setItem("guest_indicator_config", JSON.stringify(config));
    }
    
    if (submitBtn) submitBtn.disabled = false;
    closeIndicatorSettingsModal();
    
    // Reload dashboard content to recalculate indicators immediately
    loadAIContent();
}

let tempRegistrationToken = "";

async function handleConfirmSubmit(event) {
    event.preventDefault();
    const code = document.getElementById("confirm-code").value.trim();
    const errorMsg = document.getElementById("confirm-error-msg");
    const submitBtn = document.getElementById("confirm-submit-btn");

    if (errorMsg) errorMsg.style.display = "none";
    if (submitBtn) submitBtn.disabled = true;

    try {
        const resp = await fetch("/api/auth/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: tempRegistrationEmail, code })
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
            localStorage.setItem("session_token", tempRegistrationToken);
            closeAuthModal();
            await checkUserSession();
            
            // Reload page states & history
            loadAIContent();
            chatHistories[currentCoin] = null;
            await initChatSession();
        } else {
            if (errorMsg) {
                errorMsg.textContent = data.detail || (currentLanguage === "ru" ? "Неверный код" : "Invalid code");
                errorMsg.style.display = "block";
            }
        }
    } catch (e) {
        console.error("Confirm submit error", e);
        if (errorMsg) {
            errorMsg.textContent = currentLanguage === "ru" ? "Ошибка подключения к серверу" : "Connection error";
            errorMsg.style.display = "block";
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function loadTradingViewSettings() {
    const sessionToken = localStorage.getItem("session_token");
    if (sessionToken) {
        try {
            const resp = await fetch("/api/user/tradingview-settings", {
                headers: getAuthHeaders()
            });
            const data = await resp.json();
            if (data.success && data.settings) {
                tvIntervalSetting = data.settings.interval;
                tvStyleSetting = data.settings.style;
            }
        } catch (e) {
            console.error("Failed to load TradingView settings from server", e);
        }
    } else {
        tvIntervalSetting = localStorage.getItem("guest_tv_interval") || "D";
        tvStyleSetting = localStorage.getItem("guest_tv_style") || "1";
    }
    
    // Sync selects
    const intSel = document.getElementById("tv-interval-select");
    const stySel = document.getElementById("tv-style-select");
    if (intSel) intSel.value = tvIntervalSetting;
    if (stySel) stySel.value = tvStyleSetting;
}

async function saveTradingViewSettingsLocallyOrOnServer() {
    const sessionToken = localStorage.getItem("session_token");
    if (sessionToken) {
        try {
            await fetch("/api/user/tradingview-settings", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ interval: tvIntervalSetting, style: tvStyleSetting })
            });
        } catch (e) {
            console.error("Failed to save TradingView settings to server", e);
        }
    } else {
        localStorage.setItem("guest_tv_interval", tvIntervalSetting);
        localStorage.setItem("guest_tv_style", tvStyleSetting);
    }
}

function changeTradingViewInterval(val) {
    tvIntervalSetting = val;
    saveTradingViewSettingsLocallyOrOnServer();
    renderTradingViewWidget();
}

function changeTradingViewStyle(val) {
    tvStyleSetting = val;
    saveTradingViewSettingsLocallyOrOnServer();
    renderTradingViewWidget();
}

let answeredQuestions = [];

async function syncQuizProgressFromServer() {
    const sessionToken = localStorage.getItem("session_token");
    if (sessionToken) {
        try {
            const resp = await fetch("/api/user/quiz", {
                headers: getAuthHeaders()
            });
            const data = await resp.json();
            if (data.success && data.quiz) {
                quizScore = data.quiz.score;
                answeredQuestions = data.quiz.answered_questions || [];
                currentQuizQuestionIndex = answeredQuestions.length;
                loadQuizQuestion();
            }
        } catch (e) {
            console.error("Failed to sync quiz progress from server", e);
        }
    } else {
        quizScore = parseInt(localStorage.getItem("quiz_score")) || 0;
        const saved = localStorage.getItem("guest_answered_questions");
        if (saved) {
            try {
                answeredQuestions = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse guest answered questions", e);
            }
        }
        currentQuizQuestionIndex = answeredQuestions.length;
        loadQuizQuestion();
    }
}

async function saveQuizProgressOnServer(score, answered) {
    const sessionToken = localStorage.getItem("session_token");
    if (sessionToken) {
        try {
            await fetch("/api/user/quiz", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ score, answered_questions: answered })
            });
        } catch (e) {
            console.error("Failed to save quiz progress to server", e);
        }
    } else {
        localStorage.setItem("quiz_score", score);
        localStorage.setItem("guest_answered_questions", JSON.stringify(answered));
    }
}

async function loadStudiedIndicators() {
    const sessionToken = localStorage.getItem("session_token");
    if (sessionToken) {
        try {
            const resp = await fetch("/api/user/studied-indicators", {
                headers: getAuthHeaders()
            });
            const data = await resp.json();
            if (data.success && data.indicators) {
                studiedIndicators = data.indicators.map(i => i.toLowerCase());
            }
        } catch (e) {
            console.error("Failed to load studied indicators from server", e);
        }
    } else {
        const saved = localStorage.getItem("guest_studied_indicators");
        if (saved) {
            try {
                studiedIndicators = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse guest studied indicators", e);
            }
        }
    }
}

async function markIndicatorAsStudied(indId) {
    indId = indId.toLowerCase();
    if (studiedIndicators.includes(indId)) return;
    studiedIndicators.push(indId);
    
    const sessionToken = localStorage.getItem("session_token");
    if (sessionToken) {
        try {
            await fetch("/api/user/studied-indicators", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ indicator_name: indId })
            });
        } catch (e) {
            console.error("Failed to save studied indicator to server", e);
        }
    } else {
        localStorage.setItem("guest_studied_indicators", JSON.stringify(studiedIndicators));
    }
}

async function loadApiKeysList() {
    const sessionToken = localStorage.getItem("session_token");
    const container = document.getElementById("api-keys-list-container");
    if (!container) return;
    
    if (!sessionToken) {
        container.innerHTML = "";
        return;
    }
    
    try {
        const resp = await fetch("/api/user/api-keys", {
            headers: getAuthHeaders()
        });
        const data = await resp.json();
        if (data.success && data.keys) {
            container.innerHTML = "";
            
            if (data.keys.length === 0) {
                const emptyItem = document.createElement("div");
                emptyItem.style.fontSize = "0.72rem";
                emptyItem.style.color = "var(--text-muted)";
                emptyItem.style.fontStyle = "italic";
                emptyItem.textContent = currentLanguage === "ru" ? "Нет сохраненных ключей" : "No saved keys";
                container.appendChild(emptyItem);
                
                sessionStorage.removeItem("custom_api_key");
                return;
            }
            
            data.keys.forEach(k => {
                const item = document.createElement("div");
                item.style.display = "flex";
                item.style.justifyContent = "space-between";
                item.style.alignItems = "center";
                item.style.gap = "6px";
                item.style.padding = "4px 8px";
                item.style.background = "var(--input-bg)";
                item.style.borderRadius = "6px";
                item.style.border = "1px solid var(--card-border)";
                
                const maskedKey = k.api_key.substring(0, 8) + "..." + k.api_key.substring(k.api_key.length - 4);
                
                const labelSpan = document.createElement("span");
                labelSpan.style.fontSize = "0.72rem";
                labelSpan.style.cursor = "pointer";
                labelSpan.style.flex = "1";
                labelSpan.style.fontWeight = k.is_active ? "700" : "400";
                labelSpan.style.color = k.is_active ? "var(--neon-green)" : "var(--text-primary)";
                labelSpan.textContent = maskedKey + (k.is_active ? " (Active)" : "");
                labelSpan.onclick = () => activateApiKeyInDB(k.id, k.api_key);
                
                const deleteBtn = document.createElement("button");
                deleteBtn.style.background = "none";
                deleteBtn.style.border = "none";
                deleteBtn.style.color = "var(--neon-rose)";
                deleteBtn.style.cursor = "pointer";
                deleteBtn.style.fontSize = "0.72rem";
                deleteBtn.textContent = "✖";
                deleteBtn.title = currentLanguage === "ru" ? "Удалить" : "Delete";
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteApiKeyFromDB(k.id);
                };
                
                item.appendChild(labelSpan);
                item.appendChild(deleteBtn);
                container.appendChild(item);
                
                if (k.is_active) {
                    sessionStorage.setItem("custom_api_key", k.api_key);
                }
            });
        }
    } catch (e) {
        console.error("Failed to load API keys list from server", e);
    }
}

async function addApiKeyToDB(api_key) {
    try {
        const resp = await fetch("/api/user/api-keys", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ api_key })
        });
        const data = await resp.json();
        if (data.success && data.key) {
            await loadApiKeysList();
        }
    } catch (e) {
        console.error("Failed to add API key to DB", e);
    }
}

async function activateApiKeyInDB(key_id, api_key) {
    try {
        const resp = await fetch(`/api/user/api-keys/activate/${key_id}`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        const data = await resp.json();
        if (data.success) {
            sessionStorage.setItem("custom_api_key", api_key);
            for (const k in clientSummaryCache) {
                delete clientSummaryCache[k];
            }
            await loadApiKeysList();
            
            await loadAIContent(true);
            chatHistories[currentCoin] = null;
            await initChatSession();
        }
    } catch (e) {
        console.error("Failed to activate API key", e);
    }
}

async function deleteApiKeyFromDB(key_id) {
    if (!confirm(currentLanguage === "ru" ? "Вы уверены, что хотите удалить этот API ключ?" : "Are you sure you want to delete this API key?")) {
        return;
    }
    try {
        const resp = await fetch(`/api/user/api-keys/${key_id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        const data = await resp.json();
        if (data.success) {
            sessionStorage.removeItem("custom_api_key");
            for (const k in clientSummaryCache) {
                delete clientSummaryCache[k];
            }
            await loadApiKeysList();
            await loadAIContent(true);
            chatHistories[currentCoin] = null;
            await initChatSession();
        }
    } catch (e) {
        console.error("Failed to delete API key", e);
    }
}

let googleClientId = "";

async function initGoogleAuth() {
    try {
        const resp = await fetch("/api/auth/google/config");
        const data = await resp.json();
        if (data && data.client_id) {
            googleClientId = data.client_id;
            
            if (!googleClientId || googleClientId === "mock-client-id-12345") {
                renderMockGoogleButton();
            } else {
                if (window.google && window.google.accounts) {
                    window.google.accounts.id.initialize({
                        client_id: googleClientId,
                        callback: handleGoogleCredentialResponse
                    });
                    
                    window.google.accounts.id.renderButton(
                        document.getElementById("g-signin-button"),
                        { theme: "outline", size: "large", type: "standard", shape: "rectangular" }
                    );
                } else {
                    renderMockGoogleButton();
                }
            }
        }
    } catch (e) {
        console.error("Failed to initialize Google Auth", e);
        renderMockGoogleButton();
    }
}

function renderMockGoogleButton() {
    const btnContainer = document.getElementById("g-signin-button");
    if (!btnContainer) return;
    
    btnContainer.innerHTML = `
        <button type="button" class="mock-google-btn" onclick="handleMockGoogleClick()" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: #ffffff;
            color: #1f1f1f;
            border: 1px solid #dadce0;
            border-radius: 6px;
            padding: 8px 16px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: background 0.2s ease;
        ">
            <svg viewBox="0 0 24 24" width="18" height="18" style="display: block;">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
            </svg>
            Google Sign-In
        </button>
    `;
    
    const styleId = "mock-google-btn-hover-style";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .mock-google-btn:hover {
                background: #f8f9fa !important;
            }
        `;
        document.head.appendChild(style);
    }
}

async function handleMockGoogleClick() {
    const emailPrompt = currentLanguage === "ru" ? "Введите тестовый email для Google авторизации:" : "Enter test email for Google auth:";
    const testEmail = prompt(emailPrompt, "google_test_user@example.com");
    if (!testEmail) return;
    
    const email = testEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
        alert(currentLanguage === "ru" ? "Неверный формат email!" : "Invalid email format!");
        return;
    }
    
    const mockToken = `mock_google_token_${email}`;
    await sendGoogleCredential(mockToken);
}

async function handleGoogleCredentialResponse(response) {
    if (response && response.credential) {
        await sendGoogleCredential(response.credential);
    }
}

async function sendGoogleCredential(credential) {
    const errorMsg = document.getElementById("auth-error-msg");
    if (errorMsg) errorMsg.style.display = "none";
    
    try {
        const resp = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential })
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
            localStorage.setItem("session_token", data.token);
            closeAuthModal();
            await checkUserSession();
            
            // Reload page states & history
            loadAIContent();
            chatHistories[currentCoin] = null;
            await initChatSession();
        } else {
            if (errorMsg) {
                errorMsg.textContent = data.detail || (currentLanguage === "ru" ? "Ошибка авторизации через Google" : "Google Authentication failed");
                errorMsg.style.display = "block";
            }
        }
    } catch (e) {
        console.error("Google Auth error", e);
        if (errorMsg) {
            errorMsg.textContent = currentLanguage === "ru" ? "Ошибка подключения к серверу" : "Connection error";
            errorMsg.style.display = "block";
        }
    }
}

// -------------------------------------------------------------------------
// Pine Script v5 Generator UI Handlers
// -------------------------------------------------------------------------
function applyPineTemplate(val) {
    const promptInput = document.getElementById("pine-prompt-input");
    if (!promptInput) return;
    
    let text = "";
    if (val === "ema_cross") {
        text = currentLanguage === "ru" 
            ? "Стратегия пересечения скользящих средних EMA 9 и EMA 21 с сигналами на графике и сделками (Buy/Sell)."
            : "Exponential Moving Average crossover strategy using EMA 9 and EMA 21 with on-chart buy/sell signals.";
    } else if (val === "rsi_divergence") {
        text = currentLanguage === "ru"
            ? "Индикатор дивергенции RSI (Relative Strength Index) для поиска зон перекупленности и перепроданности."
            : "RSI divergence indicator showing bullish and bearish divergences with plot shapes.";
    } else if (val === "macd_histogram") {
        text = currentLanguage === "ru"
            ? "Индикатор гистограммы MACD с изменением цвета столбцов при смене тренда и алертами."
            : "MACD histogram crossover indicator with dynamic color changes and alert conditions.";
    }
    promptInput.value = text;
}

async function generateTradingViewPineScript() {
    const promptInput = document.getElementById("pine-prompt-input");
    const prompt = promptInput.value.trim();
    if (!prompt) {
        alert(currentLanguage === "ru" ? "Пожалуйста, введите описание стратегии." : "Please enter a description for the strategy.");
        return;
    }
    
    const loading = document.getElementById("pine-loading");
    const results = document.getElementById("pine-results");
    const genBtn = document.getElementById("generate-pine-btn");
    
    if (genBtn) genBtn.disabled = true;
    if (loading) loading.style.display = "block";
    if (results) results.style.display = "none";
    
    try {
        const response = await fetch("/api/pine-generator", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                prompt: prompt,
                coin_id: currentCoin,
                lang: currentLanguage
            })
        });
        const data = await response.json();
        if (data.success && data.code) {
            const codeBlock = document.getElementById("pine-code-block");
            let code = data.code;
            if (code.startsWith("```pinescript")) {
                code = code.replace("```pinescript", "").replace("```", "");
            } else if (code.startsWith("```")) {
                code = code.replace("```", "").replace("```", "");
            }
            codeBlock.textContent = code.trim();
            if (results) results.style.display = "flex";
        } else {
            alert(currentLanguage === "ru" ? "Ошибка генерации скрипта." : "Failed to generate Pine Script.");
        }
    } catch (e) {
        console.error("Pine generation error", e);
        alert(currentLanguage === "ru" ? "Ошибка подключения при генерации." : "Connection error during generation.");
    } finally {
        if (loading) loading.style.display = "none";
        if (genBtn) genBtn.disabled = false;
    }
}

function copyPineScript() {
    const codeBlock = document.getElementById("pine-code-block");
    if (!codeBlock) return;
    navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        alert(currentLanguage === "ru" ? "Код скопирован!" : "Pine Script code copied to clipboard!");
    }).catch(err => {
        console.error("Copy failed", err);
    });
}

// -------------------------------------------------------------------------
// User Alerts UI Handlers
// -------------------------------------------------------------------------
async function loadUserAlerts() {
    const container = document.getElementById("alerts-list-container");
    if (!container) return;
    
    container.innerHTML = `<div style="text-align:center;font-size:0.75rem;color:var(--text-muted);">Loading alerts...</div>`;
    
    try {
        const response = await fetch("/api/user/alerts", {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success && data.alerts) {
            container.innerHTML = "";
            if (data.alerts.length === 0) {
                container.innerHTML = `<div style="text-align:center;font-size:0.75rem;color:var(--text-muted);">Нет активных оповещений / No active alerts</div>`;
                return;
            }
            data.alerts.forEach(al => {
                const item = document.createElement("div");
                item.className = `alert-item ${al.is_triggered ? 'triggered' : ''}`;
                item.innerHTML = `
                    <div>
                        <strong style="text-transform: uppercase;">${al.coin_id}</strong>: 
                        <span>${al.metric} ${al.condition} ${al.value}</span>
                        ${al.is_triggered ? ' <span style="color:var(--neon-rose);font-weight:700;">(Triggered)</span>' : ''}
                    </div>
                    <button class="delete-alert-btn" onclick="deleteAlert(${al.id})">&times;</button>
                `;
                container.appendChild(item);
            });
        }
    } catch (e) {
        console.error("Failed to load alerts", e);
        container.innerHTML = `<div style="text-align:center;font-size:0.75rem;color:var(--neon-rose);">Failed to load alerts</div>`;
    }
}

async function handleCreateAlert(event) {
    event.preventDefault();
    const metric = document.getElementById("alert-metric").value;
    const condition = document.getElementById("alert-cond").value;
    const value = parseFloat(document.getElementById("alert-val").value);
    
    try {
        const response = await fetch("/api/user/alerts", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                coin_id: currentCoin,
                metric: metric,
                condition: condition,
                value: value
            })
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById("alert-val").value = "";
            loadUserAlerts();
            updateAlertsCount();
        }
    } catch (e) {
        console.error("Failed to create alert", e);
    }
}

async function deleteAlert(alertId) {
    try {
        const response = await fetch(`/api/user/alerts/${alertId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success) {
            loadUserAlerts();
            updateAlertsCount();
        }
    } catch (e) {
        console.error("Failed to delete alert", e);
    }
}

async function updateAlertsCount() {
    const badge = document.getElementById("alerts-count-badge");
    if (!badge) return;
    
    try {
        const response = await fetch("/api/user/alerts", {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success && data.alerts) {
            const activeAlerts = data.alerts.filter(al => !al.is_triggered);
            if (activeAlerts.length > 0) {
                badge.textContent = activeAlerts.length;
                badge.style.display = "flex";
            } else {
                badge.style.display = "none";
            }
        }
    } catch (e) {
        badge.style.display = "none";
    }
}

function openAlertsModal() {
    const modal = document.getElementById("alerts-modal");
    if (modal) {
        modal.style.display = "flex";
        loadUserAlerts();
    }
}

function closeAlertsModal() {
    const modal = document.getElementById("alerts-modal");
    if (modal) modal.style.display = "none";
}

function showCustomNotification(title, text, isRose = false) {
    const popup = document.createElement("div");
    popup.className = `custom-notification ${isRose ? 'rose' : ''}`;
    popup.innerHTML = `
        <div style="font-weight:700; font-size:0.88rem; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
            ${isRose ? '🚨' : '🔔'} <span>${title}</span>
        </div>
        <div style="font-size:0.78rem; opacity:0.85;">${text}</div>
    `;
    document.body.appendChild(popup);
    
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(600, context.currentTime);
        gainNode.gain.setValueAtTime(0.08, context.currentTime);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.15);
    } catch (se) {}
    
    setTimeout(() => {
        popup.style.animation = "slideUp 0.3s ease reverse forwards";
        setTimeout(() => popup.remove(), 300);
    }, 4500);
}

function checkTriggeredAlerts(triggered) {
    if (!triggered || triggered.length === 0) return;
    triggered.forEach(al => {
        const title = currentLanguage === "ru" ? "Сработало оповещение!" : "Alert Triggered!";
        const text = currentLanguage === "ru"
            ? `Индикатор или цена ${al.coin_id.toUpperCase()} достиг значения: ${al.metric} ${al.condition} ${al.value} (текущее: ${al.triggered_value.toFixed(2)})`
            : `${al.coin_id.toUpperCase()} ${al.metric} reached trigger condition: ${al.condition} ${al.value} (current: ${al.triggered_value.toFixed(2)})`;
        showCustomNotification(title, text, true);
    });
    updateAlertsCount();
}

// -------------------------------------------------------------------------
// User Achievements Badges UI Handlers
// -------------------------------------------------------------------------
async function loadUserBadges() {
    const shelf = document.getElementById("user-badges-shelf");
    if (!shelf) return;
    shelf.innerHTML = "";
    
    const token = localStorage.getItem("session_token");
    if (!token) return;
    
    try {
        const response = await fetch("/api/user/badges", {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success && data.badges) {
            data.badges.forEach(bg => {
                const badge = document.createElement("span");
                badge.className = "badge-icon";
                
                let icon = "🏅";
                let desc = bg;
                if (bg.includes("Quiz") || bg.includes("Квиз")) {
                    icon = "🎓";
                    desc = currentLanguage === "ru" ? "Квиз-Мастер: 100% результат в тесте" : "Quiz Master: 100% score on the TA quiz";
                }
                
                badge.textContent = icon;
                badge.title = desc;
                shelf.appendChild(badge);
            });
        }
    } catch (e) {
        console.error("Failed to load badges", e);
    }
}

async function unlockBadge(badgeName) {
    const token = localStorage.getItem("session_token");
    if (!token) return;
    
    try {
        const response = await fetch("/api/user/badges/unlock", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ badge_name: badgeName })
        });
        const data = await response.json();
        if (data.success) {
            const title = currentLanguage === "ru" ? "🏆 Достижение разблокировано!" : "🏆 Achievement Unlocked!";
            const text = currentLanguage === "ru" 
                ? `Вы получили новый бейдж: "${badgeName}"`
                : `You received a new badge: "${badgeName}"`;
            showCustomNotification(title, text, false);
            loadUserBadges();
        }
    } catch (e) {
        console.error("Failed to unlock badge", e);
    }
}

// -------------------------------------------------------------------------
// Chat Search History Filter UI Handlers
// -------------------------------------------------------------------------
function handleChatSearch() {
    const query = document.getElementById("chat-search-input").value.toLowerCase().trim();
    const clearBtn = document.getElementById("chat-search-clear-btn");
    
    if (query) {
        clearBtn.style.display = "block";
    } else {
        clearBtn.style.display = "none";
    }
    
    const messages = document.querySelectorAll("#chat-messages-container .chat-msg");
    messages.forEach(msg => {
        const text = msg.textContent.toLowerCase();
        if (text.includes(query)) {
            msg.classList.remove("hidden-msg");
        } else {
            msg.classList.add("hidden-msg");
        }
    });
}

function clearChatSearch() {
    const input = document.getElementById("chat-search-input");
    input.value = "";
    handleChatSearch();
}

// Bind DOM event listeners
document.addEventListener("DOMContentLoaded", () => {
    // Alerts Bell click listener
    const alertsBellBtn = document.getElementById("alerts-bell-btn");
    if (alertsBellBtn) {
        alertsBellBtn.onclick = openAlertsModal;
    }
    
    // Chat Search input listeners
    const chatSearchInput = document.getElementById("chat-search-input");
    if (chatSearchInput) {
        chatSearchInput.oninput = handleChatSearch;
    }
    const chatSearchClearBtn = document.getElementById("chat-search-clear-btn");
    if (chatSearchClearBtn) {
        chatSearchClearBtn.onclick = clearChatSearch;
    }
});
