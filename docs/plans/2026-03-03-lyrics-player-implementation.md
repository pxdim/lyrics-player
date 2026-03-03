# 歌詞播放器實現計劃

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目標:** 建構一個用於活動晚宴的雙端歌詞播放器系統，控制端和顯示端透過 Supabase Realtime 同步，支援自訂字體、淡入淡出效果，並可透過手機遠端控制。

**架構:** Next.js Monorepo with Turborepo，控制端和顯示端為兩個獨立應用，共用共享套件。Supabase 提供即時同步、資料庫和檔案儲存。Gemini API 用於歌詞搜尋。

**技術棧:** Next.js 14, React, Tailwind CSS, Supabase (Realtime + PostgreSQL + Storage), Zustand, Gemini API

---

## 階段 1: 專案初始化與 Supabase 設置

### Task 1: 初始化 Monorepo 結構

**檔案:**
- 建立: `package.json`
- 建立: `turbo.json`
- 建立: `apps/controller/package.json`
- 建立: `apps/display/package.json`
- 建立: `packages/shared/package.json`
- 建立: `packages/ui/package.json`

**Step 1: 創建根目錄 package.json**

```json
{
  "name": "lyrics-player",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

**Step 2: 創建 turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Step 3: 創建 apps/controller/package.json**

```json
{
  "name": "controller",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "zustand": "^4.5.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "shared": "*",
    "ui": "*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0"
  }
}
```

**Step 4: 創建 apps/display/package.json**

(同 controller，name 改為 "display")

**Step 5: 創建 packages/shared/package.json**

```json
{
  "name": "shared",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**Step 6: 初始化 git 並提交**

```bash
git init
git add .
git commit -m "chore: initialize monorepo structure with turbo"
```

---

### Task 2: 建立 TypeScript 設定

**檔案:**
- 建立: `tsconfig.json`
- 建立: `apps/controller/tsconfig.json`
- 建立: `apps/display/tsconfig.json`
- 建立: `packages/shared/tsconfig.json`

**Step 1: 創建根目錄 tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./apps/controller" },
    { "path": "./apps/display" },
    { "path": "./packages/shared" },
    { "path": "./packages/ui" }
  ]
}
```

**Step 2: 創建 apps/controller/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: 創建 tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Step 4: 提交**

```bash
git add .
git commit -m "chore: add TypeScript configuration"
```

---

### Task 3: 設置 Supabase 專案

**檔案:**
- 建立: `supabase/migrations/001_initial_schema.sql`
- 建立: `supabase/config.toml`

**Step 1: 創建初始資料庫 migration**

在 `supabase/migrations/001_initial_schema.sql`:

```sql
-- Sessions 表：存儲每個活動 session
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,  -- 6 位連接碼
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lyrics 表：存儲歌詞
CREATE TABLE lyrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加索引
CREATE INDEX idx_lyrics_session ON lyrics(session_id);
CREATE INDEX idx_sessions_code ON sessions(code);

-- 啟用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE lyrics;

-- Storage buckets（需在 Supabase Dashboard 手動創建或透過 CLI）
-- fonts bucket: 存儲自訂字體檔案
```

**Step 2: 創建 Supabase CLI config**

在 `supabase/config.toml`:

```toml
[api]
enabled = true
port = 54321

[db]
port = 54322

[storage]
image_transformation_enabled = true

[auth]
site_url = "http://localhost:3000"
```

**Step 3: 提交**

```bash
git add supabase/
git commit -m "feat: add Supabase schema and configuration"
```

---

### Task 4: 建立共享類型

**檔案:**
- 建立: `packages/shared/src/types/index.ts`
- 建立: `packages/shared/src/index.ts`

**Step 1: 創建類型定義**

在 `packages/shared/src/types/index.ts`:

```typescript
// Session 類型
export interface Session {
  id: string;
  code: string;
  created_at: string;
  updated_at: string;
}

// Lyric 類型
export interface Lyric {
  id: string;
  session_id: string;
  text: string;
  order_index: number;
  notes?: string;
  created_at: string;
}

// 顯示狀態（透過 Realtime 同步）
export interface DisplayState {
  currentIndex: number | null;
  isVisible: boolean;
  opacity: number;
  isFadingIn: boolean;
  isFadingOut: boolean;
}

// 樣式配置
export interface StyleConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
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
  background: {
    type: 'transparent' | 'solid' | 'gradient' | 'image';
    value?: string;
  };
  fadeDuration: number;
  padding: number;
  lineHeight: number;
}

