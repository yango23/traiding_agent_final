@echo off
title Trading AI Advisor - Local Server
echo ===================================================
echo   Trading AI Advisor - Local Launcher
echo ===================================================
echo.
echo Starting FastAPI server...
echo Browser will open in 3 seconds after server starts.
echo.

REM Start server in background (with reload for development)
start /b "" .venv\Scripts\python -m uvicorn app.fast_api_app:app --host 127.0.0.1 --port 8000 --reload

REM Wait for server to initialize before opening browser
timeout /t 3 /nobreak >nul

REM Open browser
start http://127.0.0.1:8000

echo Server is running at http://127.0.0.1:8000
echo Press Ctrl+C in this window to stop the server.
echo.

REM Keep window open
pause
