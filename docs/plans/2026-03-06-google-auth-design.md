# Supabase Auth 設計規劃

**日期**: 2026-03-06
**狀態**: 設計階段

## 概述

使用 **Supabase 內建的 Google Auth**，讓用戶可以：
1. 儲存跨設備同步的個人歌單
2. 收藏最愛歌曲以便快速搜尋
3. 保存個人設定（主題、動畫偏好等）

## 為什麼用 Supabase Auth？

| 優點 | 說明 |
|------|------|
| **無需後端** | Supabase 處理所有 OAuth 流程 |
| **內建用戶表** | `auth.users` 自動管理 |
| **RLS 安全** | Row Level Security 保護用戶資料 |
| **簡單整合** | 只需幾行代碼完成登入 |
| **免費方案** | 每月 50000 MAU 免費 |

---

## Supabase 設置

### 1. Dashboard 設置

1. 登入 Supabase Dashboard
2. 選擇你的專案
3. 进入 **Authentication > Providers**
4. 啟用 **Google** provider
5. 設置：
   - Client ID: 從 Google Cloud Console 獲取
   - Client Secret: 從 Google Cloud Console 獲取
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 2. Google Cloud Console

1. 創建 OAuth 2.0 憑證
2. 授權重定向 URI: Supabase 提供的 callback URL
3. 複製 Client ID 和 Secret 到 Supabase

---

## 資料庫設計

### Supabase 自動管理 `auth.users`

不需要創建用戶表！Supabase Auth 自動處理。

我們只需要創建**關聯資料表**：

```sql
-- 用戶的個人資料（額外資料）
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用戶的歌單
CREATE TABLE public.user_playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 歌單歌曲關聯
CREATE TABLE public.user_playlist_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES public.user_playlists(id) ON DELETE CASCADE NOT NULL,
  song_name TEXT NOT NULL,
  artist TEXT,
  lyrics JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 收藏歌曲
CREATE TABLE public.favorite_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  song_name TEXT NOT NULL,
  artist TEXT,
  lyrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用戶設定
CREATE TABLE public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme_id TEXT DEFAULT 'worship-warm',
  animation_config JSONB DEFAULT '{"enabled":true,"type":"crossfade","duration":400,"easing":"ease-in-out"}',
  display_mode TEXT DEFAULT 'stage',
  show_chords BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS 規則：用戶只能讀寫自己的資料
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can crud own playlists" ON public.user_playlists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can crud own favorites" ON public.favorite_songs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can crud own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- 自動創建 profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 前端實作

### 1. 安裝 Supabase JS

```bash
npm install @supabase/supabase-js
```

### 2. 創建 Auth Context

```typescript
// contexts/AuthContext.tsx
import { createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 檢查現有 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 監聽 auth 變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 3. 登入 Modal

```typescript
// components/AuthModal.tsx
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, X, BookOpen, Star, Settings } from 'lucide-react';

export function AuthModal({ isOpen, onClose, feature }: Props) {
  const { signIn } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md">
        <button onClick={onClose}><X /></button>

        <h2 className="text-xl font-bold mb-4">登入以使用此功能</h2>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-300">
            <BookOpen size={18} />
            <span>儲存跨設備歌單</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <Star size={18} />
            <span>收藏最愛歌曲</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <Settings size={18} />
            <span>同步個人設定</span>
          </div>
        </div>

        <button
          onClick={signIn}
          className="w-full py-3 bg-white text-black rounded-lg font-medium flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.282-1.584-4.966-3.715H.957v2.259A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M4.034 9.315a5.41 5.41 0 0 1 0-3.63V3.535H.957a8.997 8.997 0 0 0 0 6.93h3.077z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 3.535l3.077 2.259c.684-2.131 2.622-3.714 4.966-3.714z" fill="#EA4335"/>
          </svg>
          使用 Google 登入
        </button>

        <button onClick={onClose} className="w-full py-3 text-gray-400">
          稍後再說
        </button>
      </div>
    </div>
  );
}
```

### 4. 使用方式

```typescript
// 任何需要登入的功能
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';

function MyComponent() {
  const { user, signIn } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleAddToFavorites = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    // 執行收藏邏輯...
  };

  return (
    <>
      <button onClick={handleAddToFavorites}>收藏</button>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
```

---

## 實作步驟

### Phase 1: Supabase Auth 設置
- [ ] 在 Supabase Dashboard 啟用 Google Auth
- [ ] 創建 AuthContext
- [ ] 創建 AuthModal 組件
- [ ] 添加登入/登出按鈕

### Phase 2: 資料庫與 RLS
- [ ] 執行 migration SQL
- [ ] 設置 RLS policies
- [ ] 創建 trigger 自動生成 profile

### Phase 3: 功能整合
- [ ] AI 搜歌添加收藏按鈕
- [ ] 歌單保存到用戶歌單
- [ ] 設定同步功能

### Phase 4: UI 完善
- [ ] 用戶資料面板
- [ ] 我的歌單頁面
- [ ] 收藏列表頁面

---

## 環境變量

```env
# Supabase (已經存在)
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Google OAuth (在 Supabase Dashboard 設置，不需要這裡)
```

---

## 優勢總結

使用 Supabase Auth vs 自行實作：

| 項目 | Supabase Auth | 自行實作 |
|------|----------------|----------|
| 設置時間 | 5 分鐘 | 2-3 小時 |
| 用戶表 | 自動管理 | 需創建 |
| OAuth 流程 | 處理完成 | 需實作 |
| Session 管理 | 處理完成 | 需實作 |
| 安全性 | 專業級 | 需自己保證 |
| RLS | 內建 | 需自己實作 |
| 成本 | 免費 50K MAU | Google API 可能需要付費 |
