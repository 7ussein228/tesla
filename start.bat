@echo off
echo ========================================
echo   منصة نيوتن - Newton Platform
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] تثبيت مكتبات Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo خطأ في تثبيت مكتبات Backend
    pause
    exit /b 1
)

echo.
echo [2/5] تثبيت مكتبات Frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo خطأ في تثبيت مكتبات Frontend
    pause
    exit /b 1
)

echo.
echo [3/5] تعبئة قاعدة البيانات...
cd ..\backend
call node seed.js

echo.
echo [4/5] بناء Frontend للإنتاج...
cd ..\frontend
call npm run build

echo.
echo [5/5] تشغيل الخادم...
cd ..\backend
set NODE_ENV=production
echo.
echo ========================================
echo   المنصة جاهزة على http://localhost:5000
echo ========================================
echo.
echo   للدخول كمدير:  admin@newton.edu / 123456
echo   للدخول كمدرس: teacher@newton.edu / 123456
echo   للدخول كطالب: rawan@student.com / 123456
echo.
call node server.js
