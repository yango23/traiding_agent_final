# Crypto AI Advisor & Educational Dashboard

A premium web application designed for cryptocurrency beginners. It features an interactive dashboard with TradingView charts, real-time prices, market news, and a secure AI advisor for technical and fundamental analysis (powered by Google ADK / Gemini 2.5).

---

## 🛠️ Architecture Features & Course Concepts

This project implements key architectural patterns and security concepts for AI agents:

### 1. Safety and AI Agent Protection (Security & Guardrails)
*   **Prompt Shield (Injection Protection)**: A built-in input validator checks all user messages for jailbreaks, prompt override attempts, and dangerous system commands (such as `sudo`, `rm`, `format c:`, `ignore instructions`, etc.). Detected threats are filtered out on the backend before ever reaching the LLM.
*   **Confinement (Domain Bound)**: The AI advisor is strictly bound to the currently selected cryptocurrency (e.g., BTC or ETH). If the user tries to discuss other coins or unrelated topics, the system instructions prompt the agent to refuse and guide the user to select the appropriate coin from the left menu.
*   **Session Isolation (Separate Memory)**: Chat histories are saved independently for each cryptocurrency. This prevents context mixing when switching between assets and ensures a clean educational dialogue.
*   **Financial Guardrails**: System instructions strictly forbid the AI from providing direct buy/sell/trade recommendations. The advisor acts solely as an educational mentor, explaining market indicators and the principles of technical analysis.

### 2. Custom Skills & Tools (RAG Integration)
The application integrates real-time external data (RAG/Tool Use) to provide the AI with accurate market context:
*   **Market Data (`fetch_coin_data`)**: Dynamic gathering of current prices, 24h changes, and 24h highs/lows.
*   **News Aggregator (`fetch_crypto_news`)**: Fetches recent news feeds for the selected cryptocurrency for fundamental analysis.
*   **Technical Indicator Calculator (`calculate_technical_indicators`)**: Computes **RSI (14)**, **MACD** histograms, and **SMA-50 / SMA-200** moving average statuses. This structured context is fed directly to Gemini for highly accurate analysis.

### 3. Credential Leak Prevention
*   **Local Git Secret Scanner**: A custom commit checker (`scripts/git_secret_scanner.py`) is registered as a Git `pre-commit` hook.
*   The script automatically scans staged files (`git diff --cached`) for Google AI Studio keys (`AIzaSy...`), GCP project IDs (`project-...`), and blocks the commit if any credentials or private identifiers are detected.
*   Environment configuration files (`.env`) are safely ignored by Git via `.gitignore`.

---

## 🚀 Local Setup & Running

1. Navigate to the project directory:
   ```bash
   cd f:\AGA\crypto-advisor
   ```

2. Configure your local `.env` environment file in the root folder (this file is ignored by Git):
   ```env
   GEMINI_API_KEY=Your_Google_AI_Studio_Key
   GOOGLE_GENAI_USE_VERTEXAI=False
   ```

3. Run the local FastAPI web server using the `uv` package manager:
   ```bash
   uv run uvicorn app.fast_api_app:app --reload --port 8000
   ```

4. Open your browser and go to: [http://localhost:8000](http://localhost:8000)

---

## ☁️ Deploying to Google Cloud Run

To deploy the containerized application to Google Cloud:

1. Authenticate with gcloud CLI and set your active project:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```

2. Build the Docker image and deploy to Cloud Run with a single command:
   ```bash
   gcloud run deploy crypto-advisor \
       --source . \
       --region us-central1 \
       --allow-unauthenticated \
       --set-env-vars="GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE,GOOGLE_GENAI_USE_VERTEXAI=False"
   ```

Upon successful deployment, Cloud Run will output the public URL of your live dashboard.
