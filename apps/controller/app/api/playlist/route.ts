import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { LyricLine } from 'shared/src/types';

// Create Supabase client directly for API routes
const createSupabaseClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// GET - 獲取 session 的所有歌曲
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  const supabase = createSupabaseClient();

  // 獲取該 session 的所有歌曲（從 lyrics 表，按 group by 或使用新結構）
  // 為了相容現有結構，我們從 lyrics 表讀取，將同一首歌的歌詞聚合
  const { data: lyrics, error } = await supabase
    .from('lyrics')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index');

  if (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }

  // 如果沒有歌詞，返回空陣列
  if (!lyrics || lyrics.length === 0) {
    return NextResponse.json({ songs: [], currentSongIndex: null });
  }

  // 將歌詞按歌曲分組（簡單做法：每次 AI 匯入都是一首新歌）
  // 這裡我們假設每首歌的歌詞是連續的，通過 notes 來識別不同的歌
  const songs: Record<string, any> = {};
  let songOrder = 0;

  lyrics.forEach((lyric) => {
    const songKey = lyric.notes || `歌曲${songOrder + 1}`;

    if (!songs[songKey]) {
      songs[songKey] = {
        id: crypto.randomUUID(),
        songName: songKey,
        artist: null,
        lyrics: [],
        orderIndex: songOrder++,
        isCurrent: songOrder === 1,
      };
    }

    songs[songKey].lyrics.push({
      text: lyric.text,
      notes: lyric.notes,
    });
  });

  const songsArray = Object.values(songs);

  return NextResponse.json({
    songs: songsArray,
    currentSongIndex: 0,
  });
}

// POST - 添加新歌曲到歌單
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, songName, artist, lyrics } = body;

  if (!sessionId || !songName || !lyrics) {
    return NextResponse.json(
      { error: 'sessionId, songName, and lyrics are required' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient();

  try {
    // 先檢查 session 是否存在
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 獲取當前歌詞數量來確定 order_index
    const { data: existingLyrics } = await supabase
      .from('lyrics')
      .select('order_index')
      .eq('session_id', sessionId);

    const nextOrderIndex = existingLyrics?.length || 0;

    // 插入歌詞
    const lyricsToInsert = lyrics.map((line: LyricLine, index: number) => ({
      id: crypto.randomUUID(),
      session_id: sessionId,
      text: line.text,
      notes: line.notes || `${songName}${artist ? ` - ${artist}` : ''}`,
      order_index: nextOrderIndex + index,
    }));

    const { data, error } = await supabase
      .from('lyrics')
      .insert(lyricsToInsert)
      .select();

    if (error) {
      console.error('Error adding song:', error);
      return NextResponse.json({ error: 'Failed to add song' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      song: {
        id: crypto.randomUUID(),
        songName: songName,
        artist: artist || null,
        lyrics: lyrics,
        orderIndex: nextOrderIndex,
        isCurrent: true,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/playlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
