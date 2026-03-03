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
