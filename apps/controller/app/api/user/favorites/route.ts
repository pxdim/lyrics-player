import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 創建 Supabase client (server-side)
const createServerClient = async () => {
  // 在服務端，我們不使用 cookies 而是通過 header 傳遞
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// GET - 獲取用戶的收藏歌曲
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // 從 request headers 中獲取 authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 解析 Bearer token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取收藏歌曲
    const { data: favorites, error } = await supabase
      .from('favorite_songs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }

    return NextResponse.json({ favorites: favorites || [] });
  } catch (error) {
    console.error('Error in GET /api/user/favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - 添加收藏歌曲
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { songName, artist, lyrics } = body;

    if (!songName) {
      return NextResponse.json({ error: 'songName is required' }, { status: 400 });
    }

    // 檢查是否已收藏
    const { data: existing } = await supabase
      .from('favorite_songs')
      .select('id')
      .eq('user_id', user.id)
      .eq('song_name', songName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Already in favorites' }, { status: 409 });
    }

    // 添加收藏
    const { data: favorite, error } = await supabase
      .from('favorite_songs')
      .insert({
        user_id: user.id,
        song_name: songName,
        artist: artist || null,
        lyrics: lyrics || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding favorite:', error);
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ favorite });
  } catch (error) {
    console.error('Error in POST /api/user/favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - 取消收藏
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { songName } = body;

    if (!songName) {
      return NextResponse.json({ error: 'songName is required' }, { status: 400 });
    }

    // 刪除收藏
    const { error } = await supabase
      .from('favorite_songs')
      .delete()
      .eq('user_id', user.id)
      .eq('song_name', songName);

    if (error) {
      console.error('Error removing favorite:', error);
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/user/favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
