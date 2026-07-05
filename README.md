# 🌐 Crypto AI Advisor & Educational Dashboard

A premium web application designed for cryptocurrency beginners. It features a modern TradingView-integrated educational dashboard, real-time prices, indicators, fundamental news, and a highly secured AI agent built to teach trading concepts without financial risk.

---

## 🚀 Key Dashboard Features

This application has been developed with advanced UI design (Glassmorphic Dark/Light aesthetics) and a secured conversational AI interface.

### 1. Market Sentiment Dial Gauge (Trend Indicator)
*   **Gauge Visuals**: A beautiful, realistic semi-circular dial gauge displaying market sentiment (from *Strong Sell* to *Strong Buy*) with custom SVG gradation scale ticks.
*   **Tapered Needle**: Features a tapered, neon-rose glowing indicator needle that dynamically animates to the calculated sentiment score.
*   **Timeframe Selectors**: Quick controls (`12h`, `1W`, `1M`, `3M`, `6M`) that dynamically recalculate the asset's sentiment.
*   **Click-to-Explain Details**: The sentiment status value is clickable. Clicking it triggers an educational question directly to the AI chat, prompting the agent to explain what that specific sentiment level and timeframe mean in simple terms.

### 2. Interactive Technical Indicators & Clickable Terms
*   Displays real-time computed technical values for **RSI (14)**, **MACD**, **SMA Crossovers**, **Bollinger Bands**, and the **Fear & Greed Index**.
*   All status values (e.g. *Golden Cross*, *Overbought*, *Fear*) are fully interactive. Clicking on them sends a query to the AI agent to explain the underlying indicators.
*   Tooltips with educational explanations appear when hovering over the `?` icons, styled dynamically to prevent screen-edge clipping.

### 3. Interactive AI Summary & Glowing Badges
*   The **AI Summary** is dynamically preprocessed on the client side: key financial and technical terms (like *sideways trend*, *whales*, *RSI*) are converted into clickable links.
*   Standard markdown headers in the AI summary are transformed into custom, glowing numbered badges (`.section-number-badge`), making the summary highly scannable and beautiful.

### 4. Bilingual Support (EN/RU Localization Toggle)
*   A language toggle in the header dynamically translates all static labels, tooltips, security badges, and active chat states on the fly.
*   The backend dynamically computes indicator statuses in the selected language (Russian or English).
*   Switching languages automatically resets the active chat session history to prevent mixed-language dialogues and prompt instruction dilution.

### 5. Resizable Educational Chat Panel
*   An interactive drag handle (`.resize-handle`) allows users to freely adjust the chat width. It highlights with a glowing blue effect when dragged or hovered, providing a premium desktop-like interface.

### 6. Interactive Chat Search
*   A search bar located above the message log allows users to type queries and dynamically filter and highlight matching chat cards in real time, fading out non-matching messages.

---

## 📈 Advanced Features

To elevate this project into a robust educational tool, we implemented several advanced components:

### 1. Visual Strategy Backtester (Chart.js)
*   **Backtest Strategies**: Users can select one of three strategy models under the chart: **SMA Crossover** (SMA-12/50), **RSI Bound** (buying at <30, selling at >70), or **Bollinger Bands** (buying at lower band, selling at upper band).
*   **Historical Simulation**: The `POST /api/backtest` endpoint simulates trades on daily klines over the past 250 days utilizing pandas. It computes **Net Profit %**, **Win Rate %**, **Total Trades**, and **Max Drawdown %**.
*   **Chart.js Equity Curve Graph**: Replaced the static HTML columns with an interactive neon line graph plotting historical capital balance progression over time. The graph line and tooltip are dynamically colored green for final profit or rose for loss.

### 2. Pine Script v5 Generator & Editor
*   **LLM Scripting Sandbox**: Added a new tab inside the main card containing a strategy prompt textarea and template selector buttons (EMA Cross, RSI Divergence, MACD Histogram).
*   **Gemini Generator Code block**: The LLM compiles TradingView-ready Pine Script v5 code on the fly. Code is rendered cleanly inside a dedicated visual editor box with a one-click copy button.

