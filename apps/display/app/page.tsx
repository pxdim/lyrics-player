'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DisplayState, StyleConfig, Lyric } from 'shared';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const DEFAULT_STYLE: StyleConfig = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 72,
  fontWeight: 600,
  color: '#ffffff',
  textAlign: 'center',
  textShadow: {
    enabled: true,
    color: '#000000',
    blur: 12,
    offsetX: 0,
    offsetY: 4,
  },
  textStroke: {
    enabled: false,
    color: '#000000',
    width: 2,
  },
  background: {
    type: 'transparent',
  },
  fadeDuration: 400,
  padding: 60,
  lineHeight: 1.4,
};

type ConnectionState = 'registering' | 'waiting' | 'connected' | 'ready';

export default function DisplayPage() {
  const sessionCodeRef = useRef(generateSessionCode());
  const [sessionCode] = useState(sessionCodeRef.current);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('registering');
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [lyricsCount, setLyricsCount] = useState(0);

  const [displayState, setDisplayState] = useState<DisplayState>({
    currentIndex: null,
    isVisible: true,
    opacity: 1,
    isFadingIn: false,
    isFadingOut: false,
  });
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);

  const supabaseRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // Register session on mount
  useEffect(() => {
    const registerSession = async () => {
      console.log('[Display] Registering session...');
      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
      supabaseRef.current = supabase;

      const { data, error } = await supabase
        .from('sessions')
        .insert({ id: crypto.randomUUID(), code: sessionCode })
        .select('id, code')
        .single();

      if (error) {
        console.error('[Display] Failed to register session:', error);
        setConnectionState('waiting');
        return;
      }

      console.log('[Display] Session registered:', data.id);
      setSessionId(data.id);
      setConnectionState('waiting');

      // Load initial lyrics
      const { data: lyricsData, error: lyricsError } = await supabase
        .from('lyrics')
        .select('*')
        .eq('session_id', data.id)
        .order('order_index');

      if (lyricsError) {
        console.error('[Display] Error loading lyrics:', lyricsError);
      } else {
        console.log('[Display] Initial lyrics count:', lyricsData?.length || 0);
        if (lyricsData) {
          setLyrics(lyricsData);
          setLyricsCount(lyricsData.length);
          if (lyricsData.length > 0) {
            setConnectionState('ready');
          }
        }
      }
    };

    registerSession();
  }, [sessionCode]);

  // Setup Realtime subscription
  useEffect(() => {
    if (!sessionId || !supabaseRef.current) return;

    console.log('[Display] Setting up realtime for session:', sessionId);
    const supabase = supabaseRef.current;

    // Clean up existing channel
    if (channelRef.current) {
      console.log('[Display] Removing existing channel');
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`session:${sessionId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'broadcast',
        { event: 'display_state' },
        (payload: any) => {
          console.log('[Display] Received display_state:', payload);
          if (payload?.payload) {
            setDisplayState(payload.payload);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'style' },
        (payload: any) => {
          console.log('[Display] Received style:', payload);
          if (payload?.payload) {
            setStyle(payload.payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lyrics',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload: any) => {
          console.log('[Display] Lyrics changed:', payload);
          // Fetch all lyrics
          const { data, error } = await supabase
            .from('lyrics')
            .select('*')
            .eq('session_id', sessionId)
            .order('order_index');

          if (error) {
            console.error('[Display] Error fetching lyrics after change:', error);
          } else {
            console.log('[Display] Updated lyrics count:', data?.length || 0);
            if (data) {
              setLyrics(data);
              setLyricsCount(data.length);
              if (data.length > 0 && connectionState === 'waiting') {
                setConnectionState('ready');
              }
            }
          }
        }
      )
      .subscribe((status: string, err?: Error) => {
        console.log('[Display] Channel status:', status, err);
        if (status === 'SUBSCRIBED') {
          setConnectionState(lyricsCount > 0 ? 'ready' : 'connected');
        }
        if (err) {
          console.error('[Display] Channel error:', err);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[Display] Cleaning up channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId]);

  // Fetch lyrics when display state changes but lyrics are empty
  useEffect(() => {
    if (sessionId && displayState.currentIndex !== null && lyrics.length === 0) {
      console.log('[Display] No lyrics, fetching...');
      const fetchLyrics = async () => {
        const supabase = supabaseRef.current;
        if (!supabase) return;

        const { data } = await supabase
          .from('lyrics')
          .select('*')
          .eq('session_id', sessionId)
          .order('order_index');

        console.log('[Display] Fetched lyrics on demand:', data?.length || 0);
        if (data && data.length > 0) {
          setLyrics(data);
          setLyricsCount(data.length);
          setConnectionState('ready');
        }
      };
      fetchLyrics();
    }
  }, [sessionId, displayState.currentIndex, lyrics.length]);

  // Handle fade animations
  useEffect(() => {
    if (displayState.isFadingIn && displayState.isVisible) {
      const timer = setTimeout(() => {
        setDisplayState((prev) => ({ ...prev, opacity: 1, isFadingIn: false }));
      }, 50);
      return () => clearTimeout(timer);
    }
    if (displayState.isFadingOut && !displayState.isVisible) {
      const timer = setTimeout(() => {
        setDisplayState((prev) => ({ ...prev, opacity: 0, isFadingOut: false }));
      }, style.fadeDuration);
      return () => clearTimeout(timer);
    }
  }, [displayState.isFadingIn, displayState.isFadingOut, displayState.isVisible, style.fadeDuration]);

  // Show connection screen while waiting for lyrics
  if (lyrics.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        {/* Noise texture */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}></div>

        {/* Subtle glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-2xl shadow-white/10">
              <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4V7h4V3h-6z"/>
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-white/90 mb-2 tracking-tight">
            歌詞顯示端
          </h1>
          <p className="text-sm text-white/40 mb-10">
            {connectionState === 'registering' ? '正在啟動...' : '等待歌詞載入'}
          </p>

          {/* Connection Code */}
          <div className="bg-white/[0.05] backdrop-blur-xl rounded-3xl border border-white/10 px-10 py-8 shadow-2xl">
            <p className="text-center text-white/30 text-xs uppercase tracking-widest mb-4">
              連接碼
            </p>
            <div className="text-8xl font-mono font-bold tracking-widest text-white select-all">
              {sessionCode.slice(0, 3)}-{sessionCode.slice(3)}
            </div>

            {/* Connection Status */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                connectionState === 'connected' || connectionState === 'ready'
                  ? 'bg-green-400 shadow-lg shadow-green-400/50'
                  : connectionState === 'waiting'
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-white/20'
              }`}></div>
              <p className="text-white/40 text-sm">
                {connectionState === 'registering' && '正在建立連線...'}
                {connectionState === 'waiting' && '等待控制端連接...'}
                {connectionState === 'connected' && '已連線 - 等待歌詞'}
                {connectionState === 'ready' && '準備就緒'}
              </p>
            </div>
          </div>

          {/* Lyrics count indicator */}
          {(connectionState === 'connected' || connectionState === 'ready') && (
            <div className="mt-6 text-white/30 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>已載入 {lyricsCount} 行歌詞</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lyrics display mode
  const containerStyle: React.CSSProperties = {
    opacity: displayState.isVisible ? displayState.opacity : 0,
    transition: `opacity ${style.fadeDuration}ms ease-in-out`,
    padding: style.padding,
    textAlign: style.textAlign as any,
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    color: style.color,
    lineHeight: style.lineHeight,
  };

  // Background style
  let backgroundStyle: React.CSSProperties = {};
  if (style.background.type === 'solid') {
    backgroundStyle = { backgroundColor: style.background.value || '#000000' };
  } else if (style.background.type === 'gradient') {
    backgroundStyle = { background: style.background.value || 'transparent' };
  }

  // Text effects
  const textStyle: React.CSSProperties = {};
  if (style.textShadow?.enabled) {
    textStyle.textShadow = `${style.textShadow.offsetX}px ${style.textShadow.offsetY}px ${style.textShadow.blur}px ${style.textShadow.color}`;
  }
  if (style.textStroke?.enabled) {
    textStyle.WebkitTextStroke = `${style.textStroke.width}px ${style.textStroke.color}`;
  }

  const currentLyric = displayState.currentIndex !== null && lyrics[displayState.currentIndex] ? lyrics[displayState.currentIndex] : null;

  return (
    <div className="min-h-screen flex items-center justify-center" style={backgroundStyle}>
      {/* Pure black background */}
      <div className="fixed inset-0 bg-black -z-10"></div>

      {/* Noise texture */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none -z-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}></div>

      {/* Lyrics display */}
      <div style={containerStyle} className="relative z-10 w-full">
        {currentLyric ? (
          <div style={textStyle} className="animate-fade-in">
            {currentLyric.text}
          </div>
        ) : (
          <div className="text-white/10 text-3xl font-light tracking-wide">
            {displayState.isVisible ? (
              lyrics.length === 0
                ? '等待歌詞載入...'
                : (displayState.currentIndex !== null ? `正在載入第 ${displayState.currentIndex + 1} 句歌詞...` : '準備播放歌詞...')
            ) : '顯示已隱藏'}
          </div>
        )}
      </div>

      {/* Debug info */}
      <div className="fixed bottom-4 right-4 text-white/10 text-xs font-mono">
        歌詞: {lyrics.length} | 當前: {displayState.currentIndex ?? '-'} | {currentLyric ? '顯示中' : '空白'}
      </div>
    </div>
  );
}
