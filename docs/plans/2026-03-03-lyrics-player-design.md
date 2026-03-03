# 歌詞播放器設計文檔

**日期**: 2026-03-03
**專案**: Lyrics Player for Resolume Arena
**用途**: 活動晚宴字幕顯示系統

---

## 1. 系統概述

雙端 Web 應用，透過 Supabase Realtime 進行即時狀態同步，專為活動晚宴現場字幕顯示設計。

### 核心需求
- 控制端和顯示端分離
- 支援自訂字體上傳
- 淡入淡出完全手動控制
- AI 歌詞搜尋 + 手動輸入
- 手機/網頁遠端控制
- 可跳轉到任意一句歌詞

---

## 2. 技術架構

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   控制端        │◄───────►│   Supabase   │◄───────►│   顯示端        │
│  (Controller)   │  Realtime  PostgreSQL  Realtime │  (Display)      │
│  Railway 部署   │         │              │         │  Railway 部署   │
└─────────────────┘         │   Storage    │         └─────────────────┘
                            └──────────────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │  Gemini API  │
                            │  (歌詞搜尋)  │
                            └──────────────┘
```

### 技術棧
| 層級 | 技術選擇 |
|------|----------|
| 前端框架 | Next.js 14 (App Router) |
| UI 框架 | React + Tailwind CSS |
| 狀態管理 | Zustand (本地) + Supabase Realtime (同步) |
| 後端/BaaS | Supabase (PostgreSQL + Realtime + Storage) |
| AI 搜尋 | Gemini API |
| 部署 | Railway |

### Supabase 資料結構

```sql
-- sessions 表
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- lyrics 表
CREATE TABLE lyrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- styles 表 (存儲樣式配置)
CREATE TABLE styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- fonts 透過 Supabase Storage 存儲
-- bucket: "fonts"
```

### Realtime Channel 狀態
```
session:{sessionId}
  ├── currentIndex: number
  ├── isVisible: boolean
  ├── opacity: number (0-1)
  ├── fadeIn: boolean
  ├── fadeOut: boolean
  └── style: object
```

---

## 3. 功能清單

### 控制端 (Controller)

| 功能 | 說明 |
|------|------|
| 歌詞管理 | 新增/編輯/刪除歌詞清單、匯入 LRC 檔案 |
| AI 搜尋 | 透過 Gemini API 搜尋歌詞，自動格式化 |
| 手動輸入 | 複製貼上歌詞，自動分句 |
| 播放控制 | 上一句/下一句/跳到指定句/顯示/隱藏 |
| 淡入淡出 | 獨立按鈕控制淡入、淡出效果 |
| 字體管理 | 上傳自訂字體到 Supabase Storage |
| 樣式編輯 | 字型大小、顏色、對齊、文字特效 |
| 背景設定 | 透明/純色/漸層/圖片 |
| 🔴 緊急清空 | 一鍵清空畫面 |
| ⌨️ 快捷鍵 | 鍵盤快速操作 |
| 📋 歌詞剪貼簿 | 常用歌詞快速切換 |
| 👁️ 畫面預覽 | 控制端即時預覽 |

### 顯示端 (Display)

| 功能 | 說明 |
|------|------|
| 即時同步 | 接收 Supabase Realtime 狀態更新 |
| 大字顯示 | 針對投影/截取優化的畫面 |
| 透明背景 | 支援透明模式供 Resolume 疊加 |
| 全螢幕模式 | 獨立全螢幕顯示 |
| 載入字體 | 從 Supabase Storage 動態載入自訂字體 |
| 📱 畫面比例 | 16:9 / 9:16 / 自訂 |

---

## 4. 使用流程

### 初始設定
1. 開啟顯示端 → 生成 6 位隨機碼 (如 `ABC123`)
2. 開啟控制端 → 輸入碼連接
3. 設定字體、樣式、背景

### 活動現場
1. 載入或搜尋歌詞
2. 使用快捷鍵/按鈕控制播放
3. 需要時使用淡入淡出效果
4. 緊急情況按緊急清空

---

## 5. 檔案結構

```
lyrics-player/
├── apps/
│   ├── controller/           # 控制端 Next.js App
│   │   ├── app/
│   │   │   ├── page.tsx      # 主頁面
│   │   │   ├── session/[code]/page.tsx  # Session 頁面
│   │   │   └── api/          # API Routes
│   │   ├── components/
│   │   │   ├── LyricList.tsx
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── StyleEditor.tsx
│   │   │   └── Preview.tsx
│   │   └── lib/
│   │       └── supabase.ts
│   │
│   └── display/              # 顯示端 Next.js App
│       ├── app/
│       │   ├── page.tsx      # 連接頁面
│       │   └── display/[sessionId]/page.tsx
│       ├── components/
│       │   └── LyricDisplay.tsx
│       └── lib/
│           └── supabase.ts
│
├── packages/
│   ├── shared/               # 共享類型與工具
│   │   ├── types/
│   │   └── utils/
│   └── ui/                   # 共享 UI 組件
│
├── docs/
│   └── plans/
└── supabase/
    ├── migrations/
    └── functions/
```

---

## 6. 頁面路由設計

### 控制端路由
| 路徑 | 功能 |
|------|------|
| `/` | 首頁 - 輸入 Session 碼或創建新 Session |
| `/session/[code]` | 主要控制介面 |
| `/session/[code]/settings` | 樣式設定 |
| `/library` | 歌詞剪貼簿 |

### 顯示端路由
| 路徑 | 功能 |
|------|------|
| `/` | 首頁 - 顯示連接碼 |
| `/display/[sessionId]` | 顯示畫面 |

---

## 7. 快捷鍵設計

| 按鍵 | 功能 |
|------|------|
| `←` / `→` | 上一句 / 下一句 |
| `Space` | 顯示 / 隱藏 |
| `F` | 淡入 / 淡出 |
| `0-9` | 快速跳到第 N 句 |
| `Esc` | 緊急清空 |
| `S` | 開啟設定 |

---

## 8. 樣式配置 Schema

```typescript
interface StyleConfig {
  // 文字樣式
  fontFamily: string;
  fontSize: number;      // px
  fontWeight: number;
  color: string;         // hex
  textAlign: 'left' | 'center' | 'right';

  // 文字特效
  textShadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  textStroke: {
    enabled: boolean;
    color: string;
    width: number;
  };

  // 背景
  background: {
    type: 'transparent' | 'solid' | 'gradient' | 'image';
    value?: string;
  };

  // 動畫
  fadeDuration: number;  // ms

  // 版面
  padding: number;
  lineHeight: number;
}
```

---

## 9. 安全考量

- Session 碼僅作為識別，不包含敏感資訊
- Supabase RLS (Row Level Security) 限制存取
- 字體上傳限制：僅支援 .ttf, .otf, .woff2，最大 5MB
- Gemini API 金鑰儲存在 Supabase Secrets

---

## 10. 部署計劃

### Railway 部署
1. **controller-production** - 控制端
2. **display-production** - 顯示端

### 環境變數
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```
