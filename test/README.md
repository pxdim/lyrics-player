# 測試說明

## 執行測試

```bash
# 執行所有測試
npm test

# 執行特定 package 測試
cd packages/shared && npm test
cd apps/controller && npm test

# 觀看 UI 模式
npm run test:ui

# 產生覆蓋率報告
npm run test:coverage
```

## 測試檔案結構

```
test/
├── setup.ts           # 全域測試設置
├── test-utils.tsx     # 共用測試工具
└── README.md          # 本文件

apps/controller/__tests__/
└── components/
    ├── PlaylistSidebar.test.tsx
    └── AnimationSettings.test.tsx

packages/shared/__tests__/
├── index.test.ts      # 類型和工具函數測試
└── hooks/
    └── useLyricAnimation.test.ts
```

## 測試覆蓋率

目前測試覆蓋：
- `shared` package: 20 tests (types, chord utilities, hooks)
- `controller` app: 19 tests (PlaylistSidebar, AnimationSettings components)

## 環境變數

部分測試可能需要環境變數：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## CI/CD

GitHub Actions 自動執行：

```yaml
- run: npm test
```