// 預設樣式
export const DEFAULT_STYLE: StyleConfig = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 48,
  fontWeight: 700,
  color: '#ffffff',
  textAlign: 'center',
  textShadow: {
    enabled: true,
    color: '#000000',
    blur: 8,
    offsetX: 2,
    offsetY: 2,
  },
  textStroke: {
    enabled: false,
    color: '#000000',
    width: 2,
  },
  background: {
    type: 'transparent',
  },
  fadeDuration: 500,
  padding: 40,
  lineHeight: 1.5,
};

// Realtime 事件類型
export interface RealtimePayload {
  state: DisplayState;
  style: StyleConfig;
}
```

**Step 2: 導出類型**

在 `packages/shared/src/index.ts`:

```typescript
export * from './types';
```

**Step 3: 構建 shared 套件**

```bash
cd packages/shared && npm run build
```

**Step 4: 提交**

```bash
git add packages/shared/
git commit -m "feat: add shared types"
```

---

### Task 5: 建立共享 Supabase 客戶端

**檔案:**
- 建立: `packages/shared/src/supabase/client.ts`
- 建立: `packages/shared/src/supabase/server.ts`

**Step 1: 創建客戶端 Supabase client**

在 `packages/shared/src/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
```

**Step 2: 創建輔助函數**

在 `packages/shared/src/supabase/index.ts`:

```typescript
import { SupabaseClient } from './client';

// Session 操作
export async function createSession(supabase: SupabaseClient, code: string) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ id: crypto.randomUUID(), code })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSessionByCode(supabase: SupabaseClient, code: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', code)
    .single();

  return { data, error };
}

// Lyrics 操作
export async function getLyrics(supabase: SupabaseClient, sessionId: string) {
  const { data, error } = await supabase
    .from('lyrics')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index');

  return { data, error };
}

export async function createLyrics(
  supabase: SupabaseClient,
  sessionId: string,
  lyrics: { text: string; notes?: string }[]
) {
  const lyricsWithSession = lyrics.map((lyric, index) => ({
    session_id: sessionId,
    text: lyric.text,
    order_index: index,
    notes: lyric.notes,
  }));

  const { data, error } = await supabase
    .from('lyrics')
    .insert(lyricsWithSession)
    .select();

  return { data, error };
}

