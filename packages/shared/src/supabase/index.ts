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