### 3. Real-Time Price & Indicator Alerts
*   **Rules Configuration**: Logged-in users can open a dropdown modal from a glowing bell icon in the header and set rules (e.g. BTC price > 60000 or RSI < 30).
*   **Notification Engine**: Active alerts are verified asynchronously on every dashboard data refresh. Triggered conditions trigger synthesizer sound prompts and slide-up notifications.

### 4. Quiz Achievements & Badges Shelf
*   **Gamified TA Badges**: An SQLite `badges` table saves user rewards. Reaching a perfect TA quiz score (10+ points) unlocks the **Quiz Master** (Квиз-Мастер) badge (displayed as a graduate cap icon `🎓` in the user profile shelf).

### 5. Candlestick Pattern Scanner
*   Programmatically detects classic candlestick formations (such as **Doji**, **Hammer**, **Shooting Star**, and **Bullish/Bearish Engulfing**) on daily Binance charts.
*   Detected active patterns are integrated into the technical indicators list and passed to the coordinator agent to improve analysis context.

### 6. Educational TA Quiz Database (12 Questions)
*   A dedicated **Technical Analysis Quiz** card located in the left sidebar (swapped positions with the API key vault for better visibility).
*   Expanded pool of **12 comprehensive technical analysis questions** in both English and Russian, covering candle patterns, EMA vs SMA speed differences, H&S necklines, RSI divergences, and more.
*   Provides automated grading, visual choices feedback (green for correct, red for incorrect), detailed educational explanations, and database-backed level progression (*Novice*, *Advanced*, *Pro*).
*   **Click-to-Query Questions**: The quiz question text is clickable. Clicking it inserts the question into the chatbot and queries the AI agent, causing the advisor to explain the concepts in the chat.

### 7. Dynamic Indicator of the Day Hint Chip
*   Replaced the static RSI/MACD setup chip with a dynamic **Indicator of the Day** prompt chip: `Изучить индикатор дня: {Name}` / `Study indicator of the day: {Name}`.
*   Pulls from a curated database of **12 popular indicators** (RSI, MACD, Bollinger Bands, Stochastic, EMA, Ichimoku, Fibonacci, VWAP, ATR, ADX, Parabolic SAR, Supertrend).
*   **Smart History Filtering**: Scans the active chat history (`chatHistories[currentCoin]`) to detect if an indicator has already been discussed in this session. If it has, the chip automatically cycles and recommends the next un-discussed indicator.
*   **Reactive Update**: The chip list refreshes immediately when sending or receiving messages, keeping the suggested indicators relevant.

### 8. Advanced Text-to-Speech (TTS) with CORS Proxy
*   **Google Translate Neural TTS**: Assistant messages feature an interactive `🔊 Прослушать` / `🔊 Listen` pill button positioned cleanly under the message body. It routes text to our server-side `/api/tts` proxy, retrieving high-quality neural voice recordings from Google Translate and bypassing CORS restrictions.
*   **Sentence-based Queued Stream**: Automatically chunks text into lengths under 160 characters and plays segments sequentially using HTML5 `Audio()` players, ensuring a smooth, uninterrupted reading flow.
*   **Phonetic Russian Localization**: Financial terms and English tickers (like *RSI*, *MACD*, *SMA*, *Death Cross*, *oversold*, *BTC*, *ETH*) are programmatically translated into Russian phonetic sounds (e.g. *«эр эс и»*, *«мак ди»*, *«скользящая средняя»*, *«биткоин»*, *«перепроданность»*) before speech synthesis, eliminating robotic accents.
*   **Browser-Native Fallback**: Keeps a native `window.speechSynthesis` queue fallback if the server proxy is offline or blocked by browser autoplay constraints.

---

## 🛡️ Architecture & Course Security Concepts (STRIDE)

This project strictly adheres to AI security and safety concepts covered in the Kaggle Agent course:

### 1. Safety and Guardrails (Prompt Shield & Domain Confinement)
*   **Prompt Shield (Injection Protection)**: A robust validator node intercepts all messages, checking for prompt overrides, jailbreaks, and dangerous system commands (e.g., `ignore previous rules`, `sudo`, `rm -rf`). Malicious requests are blocked at the FastAPI gateway.
*   **Domain Confinement**: The system instructions restrict the model to discussing the actively selected coin (e.g., Bitcoin in a BTC chat). If the user asks about other coins, the agent refuses and requests them to use the left dropdown selector.
*   **Session Isolation**: Chat histories are stored and cached independently for each coin in the SQLite database or `LocalStorage`. This prevents history pollution and keeps the LLM aligned with the active coin's context.
*   **Financial Guardrails**: The system instructions explicitly forbid the AI from providing direct financial, buying, or selling signals. The agent acts exclusively as an educational mentor.

