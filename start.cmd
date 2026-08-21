@echo off
echo Starting LoopRainOS...
echo.

REM Start backend server
echo [1/2] Starting backend server on port 8079...
start "LoopRainOS Backend" cmd /k "cd server && node index.js"

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend dev server
echo [2/2] Starting frontend dev server...
set NODE_OPTIONS=--openssl-legacy-provider
npm run serve

echo.
echo LoopRainOS started successfully!
