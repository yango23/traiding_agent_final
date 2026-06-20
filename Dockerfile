# ── Simple pip-based build (no uv, avoids platform-lock issues) ──────────────
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/      ./app/
COPY frontend/ ./frontend/

ENV PYTHONUNBUFFERED=1

# Cloud Run injects PORT; default 8080
EXPOSE 8080
CMD ["uvicorn", "app.fast_api_app:app", "--host", "0.0.0.0", "--port", "8080"]
