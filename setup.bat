@echo off
REM Taskie Forms - Quick Start Setup Script for Windows

echo.
echo 🚀 Taskie Forms - Quick Start Setup
echo ====================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% detected

REM Check if .env.local exists
if not exist .env.local (
    echo ⚠ .env.local not found. Copying from .env.example...
    copy .env.example .env.local >nul
    echo ✓ Created .env.local
    echo.
    echo 📝 Please update .env.local with your credentials:
    echo    - MONGODB_URI: Your MongoDB Atlas connection string
    echo    - DISCORD_CLIENT_ID: Your Discord app's client ID
    echo    - DISCORD_CLIENT_SECRET: Your Discord app's client secret
    echo    - NEXTAUTH_SECRET: A random secret (generate with: openssl rand -base64 32^)
) else (
    echo ✓ .env.local already exists
)

echo.
echo 📦 Dependencies are already installed via npm install
echo.
echo 🎉 Ready to start development!
echo.
echo Next steps:
echo   1. Update .env.local with your credentials
echo   2. Run: npm run dev
echo   3. Open: http://localhost:3000
echo.
