@echo off
title Trading AI Advisor - Local Server
echo ===================================================
echo   Trading AI Advisor - Local Launcher
echo ===================================================
echo.
echo Starting FastAPI server...
echo Browser will open automatically in 2 seconds.
echo.
start /b "" .venv\Scripts\python -m uvicorn app.fast_api_app:app --host 127.0.0.1 --port 8000 --reload
timeout /t 2 /nobreak >nul
start http://127.0.0.1:8000
echo.
echo Server is running at http://127.0.0.1:8000
echo Press Ctrl+C to stop.
.venv\Scripts\python -m uvicorn app.fast_api_app:app --host 127.0.0.1 --port 8000
pause
