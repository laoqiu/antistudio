#!/bin/bash

# AntiStudio 开发启动脚本
# 自动构建前端并启动 Wails 开发模式

set -e  # 遇到错误立即退出

echo "🚀 Starting AntiStudio Development..."
echo ""

# 检查是否在项目根目录
if [ ! -f "wails.json" ]; then
    echo "❌ Error: wails.json not found. Please run this script from project root."
    exit 1
fi

# 检查前端目录
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found."
    exit 1
fi

# 构建前端
echo "📦 Building frontend..."
cd frontend

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# 构建
echo "🔨 Running npm run build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend built successfully!"
echo ""

# 返回根目录
cd ..

# 启动 Wails
echo "🎯 Starting Wails dev..."
echo "   - Backend will start on a random port"
echo "   - Frontend dev server will start on http://localhost:5173"
echo "   - Application window will open automatically"
echo ""
echo "Press Ctrl+C to stop"
echo ""

wails dev
