-- Playlists 表：存儲歌單
CREATE TABLE playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist Songs 表：存儲歌單中的歌曲
CREATE TABLE playlist_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  artist TEXT,
  lyrics JSONB NOT NULL, -- 存儲歌詞陣列 [{"text": "...", "notes": "..."}]
  order_index INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT FALSE, -- 當前播放的歌曲
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加索引
CREATE INDEX idx_playlists_session ON playlists(session_id);
CREATE INDEX idx_playlist_songs_playlist ON playlist_songs(playlist_id);

-- 啟用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE playlists;
ALTER PUBLICATION supabase_realtime ADD TABLE playlist_songs;
