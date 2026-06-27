@echo off
title Crypto AI Advisor Launcher
echo ===================================================
echo   Crypto AI Advisor - Local Launcher
echo ===================================================
echo.
echo 1. Launching default browser at http://127.0.0.1:8000...
start http://127.0.0.1:8000
echo.
echo 2. Starting FastAPI server...
.venv\Scripts\python -m app.fast_api_app
echo.
echo Server stopped.
pause
