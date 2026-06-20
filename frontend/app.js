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
        ]
    },
    en: {
        subtitle: "Educational AI Assistant & Technical Analysis Dashboard",
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
        ]
    }
};

// State Variables
let currentLanguage = localStorage.getItem("lang") || "ru";
let currentTheme = localStorage.getItem("theme") || "dark";
let currentCoin = "bitcoin";
let activeTab = "summary";
let tvWidgetInstance = null;

// Chat histories cached by coin ID: { bitcoin: [messages], ethereum: [messages], ... }
let chatHistories = JSON.parse(localStorage.getItem("chat_histories")) || {};

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
    renderChatMessages(); // Re-render chat (update placeholders)
}

function localizeUI() {
    const t = LOCALIZATION[currentLanguage];
    document.getElementById("header-subtitle").textContent = t.subtitle;
    document.getElementById("label-select-coin").textContent = t.lblSelectCoin;
    document.getElementById("lbl-high-24h").textContent = t.lblHigh24h;
    document.getElementById("lbl-low-24h").textContent = t.lblLow24h;
    document.getElementById("lbl-volume").textContent = t.lblVolume;
    document.getElementById("lbl-cap").textContent = t.lblCap;
    document.getElementById("tab-summary-btn").textContent = t.tabSummary;
    document.getElementById("tab-news-btn").textContent = t.tabNews;
    document.getElementById("lbl-advisor-status").textContent = t.lblAdvisorStatus;
    document.getElementById("chat-disclaimer").innerHTML = t.chatDisclaimer;
    chatInput.placeholder = t.chatPlaceholder;
    document.getElementById("lbl-loading-summary").textContent = t.lblLoadingSummary;
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
    try {
        const response = await fetch("/api/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coin_id: currentCoin, lang: currentLanguage })
        });
        const data = await response.json();
        if (data.success) {
            aiSummaryText.innerHTML = formatMarkdown(data.summary);
            aiSummaryText.style.display = "block";
        } else {
            aiSummaryText.innerHTML = `<p>${LOCALIZATION[currentLanguage].errorSummary}</p>`;
            aiSummaryText.style.display = "block";
        }
    } catch (e) {
        aiSummaryText.innerHTML = `<p>${LOCALIZATION[currentLanguage].errorSummary}</p>`;
        aiSummaryText.style.display = "block";
    } finally {
        summaryLoading.style.display = "none";
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
                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.text) {
                            modelResponseText += parsed.text;
                            modelMsgEl.innerHTML = formatMarkdown(modelResponseText);
                            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                        } else if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                    } catch (e) {
                        // Skip parse errors if chunk is partial
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

function formatMarkdown(text) {
    // Basic Markdown Parser for bold and bullets to render Gemini responses properly
    let formatted = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\[green\]\(([^)]+)\)/g, '<span class="text-neon-green" style="color: var(--neon-green); font-weight: 600; text-shadow: 0 0 8px rgba(16, 185, 129, 0.25);">$1</span>')
        .replace(/\[red\]\(([^)]+)\)/g, '<span class="text-neon-red" style="color: var(--neon-rose); font-weight: 600; text-shadow: 0 0 8px rgba(244, 63, 94, 0.25);">$1</span>')
        .replace(/(?:^|<br>)-\s+([^<]+)/g, "<br>• $1"); // bullets
        
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
    document.getElementById("val-indicator-rsi").textContent = `${indicators.rsi.value} (${indicators.rsi.status})`;
    document.getElementById("val-indicator-macd").textContent = indicators.macd.status;
    document.getElementById("val-indicator-sma").textContent = indicators.moving_averages.status;
    document.getElementById("val-indicator-bb").textContent = indicators.bollinger_bands.status;
    document.getElementById("val-indicator-fg").textContent = `${indicators.fear_greed.value} (${indicators.fear_greed.status})`;
    
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
    
    if (lowerStatus.includes("перекуплен") || lowerStatus.includes("медвеж") || lowerStatus.includes("смерти") || lowerStatus.includes("страх")) {
        el.style.color = "var(--neon-rose)";
    } else if (lowerStatus.includes("перепродан") || lowerStatus.includes("быч") || lowerStatus.includes("золотой") || lowerStatus.includes("жадность")) {
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
// Event Listeners & Bootstrapping
// -------------------------------------------------------------------------

coinSelector.onchange = (e) => {
    currentCoin = e.target.value;
    renderTradingViewWidget();
    initChatSession();
    loadAIContent();
};

langToggleBtn.onclick = toggleLanguage;
themeToggleBtn.onclick = toggleTheme;
chatInput.onkeydown = (e) => {
    if (e.key === "Enter") sendMessage();
};
chatSendBtn.onclick = sendMessage;

// Initial Bootstrap
initTheme();
localizeUI();
renderTradingViewWidget();
initChatSession();
loadAIContent();
initResizeHandle();
