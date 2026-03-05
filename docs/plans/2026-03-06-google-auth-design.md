# Google Auth 設計規劃

**日期**: 2026-03-06
**狀態**: 設計階段

## 概述

整合 Google OAuth 2.0 登入，讓用戶可以：
1. 儲存跨設備同步的個人歌單
2. 收藏最愛歌曲以便快速搜尋
3. 保存個人設定（主題、動畫偏好等）

## 登入時機

- **延遲登入**：用戶可以在不登入的情況下使用基本功能
- **功能觸發**：當用戶嘗試使用需要儲存的功能時，提示登入
  - 點擊「加入我的歌單」
  - 點擊「收藏」按鈕
  - 嘗試同步設定到其他設備

## 資料庫設計

### 新增資料表

```sql
-- 用戶資料表
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用戶的歌單
CREATE TABLE user_playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 歌單歌曲關聯
CREATE TABLE user_playlist_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES user_playlists(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  artist TEXT,
  lyrics JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 收藏歌曲
CREATE TABLE favorite_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  artist TEXT,
  lyrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用戶設定
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme_id TEXT DEFAULT 'worship-warm',
  animation_config JSONB DEFAULT '{"enabled":true,"type":"crossfade","duration":400,"easing":"ease-in-out"}',
  display_mode TEXT DEFAULT 'stage',
  show_chords BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_google ON users(google_id);
CREATE INDEX idx_user_playlists_user ON user_playlists(user_id);
CREATE INDEX idx_favorite_songs_user ON favorite_songs(user_id);
```

## API 設計

### 認證相關

```
POST /api/auth/login
  - 處理 Google OAuth 回調
  - 創建或更新用戶記錄
  - 返回 JWT token

GET /api/auth/me
  - 獲取當前登入用戶資訊

POST /api/auth/logout
  - 清除 session
```

### 用戶歌單

```
GET  /api/user/playlists
  - 獲取用戶所有歌單

POST /api/user/playlists
  - 創建新歌單

PUT  /api/user/playlists/:id
  - 更新歌單

DELETE /api/user/playlists/:id
  - 刪除歌單

POST /api/user/playlists/:id/songs
  - 添加歌曲到歌單
```

### 收藏歌曲

```
GET    /api/user/favorites
  - 獲取收藏列表

POST   /api/user/favorites
  - 添加收藏

DELETE /api/user/favorites/:id
  - 取消收藏
```

### 用戶設定

```
GET /api/user/settings
  - 獲取用戶設定

PUT /api/user/settings
  - 更新用戶設定
```

## UI/UX 設計

### 登入提示 Modal

```
┌─────────────────────────────────┐
│   🔐 登入以使用此功能           │
│                                 │
│   登入後您可以：                 │
│   • 儲存跨設備歌單               │
│   • 收藏最愛歌曲                 │
│   • 同步個人設定                 │
│                                 │
│   [   使用 Google 登入    ]     │
│                                 │
│   稍後再說                       │
└─────────────────────────────────┘
```

### 用戶資料面板（新增）

```
┌─────────────────────────────────┐
│ 👤 用戶名稱          [登出]    │
├─────────────────────────────────┤
│ 📚 我的歌單                     │
│   • 敬拜歌單 (12首)              │
│   • 聖誕專輯 (8首)    [+新增]   │
├─────────────────────────────────┤
│ ⭐ 收藏歌曲                     │
│   • 小情歌 - 蘇打綠             │
│   • 奇異恩典 - CDC              │
├─────────────────────────────────┤
│ ⚙️ 設定                         │
│   主題: Worship Warm            │
│   動畫: Crossfade 400ms          │
└─────────────────────────────────┘
```

## 實作步驟

### Phase 1: 認證基礎
1. 設置 Google Cloud Console OAuth 憑證
2. 實作 `/api/auth/login` 端點
3. 創建登入 Modal 組件
4. 添加 Auth Context

### Phase 2: 用戶資料表
1. 執行資料庫 migration
2. 創建 users 相關 API
3. 實作用戶 session 管理

### Phase 3: 我的歌單
1. 實作用戶歌單 CRUD API
2. 創建歌單管理 UI
3. 支援從現有 session 儲存到歌單

### Phase 4: 收藏功能
1. 在 AI 搜歌結果添加「收藏」按鈕
2. 實作收藏 API
3. 創建收藏列表頁面

### Phase 5: 設定同步
1. 將現有設定與用戶設定整合
2. 自動載入用戶偏好
3. 跨設備同步

## 環境變量

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 安全考量

1. 使用 HttpOnly cookies 儲存 JWT
2. CSRF 保護
3. 驗證 Google ID token
4. 限制 OAuth callback URL
