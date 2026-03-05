-- Supabase Auth 用戶功能 Migration
-- 這個 migration 為 Google Auth 登入後的用戶功能創建資料表

-- ============================================
-- 1. 用戶個人資料表
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 用戶歌單
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 歌單歌曲關聯
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_playlist_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES public.user_playlists(id) ON DELETE CASCADE NOT NULL,
  song_name TEXT NOT NULL,
  artist TEXT,
  lyrics JSONB NOT NULL DEFAULT '[]',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 收藏歌曲
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorite_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  song_name TEXT NOT NULL,
  artist TEXT,
  lyrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. 用戶設定
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme_id TEXT DEFAULT 'worship-warm',
  animation_config JSONB DEFAULT '{"enabled":true,"type":"crossfade","duration":400,"easing":"ease-in-out","rapidSwitchMode":"immediate"}',
  display_mode TEXT DEFAULT 'stage',
  show_chords BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_playlists_user ON public.user_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playlists_public ON public.user_playlists(user_id, is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_playlist_songs_playlist ON public.user_playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_user_playlist_songs_order ON public.user_playlist_songs(playlist_id, order_index);
CREATE INDEX IF NOT EXISTS idx_favorite_songs_user ON public.favorite_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_songs_name ON public.favorite_songs(user_id, song_name);

-- ============================================
-- 7. 啟用 Row Level Security (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS 規則
-- ============================================

-- Profiles: 用戶可以讀取所有人的 profile，但只能更新自己的
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User Playlists: 用戶只能 CRUD 自己的歌單
CREATE POLICY "Users can crud own playlists"
  ON public.user_playlists FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public playlists are viewable by everyone"
  ON public.user_playlists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Playlist Songs: 透過父表管理
CREATE POLICY "Users can crud songs in own playlists"
  ON public.user_playlist_songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_playlists
      WHERE user_playlists.id = user_playlist_songs.playlist_id
      AND user_playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Playlist songs are viewable if playlist is public"
  ON public.user_playlist_songs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_playlists
      WHERE user_playlists.id = user_playlist_songs.playlist_id
      AND (user_playlists.is_public = true OR user_playlists.user_id = auth.uid())
    )
  );

-- Favorite Songs: 用戶只能 CRUD 自己的收藏
CREATE POLICY "Users can crud own favorites"
  ON public.favorite_songs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own favorites"
  ON public.favorite_songs FOR SELECT
  USING (auth.uid() = user_id);

-- User Settings: 用戶只能 CRUD 自己的設定
CREATE POLICY "Users can crud own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 9. 自動創建 profile 和 settings 當用戶註冊
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 插入 profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- 插入預設設定
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 10. 啟用 Realtime（可選，如果需要即時同步）
-- ============================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_playlists;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.favorite_songs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;

-- ============================================
-- 11. 輔助函數
-- ============================================

-- 更新 updated_at 時間戳
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_playlists_updated_at BEFORE UPDATE ON public.user_playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