export async function updateLyric(
  supabase: SupabaseClient,
  id: string,
  updates: { text?: string; notes?: string }
) {
  const { data, error } = await supabase
    .from('lyrics')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteLyric(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('lyrics').delete().eq('id', id);
  return { error };
}

// 生成 6 位隨機碼
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆的字元
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export * from './client';
```

**Step 3: 更新 shared/src/index.ts**

```typescript
export * from './types';
export * from './supabase';
```

**Step 4: 構建並提交**

```bash
cd packages/shared && npm run build
git add packages/shared/
git commit -m "feat: add Supabase client and helpers"
```

---

## 階段 2: 顯示端實現

### Task 6: 設置顯示端 Next.js 應用

**檔案:**
- 建立: `apps/display/next.config.js`
- 建立: `apps/display/tailwind.config.ts`
- 建立: `apps/display/app/globals.css`
- 建立: `apps/display/app/layout.tsx`
- 建立: `apps/display/lib/supabase.ts`

**Step 1: 創建 next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
```

**Step 2: 創建 tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

**Step 3: 創建 app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

**Step 4: 創建 app/layout.tsx**

```tsx
import './globals.css';

export const metadata = {
  title: '歌詞顯示端',
  description: '歌詞播放器顯示端',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
```

**Step 5: 提交**

```bash
git add apps/display/
git commit -m "feat: setup display app structure"
```

---

### Task 7: 實現顯示端首頁（顯示連接碼）

**檔案:**
- 建立: `apps/display/app/page.tsx`
- 建立: `apps/display/components/CodeDisplay.tsx`

**Step 1: 創建 CodeDisplay 組件**

在 `apps/display/components/CodeDisplay.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient, generateSessionCode } from 'shared';
import { useRouter } from 'next/navigation';

export function CodeDisplay() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 生成新 session
    const initSession = async () => {
      const newCode = generateSessionCode();
      setCode(newCode);

      const supabase = createSupabaseClient();
      try {
        await supabase.from('sessions').insert({
          id: crypto.randomUUID(),
          code: newCode,
        });
      } catch (error) {
        console.error('Failed to create session:', error);
      }
      setLoading(false);
    };

    initSession();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-2xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">歌詞顯示端</h1>

      <div className="bg-gray-800 rounded-2xl p-12 shadow-2xl">
        <p className="text-xl mb-4 text-gray-300">請在控制端輸入此連接碼：</p>
        <div className="text-8xl font-mono font-bold tracking-wider text-center py-8">
          {code.slice(0, 3)}-{code.slice(3)}
        </div>
      </div>

      <p className="mt-8 text-gray-400">等待連接...</p>
    </div>
  );
}
```

**Step 2: 創建 app/page.tsx**

```tsx
import { CodeDisplay } from '@/components/CodeDisplay';

export default function Home() {
  return <CodeDisplay />;
}
```

**Step 3: 提交**

```bash
git add apps/display/
git commit -m "feat: add display home page with connection code"
```

---

### Task 8: 實現顯示端歌詞顯示頁面

**檔案:**
- 建立: `apps/display/app/display/[sessionId]/page.tsx`
- 建立: `apps/display/components/LyricDisplay.tsx`

**Step 1: 創建 LyricDisplay 組件**

在 `apps/display/components/LyricDisplay.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from 'shared';
import type { DisplayState, StyleConfig, Lyric, DEFAULT_STYLE } from 'shared';

interface LyricDisplayProps {
  sessionId: string;
}

export function LyricDisplay({ sessionId }: LyricDisplayProps) {
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [state, setState] = useState<DisplayState>({
    currentIndex: null,
    isVisible: false,
    opacity: 0,
    isFadingIn: false,
    isFadingOut: false,
  });
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);

  useEffect(() => {
    const supabase = createSupabaseClient();

    // 載入歌詞
    const loadLyrics = async () => {
      const { data } = await supabase
        .from('lyrics')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index');

      if (data) setLyrics(data);
    };

    loadLyrics();

    // 訂閱 Realtime 更新
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('broadcast', { event: 'state' }, (payload) => {
        setState(payload.payload.state);
      })
      .on('broadcast', { event: 'style' }, (payload) => {
        setStyle(payload.payload.style);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // 處理淡入淡出動畫
  useEffect(() => {
    if (state.isFadingIn && state.isVisible) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, opacity: 1, isFadingIn: false }));
      }, 50);
      return () => clearTimeout(timer);
    }

    if (state.isFadingOut && !state.isVisible) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, opacity: 0, isFadingOut: false }));
      }, style.fadeDuration);
      return () => clearTimeout(timer);
    }
  }, [state.isFadingIn, state.isFadingOut, state.isVisible, style.fadeDuration]);

  // 計算當前歌詞樣式
  const containerStyle: React.CSSProperties = {
    opacity: state.isVisible ? state.opacity : 0,
    transition: `opacity ${style.fadeDuration}ms ease-in-out`,
    padding: style.padding,
    textAlign: style.textAlign,
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    color: style.color,
    lineHeight: style.lineHeight,
  };

  // 背景樣式
  let backgroundStyle: React.CSSProperties = {};
  if (style.background.type === 'solid') {
    backgroundStyle = { backgroundColor: style.background.value };
  } else if (style.background.type === 'gradient') {
    backgroundStyle = { background: style.background.value };
  } else if (style.background.type === 'image') {
    backgroundStyle = {
      backgroundImage: `url(${style.background.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  const textStyle: React.CSSProperties = {};
  if (style.textShadow.enabled) {
    textStyle.textShadow = `${style.textShadow.offsetX}px ${style.textShadow.offsetY}px ${style.textShadow.blur}px ${style.textShadow.color}`;
  }
  if (style.textStroke.enabled) {
    textStyle.WebkitTextStroke = `${style.textStroke.width}px ${style.textStroke.color}`;
  }

  const currentLyric = state.currentIndex !== null ? lyrics[state.currentIndex] : null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={backgroundStyle}
    >
      <div style={containerStyle}>
        {currentLyric && (
          <div style={textStyle}>
            {currentLyric.text}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: 創建顯示頁面**

在 `apps/display/app/display/[sessionId]/page.tsx`:

```tsx
import { LyricDisplay } from '@/components/LyricDisplay';

export default function DisplayPage({ params }: { params: { sessionId: string } }) {
  return <LyricDisplay sessionId={params.sessionId} />;
}
```

**Step 3: 提交**

```bash
git add apps/display/
git commit -m "feat: implement lyric display page with realtime sync"
```

---

## 階段 3: 控制端實現

### Task 9: 設置控制端 Next.js 應用

**檔案:**
- 建立: `apps/controller/next.config.js`
- 建立: `apps/controller/tailwind.config.ts`
- 建立: `apps/controller/app/globals.css`
- 建立: `apps/controller/app/layout.tsx`

**Step 1-4:** 類似 Task 6，創建控制端基礎結構

**Step 5: 提交**

```bash
git add apps/controller/
git commit -m "feat: setup controller app structure"
```

---

### Task 10: 實現控制端首頁

**檔案:**
- 建立: `apps/controller/app/page.tsx`
- 建立: `apps/controller/components/HomePage.tsx`

**Step 1: 創建 HomePage 組件**

在 `apps/controller/components/HomePage.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HomePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);

    // 驗證 session 是否存在
    try {
      const response = await fetch(`/api/session/validate?code=${code}`);
      if (response.ok) {
        router.push(`/session/${code}`);
      } else {
        alert('無效的連接碼');
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }

    setLoading(false);
  };

  const handleCreateNew = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/session/create', { method: 'POST' });
      if (response.ok) {
        const { code } = await response.json();
        router.push(`/session/${code}`);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          歌詞播放器控制器
        </h1>

        <form onSubmit={handleConnect} className="mb-6">
          <label className="block text-white/80 mb-2">輸入連接碼</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="例如：ABC-123"
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white text-center text-2xl tracking-wider placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
            maxLength={7}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-white text-purple-900 font-semibold rounded-lg hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? '連接中...' : '連接'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-transparent px-4 text-white/60 text-sm">或</span>
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          disabled={loading}
          className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          建立新 Session
        </button>
      </div>
    </div>
  );
}
```

**Step 2: 創建 app/page.tsx**

```tsx
import { HomePage } from '@/components/HomePage';

export default function Home() {
  return <HomePage />;
}
```

**Step 3: 提交**

```bash
git add apps/controller/
git commit -m "feat: add controller home page"
```

---

### Task 11: 實現 Session API 路由

**檔案:**
- 建立: `apps/controller/app/api/session/validate/route.ts`
- 建立: `apps/controller/app/api/session/create/route.ts`

**Step 1: 創建驗證 API**

在 `apps/controller/app/api/session/validate/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from 'shared';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Code required' }, { status: 400 });
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('code', code.replace('-', ''))
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
  }

  return NextResponse.json({ sessionId: data.id });
}
```

**Step 2: 創建建立 API**

在 `apps/controller/app/api/session/create/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { createSupabaseClient, generateSessionCode } from 'shared';

export async function POST() {
  const supabase = createSupabaseClient();
  const code = generateSessionCode();

  const { data, error } = await supabase
    .from('sessions')
    .insert({ id: crypto.randomUUID(), code })
    .select('id, code')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data.id, code: data.code });
}
```

**Step 3: 提交**

```bash
git add apps/controller/
git commit -m "feat: add session API routes"
```

---

### Task 12: 實現控制主頁面 - 歌詞列表

**檔案:**
- 建立: `apps/controller/app/session/[code]/page.tsx`
- 建立: `apps/controller/components/LyricList.tsx`
- 建立: `apps/controller/components/LyricItem.tsx`

**Step 1: 創建 LyricItem 組件**

在 `apps/controller/components/LyricItem.tsx`:

```tsx
'use client';

interface LyricItemProps {
  text: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function LyricItem({ text, index, isActive, onClick, onEdit, onDelete }: LyricItemProps) {
  return (
    <div
      className={`
        p-4 rounded-lg cursor-pointer transition-all
        ${isActive ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm opacity-60 w-8">{index + 1}</span>
        <span className="flex-1">{text}</span>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1 hover:bg-white/10 rounded"
            >
              編輯
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 hover:bg-red-500/20 text-red-400 rounded"
            >
              刪除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: 創建 LyricList 組件**

在 `apps/controller/components/LyricList.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { Lyric } from 'shared';
import { LyricItem } from './LyricItem';

interface LyricListProps {
  lyrics: Lyric[];
  currentIndex: number | null;
  onSelectLyric: (index: number) => void;
  onEditLyric?: (lyric: Lyric) => void;
  onDeleteLyric?: (id: string) => void;
}

export function LyricList({ lyrics, currentIndex, onSelectLyric, onEditLyric, onDeleteLyric }: LyricListProps) {
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {lyrics.map((lyric, index) => (
        <LyricItem
          key={lyric.id}
          text={lyric.text}
          index={index}
          isActive={currentIndex === index}
          onClick={() => onSelectLyric(index)}
          onEdit={onEditLyric ? () => onEditLyric(lyric) : undefined}
          onDelete={onDeleteLyric ? () => onDeleteLyric(lyric.id) : undefined}
        />
      ))}
      {lyrics.length === 0 && (
        <div className="text-center py-8 text-white/60">
          尚未加入歌詞，請點擊下方按鈕新增
        </div>
      )}
    </div>
  );
}
```

**Step 3: 提交**

```bash
git add apps/controller/components/
git commit -m "feat: add LyricList and LyricItem components"
```

---

### Task 13: 實現控制主頁面 - 控制面板

**檔案:**
- 建立: `apps/controller/components/ControlPanel.tsx`

**Step 1: 創建 ControlPanel 組件**

在 `apps/controller/components/ControlPanel.tsx`:

```tsx
'use client';

interface ControlPanelProps {
  currentIndex: number | null;
  totalLyrics: number;
  isVisible: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleVisible: () => void;
  onFadeIn: () => void;
  onFadeOut: () => void;
  onEmergencyClear: () => void;
}

export function ControlPanel({
  currentIndex,
  totalLyrics,
  isVisible,
  onPrevious,
  onNext,
  onToggleVisible,
  onFadeIn,
  onFadeOut,
  onEmergencyClear,
}: ControlPanelProps) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 space-y-4">
      <div className="text-center text-white/80">
        第 {currentIndex !== null ? currentIndex + 1 : '-'} / {totalLyrics || 0} 句
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onPrevious}
          disabled={currentIndex === null || currentIndex === 0}
          className="py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一句
        </button>
        <button
          onClick={onToggleVisible}
          className={`
            py-3 rounded-lg font-semibold
            ${isVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          `}
        >
          {isVisible ? '隱藏' : '顯示'}
        </button>
        <button
          onClick={onNext}
          disabled={currentIndex === null || currentIndex >= totalLyrics - 1}
          className="py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一句
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onFadeIn}
          className="py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          淡入
        </button>
        <button
          onClick={onFadeOut}
          className="py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          淡出
        </button>
        <button
          onClick={onEmergencyClear}
          className="py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
        >
          緊急清空
        </button>
      </div>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add apps/controller/components/
git commit -m "feat: add ControlPanel component"
```

---

### Task 14: 實現 Session 頁面完整整合

**檔案:**
- 建立: `apps/controller/app/session/[code]/page.tsx`

**Step 1: 創建完整 Session 頁面**

在 `apps/controller/app/session/[code]/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createSupabaseClient, generateSessionCode } from 'shared';
import type { Lyric, DisplayState, StyleConfig, DEFAULT_STYLE } from 'shared';
import { LyricList } from '@/components/LyricList';
import { ControlPanel } from '@/components/ControlPanel';

export default function SessionPage() {
  const params = useParams();
  const code = params.code as string;
  const sessionId = code.replace('-', '');

  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [state, setState] = useState<DisplayState>({
    currentIndex: null,
    isVisible: false,
    opacity: 0,
    isFadingIn: false,
    isFadingOut: false,
  });
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);

  const supabase = createSupabaseClient();

  // 載入歌詞
  useEffect(() => {
    const loadLyrics = async () => {
      const { data } = await supabase
        .from('lyrics')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index');

      if (data) setLyrics(data);
    };

    loadLyrics();

    // 訂閱歌詞變更
    const lyricsChannel = supabase
      .channel(`lyrics:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lyrics',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLyrics((prev) => [...prev, payload.new as Lyric]);
          } else if (payload.eventType === 'UPDATE') {
            setLyrics((prev) =>
              prev.map((l) => (l.id === payload.new.id ? (payload.new as Lyric) : l))
            );
          } else if (payload.eventType === 'DELETE') {
            setLyrics((prev) => prev.filter((l) => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(lyricsChannel);
    };
  }, [sessionId]);

  // 廣播狀態到顯示端
  const broadcastState = (newState: Partial<DisplayState>) => {
    const updated = { ...state, ...newState };
    setState(updated);
    supabase.channel(`session:${sessionId}`).send({
      type: 'broadcast',
      event: 'state',
      payload: { state: updated },
    });
  };

  // 廣播樣式到顯示端
  const broadcastStyle = (newStyle: Partial<StyleConfig>) => {
    const updated = { ...style, ...newStyle };
    setStyle(updated);
    supabase.channel(`session:${sessionId}`).send({
      type: 'broadcast',
      event: 'style',
      payload: { style: updated },
    });
  };

  // 控制函數
  const handlePrevious = () => {
    if (state.currentIndex !== null && state.currentIndex > 0) {
      broadcastState({
        currentIndex: state.currentIndex - 1,
        isVisible: true,
        opacity: 1,
      });
    } else if (lyrics.length > 0) {
      broadcastState({ currentIndex: 0, isVisible: true, opacity: 1 });
    }
  };

  const handleNext = () => {
    if (state.currentIndex !== null && state.currentIndex < lyrics.length - 1) {
      broadcastState({
        currentIndex: state.currentIndex + 1,
        isVisible: true,
        opacity: 1,
      });
    } else if (lyrics.length > 0) {
      broadcastState({ currentIndex: 0, isVisible: true, opacity: 1 });
    }
  };

  const handleToggleVisible = () => {
    broadcastState({
      isVisible: !state.isVisible,
      opacity: !state.isVisible ? 1 : 0,
    });
  };

  const handleFadeIn = () => {
    broadcastState({
      isVisible: true,
      isFadingIn: true,
      isFadingOut: false,
    });
  };

  const handleFadeOut = () => {
    broadcastState({
      isFadingOut: true,
      isFadingIn: false,
    });
  };

  const handleEmergencyClear = () => {
    broadcastState({
      isVisible: false,
      opacity: 0,
      isFadingIn: false,
      isFadingOut: false,
    });
  };

  const handleSelectLyric = (index: number) => {
    broadcastState({ currentIndex: index, isVisible: true, opacity: 1 });
  };

  // 新增歌詞
  const handleAddLyric = async () => {
    const text = prompt('輸入歌詞：');
    if (!text) return;

    await supabase.from('lyrics').insert({
      session_id: sessionId,
      text,
      order_index: lyrics.length,
    });
  };

  // 批量匯入歌詞
  const handleImportLyrics = async () => {
    const input = prompt('請貼上歌詞（每行一句）：');
    if (!input) return;

    const lines = input.split('\n').filter((line) => line.trim());
    for (const line of lines) {
      await supabase.from('lyrics').insert({
        session_id: sessionId,
        text: line.trim(),
        order_index: lyrics.length,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            控制面板
            <span className="ml-4 text-purple-300">{code}</span>
          </h1>
        </div>

        {/* 控制面板 */}
        <ControlPanel
          currentIndex={state.currentIndex}
          totalLyrics={lyrics.length}
          isVisible={state.isVisible}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToggleVisible={handleToggleVisible}
          onFadeIn={handleFadeIn}
          onFadeOut={handleFadeOut}
          onEmergencyClear={handleEmergencyClear}
        />

        {/* 歌詞列表 */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">歌詞列表</h2>
            <div className="flex gap-2">
              <button
                onClick={handleAddLyric}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + 新增
              </button>
              <button
                onClick={handleImportLyrics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                匯入
              </button>
            </div>
          </div>
          <LyricList
            lyrics={lyrics}
            currentIndex={state.currentIndex}
            onSelectLyric={handleSelectLyric}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add apps/controller/
git commit -m "feat: implement complete session controller page"
```

---

## 階段 4: 進階功能

### Task 15: 實現 Gemini API 歌詞搜尋

**檔案:**
- 建立: `apps/controller/app/api/lyrics/search/route.ts`
- 修改: `apps/controller/app/session/[code]/page.tsx`

**Step 1: 創建歌詞搜尋 API**

在 `apps/controller/app/api/lyrics/search/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  const { songName, artist } = await request.json();

  if (!songName) {
    return NextResponse.json({ error: 'Song name required' }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `請搜尋歌曲「${songName}${artist ? ' - ' + artist : ''}」的歌詞。

請以以下 JSON 格式回應：
{
  "lyrics": ["第一句歌詞", "第二句歌詞", ...],
  "title": "歌曲名稱",
  "artist": "歌手名稱"
}

只回傳 JSON，不要有其他文字。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 解析 JSON（可能包含 markdown 代碼塊）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: '搜尋失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
```

**Step 2: 在控制頁面添加搜尋功能**

修改 `apps/controller/app/session/[code]/page.tsx`，添加搜尋處理函數：

```tsx
// 在組件內添加
const handleSearchLyrics = async () => {
  const songName = prompt('請輸入歌曲名稱：');
  if (!songName) return;

  const artist = prompt('請輸入歌手（選填）：');

  try {
    const response = await fetch('/api/lyrics/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songName, artist }),
    });

    if (response.ok) {
      const { lyrics } = await response.json();

      // 清除舊歌詞並匯入新的
      await supabase.from('lyrics').delete().eq('session_id', sessionId);
      for (const line of lyrics) {
        await supabase.from('lyrics').insert({
          session_id: sessionId,
          text: line,
          order_index: lyrics.indexOf(line),
        });
      }

      alert(`已匯入 ${lyrics.length} 句歌詞`);
    }
  } catch (error) {
    console.error('Search failed:', error);
    alert('搜尋失敗');
  }
};
```

**Step 3: 在 UI 添加搜尋按鈕**

在歌詞列表標題旁添加：

```tsx
<button
  onClick={handleSearchLyrics}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
>
  AI 搜尋
</button>
```

**Step 4: 提交**

```bash
git add apps/controller/
git commit -m "feat: add Gemini API lyrics search"
```

---

### Task 16: 實現字體上傳功能

**檔案:**
- 建立: `apps/controller/app/api/fonts/upload/route.ts`
- 建立: `apps/controller/components/FontManager.tsx`

**Step 1: 創建字體上傳 API**

在 `apps/controller/app/api/fonts/upload/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from 'shared';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // 驗證檔案類型
  const allowedTypes = ['font/ttf', 'font/otf', 'font/woff2', 'font/woff'];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(ttf|otf|woff2?)/i)) {
    return NextResponse.json({ error: 'Invalid font file' }, { status: 400 });
  }

  // 驗證檔案大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  const supabase = createSupabaseClient();
  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('fonts')
    .upload(fileName, file);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 獲取公開 URL
  const { data: { publicUrl } } = supabase.storage
    .from('fonts')
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl, name: file.name });
}

export async function GET() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.storage.from('fonts').list();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fonts = data.map((file) => {
    const { data: { publicUrl } } = supabase.storage
      .from('fonts')
      .getPublicUrl(file.name);
    return {
      name: file.name.replace(/^\d+-/, ''),
      url: publicUrl,
    };
  });

  return NextResponse.json({ fonts });
}
```

**Step 2: 創建 FontManager 組件**

在 `apps/controller/components/FontManager.tsx`:

```tsx
'use client';

import { useState, useRef } from 'react';

interface FontManagerProps {
  currentFont: string;
  onFontChange: (fontUrl: string, fontName: string) => void;
}

export function FontManager({ currentFont, onFontChange }: FontManagerProps) {
  const [fonts, setFonts] = useState<Array<{ name: string; url: string }>>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFonts = async () => {
    const response = await fetch('/api/fonts/upload');
    if (response.ok) {
      const { fonts } = await response.json();
      setFonts(fonts);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/fonts/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const { url, name } = await response.json();
      onFontChange(url, name);
      await loadFonts();
    }

    setLoading(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">字體管理</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleUpload}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? '上傳中...' : '上傳字體'}
      </button>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {fonts.map((font) => (
          <button
            key={font.url}
            onClick={() => onFontChange(font.url, font.name)}
            className={`
              w-full p-2 text-left rounded-lg transition-colors
              ${currentFont === font.url ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}
            `}
          >
            {font.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: 提交**

```bash
git add apps/controller/
git commit -m "feat: add font upload and management"
```

---

### Task 17: 實現快捷鍵支援

**檔案:**
- 建立: `packages/shared/src/hooks/useKeyboardShortcuts.ts`
- 修改: `apps/controller/app/session/[code]/page.tsx`

**Step 1: 創建快捷鍵 Hook**

在 `packages/shared/src/hooks/useKeyboardShortcuts.ts`:

```ts
import { useEffect } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在輸入框中的按鍵
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // 檢查數字鍵 (0-9)
      if (/^\d$/.test(key)) {
        const numKey = `digit${key}` as keyof typeof shortcuts;
        if (shortcuts[numKey]) {
          e.preventDefault();
          shortcuts[numKey]();
          return;
        }
      }

      // 檢查其他按鍵
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}
```

**Step 2: 在控制頁面使用快捷鍵**

在 `apps/controller/app/session/[code]/page.tsx` 添加：

```tsx
import { useKeyboardShortcuts } from 'shared';

// 在組件內添加
useKeyboardShortcuts({
  arrowleft: handlePrevious,
  arrowright: handleNext,
  ' ': handleToggleVisible,
  f: () => state.isVisible ? handleFadeOut() : handleFadeIn(),
  escape: handleEmergencyClear,
  digit1: () => lyrics[0] && handleSelectLyric(0),
  digit2: () => lyrics[1] && handleSelectLyric(1),
  digit3: () => lyrics[2] && handleSelectLyric(2),
  digit4: () => lyrics[3] && handleSelectLyric(3),
  digit5: () => lyrics[4] && handleSelectLyric(4),
  digit6: () => lyrics[5] && handleSelectLyric(5),
  digit7: () => lyrics[6] && handleSelectLyric(6),
  digit8: () => lyrics[7] && handleSelectLyric(7),
  digit9: () => lyrics[8] && handleSelectLyric(8),
});
```

**Step 3: 提交**

```bash
git add packages/shared/ apps/controller/
git commit -m "feat: add keyboard shortcuts support"
```

---

## 階段 5: 測試與部署準備

### Task 18: 設置環境變數

**檔案:**
- 建立: `.env.local.example`
- 建立: `apps/controller/.env.local.example`
- 建立: `apps/display/.env.local.example`

**Step 1: 創建環境變數範例**

在根目錄 `.env.local.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

**Step 2: 提交**

```bash
git add .env.local.example
git commit -m "chore: add environment variables template"
```

---

### Task 19: 添加 README

**檔案:**
- 建立: `README.md`

**Step 1: 創建 README**

```markdown
# 歌詞播放器

用於活動晚宴的雙端歌詞播放器系統，透過 Supabase Realtime 即時同步。

## 功能特色

- 📱 雙端分離設計：控制端 + 顯示端
- 🎨 支援自訂字體上傳
- ✨ 淡入淡出效果手動控制
- 🤖 AI 歌詞搜尋 (Gemini API)
- ⌨️ 完整快捷鍵支援
- 🚨 緊急清空功能

## 技術棧

- Next.js 14
- Supabase (PostgreSQL + Realtime + Storage)
- Tailwind CSS
- Gemini API

## 本地開發

\`\`\`bash
# 安裝依賴
npm install

# 設置環境變數
cp .env.local.example .env.local
# 編輯 .env.local 填入 Supabase 和 Gemini API 金鑰

# 啟動開發伺服器
npm run dev
\`\`\`

訪問：
- 控制端: http://localhost:3001
- 顯示端: http://localhost:3000

## 部署到 Railway

\`\`\`bash
# 連結 Railway 專案
railway link

# 部署
railway up
\`\`\`

## 快捷鍵

| 按鍵 | 功能 |
|------|------|
| ← / → | 上一句 / 下一句 |
| Space | 顯示 / 隱藏 |
| F | 淡入 / 淡出 |
| 0-9 | 跳到指定句數 |
| Esc | 緊急清空 |
\`\`\`

**Step 2: 提交**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

---

### Task 20: 構建測試

**Step 1: 測試構建**

```bash
npm run build
```

**Step 2: 驗證兩個應用都能正確構建**

```bash
ls apps/controller/.next
ls apps/display/.next
```

**Step 3: 提交**

```bash
git add -A
git commit -m "chore: verify build passes for all apps"
```

---

## 完成檢查清單

- [ ] Monorepo 結構設置完成
- [ ] Supabase 資料庫 schema 建立
- [ ] 共享類型和工具完成
- [ ] 顯示端首頁（連接碼）完成
- [ ] 顯示端歌詞頁面完成
- [ ] 控制端首頁完成
- [ ] 控制端 Session 頁面完成
- [ ] 控制面板功能完成
- [ ] 歌詞管理功能完成
- [ ] Gemini API 搜尋完成
- [ ] 字體上傳功能完成
- [ ] 快捷鍵支援完成
- [ ] 環境變數設置完成
- [ ] README 文檔完成
- [ ] 構建測試通過

---

## 後續可擴展功能

1. 歌詞剪貼簿功能
2. 樣式主題預設
3. 控制端預覽功能
4. 畫面比例切換
5. 歌詞備註欄位
6. LRC 檔案匯入
7. 自動儲存功能
