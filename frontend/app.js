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
            "Как мне настроить индикаторы RSI и MACD?"
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
        lblExportBtn: "Скачать отчет"
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
            "How do I set up RSI and MACD indicators?"
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
        lblExportBtn: "Export Report"
    }
};

// Version Check & State Reset on Redeploy
const APP_VERSION = "1.0.3";
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
    
    document.getElementById("tip-rsi").setAttribute("data-tooltip", t.tipRsi);
    document.getElementById("tip-macd").setAttribute("data-tooltip", t.tipMacd);
    document.getElementById("tip-sma").setAttribute("data-tooltip", t.tipSma);
    document.getElementById("tip-bb").setAttribute("data-tooltip", t.tipBb);
    document.getElementById("tip-fg").setAttribute("data-tooltip", t.tipFg);
    
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
    
    // Translate Market Sentiment Title and Update Gauge
    document.getElementById("lbl-sentiment-title").textContent = t.sentimentLabels.sentimentTitle;
    updateSentimentUI();
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

async function loadAIContent() {
    // 1. Fetch Stats, Indicators and News from API
    try {
        const response = await fetch(`/api/market-data/${currentCoin}?lang=${currentLanguage}`);
        const data = await response.json();
        if (data.success) {
            updateStatsUI(data.market_data);
            updateIndicatorsUI(data.indicators);
            renderNewsUI(data.news);
        }
    } catch (e) {
        console.error("Failed to load market data", e);
    }

    // 2. Fetch AI Summary
    summaryLoading.style.display = "flex";
    aiSummaryText.style.display = "none";
    lastRawSummary = "";
    try {
        const response = await fetch("/api/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coin_id: currentCoin, lang: currentLanguage })
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

        // Calculate remaining calls
        const sRemaining = exhausted ? 0 : Math.max(0, limit - sUsed);
        const cRemaining = exhausted ? 0 : Math.max(0, limit - cUsed);

        // --- counts ---
        const sEl = document.getElementById("quota-s");
        const cEl = document.getElementById("quota-c");
        if (sEl) sEl.textContent = sRemaining;
        if (cEl) cEl.textContent = cRemaining;

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
        chatMessagesContainer.appendChild(msgEl);
    });
    
    // Auto scroll to bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function renderQuickChips() {
    quickChipsContainer.innerHTML = "";
    const coinLabel = coinSelector.options[coinSelector.selectedIndex].text;
    const chipsText = LOCALIZATION[currentLanguage].chips;
    
    chipsText.forEach(text => {
        const chipEl = document.createElement("span");
        chipEl.className = "chip";
        const formattedText = text.replace("{coin}", coinLabel);
        chipEl.textContent = formattedText;
        chipEl.onclick = () => {
            chatInput.value = formattedText;
            sendMessage();
        };
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
            headers: { "Content-Type": "application/json" },
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
    
    document.getElementById(`tab-${tabId}-btn`).classList.add("active");
    
    // Manage active contents
    document.getElementById("tab-summary-content").classList.remove("active");
    document.getElementById("tab-news-content").classList.remove("active");
    
    document.getElementById(`tab-${tabId}-content`).classList.add("active");
}

// -------------------------------------------------------------------------
// Formatting Helpers
// -------------------------------------------------------------------------

function preprocessMarkdownTerms(text) {
    let formatted = text;
    
    const termMapping = {
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
        
    // 2. Parse green/red highlights using curly braces BEFORE preprocessing terms
    formatted = formatted
        .replace(/\[green\]\{([^}]+)\}/g, '<span class="text-neon-green" style="color: var(--neon-green); font-weight: 600; text-shadow: 0 0 8px rgba(16, 185, 129, 0.25);">$1</span>')
        .replace(/\[red\]\{([^}]+)\}/g, '<span class="text-neon-red" style="color: var(--neon-rose); font-weight: 600; text-shadow: 0 0 8px rgba(244, 63, 94, 0.25);">$1</span>');
        
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
    document.getElementById("val-indicator-fg").innerHTML = `${indicators.fear_greed.value} (<span class="term-link" onclick="askAgentAboutTerm('${indicators.fear_greed.status}', 'Fear & Greed')">${indicators.fear_greed.status}</span>)`;
    
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

// Initial Bootstrap
initTheme();
applyCoinTheme(currentCoin);
localizeUI();
renderTradingViewWidget();
initChatSession();
loadAIContent();
initResizeHandle();
updateQuotaUI();
// Refresh quota indicator every 60 seconds
setInterval(updateQuotaUI, 60000);

