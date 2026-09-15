@echo off
echo ========================================
echo   Newton Platform - Development Mode
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Installing Backend dependencies...
cd backend
call npm install 2>nul

echo.
echo [2/4] Installing Frontend dependencies...
cd ..\frontend
call npm install 2>nul

echo.
echo [3/4] Seeding database...
cd ..\backend
call node seed.js

echo.
echo [4/4] Starting servers...
echo.
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ========================================
echo.

REM Start backend in background
start "Newton Backend" cmd /k "cd /d %~dp0backend && node server.js"

REM Start frontend
cd ..\frontend
call npm run dev