### 2. Tool Integration (RAG)
The backend leverages custom Python tools to query APIs and feed structured context directly to the LLM:
*   `fetch_coin_data`: Retrieves prices, volumes, and 24h highs/lows.
*   `fetch_crypto_news`: Aggregates the latest news feed for the selected asset.
*   `calculate_technical_indicators`: Computes indicators locally to avoid hallucinations.

### 3. Caching Layer Optimization
*   **Rate-Limit Protection**: Added an asynchronous cache with a 60-second TTL (Time-To-Live) for market data and a 5-minute TTL for news. This ensures fast load times and prevents the application from being rate-limited by public APIs.

### 4. Database Isolation for Automated Tests
*   **Test Database redirection**: Supported setting `DATABASE_URL` as an environment variable in `app/db.py`.
*   **Conftest Configuration**: Created `tests/conftest.py` that configures `DATABASE_URL = "test_crypto_advisor.db"` during testing. This keeps development and test data isolated and prevents test runs from wiping live user configurations, sessions, and histories in `crypto_advisor.db`.

### 5. Credential Leak Prevention
*   **Git Secret Hook**: Integrates a local Git `pre-commit` hook that runs `git_secret_scanner.py`. The scanner blocks any commit containing Google API Studio keys, GCP Project IDs, or other private identifiers.
*   **Exclusions in Hooks**: Staged hooks explicitly ignore scanning the `tests/` directory to allow hardcoded mock GCP Project IDs and API keys inside unit tests.

### 6. Full-Featured User Database Persistence (SQLite)
*   **Secure Email Authentication**: Supports registration with password validation (minimum 6 characters) and a 6-digit confirmation code verification flow (sent to console log; supporting `"777777"` backdoor for demo convenience).
*   **Google Sign-In Authentication**: Integrated Google Identity Services to allow secure user sign-in via Google accounts, automatically confirming verified Google email accounts. Includes a premium CSS-styled Google button that dynamically falls back to an interactive mock popup for quick testing in local/development environments.
*   **Bilingual Chat Isolation**: Chat history is stored in SQLite and isolated by `(user_id, coin_id, lang)`, preventing English and Russian conversations from polluting each other.
*   **Quiz Progress Sync**: User quiz scores and answered question indices are stored in the database, allowing users to pause and resume their learning progress across sessions.
*   **Daily Indicators Progress**: Studied daily indicator hints are tracked in the database, ensuring their learning checkmarks persist.
*   **TradingView Layout Toolbar**: Controls above the TradingView chart allow users to dynamically switch chart intervals (`1h`, `4h`, `1D`, `1W`) and styles (`Candles`, `Line`, `Heikin Ashi`), persisting settings to the database.
*   **Saved API Keys List Switcher**: A secure multi-key switcher located under the API Key panel allows authenticated users to save multiple Gemini API keys, view masked previews, dynamically activate/switch between keys, and delete key entries.

---

## 🧪 Comprehensive Test Coverage
*   The project includes a robust test suite of **30 tests** covering user registration/auth, Google Sign-In, indicators custom config, bilingual history persistence, TA quiz score achievements, studied indicator hints, alerts triggers, Pine Script generator, and API keys vault manager. All tests pass successfully.

---

## 🛠️ How to Run the Application

### 1. Configuration
Configure a `.env` file in the root folder of the project (this file is ignored by Git):
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
FORCE_DEMO_MODE=True
GOOGLE_GENAI_USE_VERTEXAI=False
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 2. Startup
You can launch the project in two ways:
*   **Windows One-Click Launcher**: Double-click **[run_local.bat](file:///f:/AGA/crypto-advisor/run_local.bat)** in the project root. This automatically activates the environment, launches your default web browser at `http://127.0.0.1:8000`, and starts the FastAPI server.
*   **Manual UV Command**: Run the following in your terminal:
    ```bash
    uv run uvicorn app.fast_api_app:app --port 8000
    ```
    And navigate manually to **[http://127.0.0.1:8000](http://127.0.0.1:8000)**.
