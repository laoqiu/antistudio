@echo off
REM AntiStudio 开发启动脚本 (Windows)

echo 🚀 Starting AntiStudio Development...
echo.

REM 检查是否在项目根目录
if not exist "wails.json" (
    echo ❌ Error: wails.json not found. Please run this script from project root.
    exit /b 1
)

REM 检查前端目录
if not exist "frontend" (
    echo ❌ Error: frontend directory not found.
    exit /b 1
)

REM 构建前端
echo 📦 Building frontend...
cd frontend

REM 安装依赖（如果需要）
if not exist "node_modules" (
    echo 📥 Installing dependencies...
    call npm install
)

REM 构建
echo 🔨 Running npm run build...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend build failed!
    exit /b 1
)

echo ✅ Frontend built successfully!
echo.

REM 返回根目录
cd ..

REM 启动 Wails
echo 🎯 Starting Wails dev...
echo    - Backend will start on a random port
echo    - Frontend dev server will start on http://localhost:5173
echo    - Application window will open automatically
echo.
echo Press Ctrl+C to stop
echo.

wails dev
