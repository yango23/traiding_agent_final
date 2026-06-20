# Build stage: Install dependencies using uv
FROM python:3.12-slim AS builder

WORKDIR /build

# Install uv package manager
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -LsSf https://astral.sh/uv/install.sh | sh && \
    apt-get purge -y --auto-remove curl && \
    rm -rf /var/lib/apt/lists/*

ENV PATH="/root/.local/bin:${PATH}"

# Copy dependency specifications
COPY pyproject.toml .

# Install dependencies into a virtual environment
RUN uv venv && uv pip install .

# Final stage: Create the clean production image
FROM python:3.12-slim

WORKDIR /app

# Copy virtual environment and project files from builder
COPY --from=builder /build/.venv /app/.venv
COPY app/ /app/app/
COPY frontend/ /app/frontend/
COPY .env* /app/

# Set environment path to use installed dependencies
ENV PATH="/app/.venv/bin:${PATH}"
ENV PYTHONUNBUFFERED=1

# Expose port (Cloud Run defaults to 8080, but can be overridden)
EXPOSE 8080

# Command to run uvicorn
CMD ["uvicorn", "app.fast_api_app:app", "--host", "0.0.0.0", "--port", "8080"]
