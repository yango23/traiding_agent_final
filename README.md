# Crypto AI Advisor & Educational Dashboard

A premium web application designed for cryptocurrency beginners. It features a modern TradingView-integrated educational dashboard, real-time prices, indicators, fundamental news, and a highly secured AI agent built to teach trading concepts without financial risk.

---

## 🚀 What has been Implemented (Key Project Features)

This application has been developed with advanced UI design (Glassmorphic Dark/Light aesthetics) and a secured conversational AI interface. Key implemented features include:

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

---

## 🛡️ Architecture & Course Security Concepts (STRIDE)

This project strictly adheres to AI security and safety concepts covered in the Kaggle Agent course:

### 1. Safety and Guardrails (Prompt Shield & Domain Confinement)
*   **Prompt Shield (Injection Protection)**: A robust validator node intercepts all messages, checking for prompt overrides, jailbreaks, and dangerous system commands (e.g., `ignore previous rules`, `sudo`, `rm -rf`). Malicious requests are blocked at the FastAPI gateway.
*   **Domain Confinement**: The system instructions restrict the model to discussing the actively selected coin (e.g., Bitcoin in a BTC chat). If the user asks about other coins, the agent refuses and requests them to use the left dropdown selector.
*   **Session Isolation**: Chat histories are stored and cached independently for each coin in `LocalStorage`. This prevents history pollution and keeps the LLM aligned with the active coin's context.
*   **Financial Guardrails**: The system instructions explicitly forbid the AI from providing direct financial, buying, or selling signals. The agent acts exclusively as an educational mentor.

### 2. Tool Integration (RAG)
The backend leverages custom Python tools to query APIs and feed structured context directly to the LLM:
*   `fetch_coin_data`: Retrieves prices, volumes, and 24h highs/lows.
*   `fetch_crypto_news`: Aggregates the latest news feed for the selected asset.
*   `calculate_technical_indicators`: Computes indicators locally to avoid hallucinations.

### 3. Caching Layer Optimization
*   **Rate-Limit Protection**: Added an asynchronous cache with a 60-second TTL (Time-To-Live) for market data and a 5-minute TTL for news. This ensures fast load times and prevents the application from being rate-limited by public APIs.

### 4. Credential Leak Prevention
*   **Git Secret Hook**: Integrates a local Git `pre-commit` hook that runs `git_secret_scanner.py`. The scanner blocks any commit containing Google API Studio keys, GCP Project IDs, or other private identifiers.

---

## 🛠️ How to Run the Application

### 1. Configuration
Configure a `.env` file in the root folder of the project (this file is ignored by Git):
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GOOGLE_GENAI_USE_VERTEXAI=False
```

### 2. Startup
Run the application using the `uv` package manager:
```bash
uv run uvicorn app.fast_api_app:app --port 8000
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.
