#!/bin/bash
# 歌詞播放器自動部署腳本

set -e

echo "🚀 歌詞播放器自動部署"
echo "===================="

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 檢查變更
echo -e "${BLUE}📋 檢查 Git 狀態...${NC}"
CHANGED=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$CHANGED" -eq "0" ]; then
    echo "沒有變更，無需部署"
    exit 0
fi

# 提交變更
echo -e "${BLUE}📝 提交變更...${NC}"
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M') auto-deploy" || echo "沒有新變更需要提交"

# 推送到 GitHub
echo -e "${BLUE}⬆️  推送到 GitHub...${NC}"
git push origin main

# 觸發 Railway 重新部署
echo -e "${BLUE}🔄 觸發 Railway 部署...${NC}"
railway up

echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "📱 Controller: https://controller-production-9d84.up.railway.app"
echo "🖥️  Display:   https://display-production-xxxx.up.railway.app"
