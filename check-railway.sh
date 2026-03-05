#!/bin/bash
# Railway 設置驗證腳本

echo "🔍 檢查 Railway 部署狀態..."
echo ""

# 檢查 Railway 連接
railway whoami > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Railway CLI 已登入"
else
    echo "❌ 請先登入 Railway: railway login"
    exit 1
fi

# 檢查 GitHub 連接
echo ""
echo "📌 GitHub 狀態:"
git remote get-url origin 2>/dev/null || echo "❌ 沒有 GitHub remote"

# 檢查服務
echo ""
echo "🚀 Railway 服務狀態:"
railway status 2>&1 | head -5

echo ""
echo "📋 下一步操作:"
echo "1. 打開以下連結添加服務:"
echo "   https://railway.com/project/f3497a33-73e6-4a4b-bf8a-160ecf113384/new"
echo ""
echo "2. 選擇 \"Deploy from GitHub repo\""
echo "3. 選擇 pxdim/lyrics-player"
echo "4. 創建兩個服務:"
echo "   - Name: controller, Dockerfile: Dockerfile.controller"
echo "   - Name: display, Dockerfile: Dockerfile.display"
echo ""
echo "5. 添加環境變量 (從 .env.railway.backup 複製):"
cat .env.railway.backup | grep NEXT_PUBLIC
