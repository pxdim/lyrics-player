'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DisplayState, StyleConfig, Lyric } from 'shared';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const STORAGE_KEY = 'lyrics_display_session';

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
  animation: {
    enabled: true,
    type: 'crossfade',
    duration: 300,
    easing: 'ease-out',
    rapidSwitchMode: 'immediate',
  },
};

type ConnectionState = 'registering' | 'waiting' | 'connected' | 'ready';
type RoomManagementState = 'none' | 'menu';

export default function DisplayPage() {
  const [roomManagement, setRoomManagement] = useState<RoomManagementState>('none');
  const [customCode, setCustomCode] = useState('');
  const sessionCodeRef = useRef(generateSessionCode());
  const [sessionCode, setSessionCode] = useState(sessionCodeRef.current);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('registering');
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [lyricsCount, setLyricsCount] = useState(0);

  // Load saved session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.code && data.sessionId) {
          console.log('[Display] Found saved session:', data.code);
          setSessionCode(data.code);
          // Try to reconnect with saved session
          reconnectToSession(data.sessionId, data.code);
        }
      } catch (e) {
        console.error('[Display] Failed to parse saved session:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Reconnect to existing session
  const reconnectToSession = async (savedSessionId: string, savedCode: string) => {
    console.log('[Display] Attempting to reconnect to:', savedSessionId);
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    supabaseRef.current = supabase;

    // Check if session still exists
    const { data: sessionData, error } = await supabase
      .from('sessions')
      .select('id, code')
      .eq('id', savedSessionId)
      .single();

    if (error || !sessionData) {
      console.log('[Display] Session no longer exists, creating new one');
      localStorage.removeItem(STORAGE_KEY);
      // Fall through to create new session
      return false;
    }

    console.log('[Display] Session exists, reconnecting');
    setSessionId(savedSessionId);
    setSessionCode(savedCode);
    setConnectionState('connected');

    // Load lyrics
    const { data: lyricsData } = await supabase
      .from('lyrics')
      .select('*')
      .eq('session_id', savedSessionId)
      .order('order_index');

    if (lyricsData) {
      setLyrics(lyricsData);
      setLyricsCount(lyricsData.length);
      if (lyricsData.length > 0) {
        setConnectionState('ready');
      }
    }

    return true;
  };

  const [displayState, setDisplayState] = useState<DisplayState>({
    currentIndex: null,
    isVisible: true,
    opacity: 1,
    isFadingIn: false,
    isFadingOut: false,
    isAnimating: false,
    previousIndex: null,
    animationTrigger: 0,
  });
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);

  const supabaseRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // Register session on mount (only if not already reconnected)
  useEffect(() => {
    if (sessionId) return; // Already connected via reconnect

    const registerSession = async () => {
      console.log('[Display] Registering new session...');
      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
      supabaseRef.current = supabase;

      const newSessionId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('sessions')
        .insert({ id: newSessionId, code: sessionCode })
        .select('id, code')
        .single();

      if (error) {
        console.error('[Display] Failed to register session:', error);
        setConnectionState('waiting');
        return;
      }

      console.log('[Display] Session registered:', data.id);
      setSessionId(data.id);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessionId: data.id,
        code: data.code,
        timestamp: Date.now(),
      }));

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
  }, [sessionCode, sessionId]);

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

  // Room management functions
  const handleRegenerateCode = async () => {
    const newCode = generateSessionCode();
    const supabase = supabaseRef.current;
    if (!supabase || !sessionId) return;

    // Update session code in database
    const { error } = await supabase
      .from('sessions')
      .update({ code: newCode })
      .eq('id', sessionId);

    if (error) {
      console.error('[Display] Failed to update code:', error);
      alert('更新碼失敗');
      return;
    }

    // Update state and localStorage
    setSessionCode(newCode);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionId,
      code: newCode,
      timestamp: Date.now(),
    }));
    setRoomManagement('none');
  };

  const handleJoinCustomCode = async () => {
    const trimmedCode = customCode.trim().toUpperCase();
    if (trimmedCode.length !== 6) {
      alert('請輸入 6 位連接碼');
      return;
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

    // Find session by code
    const { data: sessionData, error } = await supabase
      .from('sessions')
      .select('id, code')
      .eq('code', trimmedCode)
      .single();

    if (error || !sessionData) {
      alert('找不到此連接碼');
      return;
    }

    // Save to localStorage and reload
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionId: sessionData.id,
      code: sessionData.code,
      timestamp: Date.now(),
    }));

    // Reload page to connect to new session
    window.location.reload();
  };

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

          {/* Room Management */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={() => setRoomManagement(roomManagement === 'none' ? 'menu' : 'none')}
              className="text-white/20 hover:text-white/40 text-sm flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              房間設定
            </button>

            {roomManagement === 'menu' && (
              <div className="flex flex-col gap-2 items-center">
                <button
                  onClick={handleRegenerateCode}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 text-sm transition-colors"
                >
                  重新生成碼
                </button>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    placeholder="輸入碼"
                    maxLength={6}
                    className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center text-sm placeholder-white/30 focus:outline-none focus:border-white/40"
                  />
                  <button
                    onClick={handleJoinCustomCode}
                    disabled={customCode.length !== 6}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white/60 text-sm transition-colors"
                  >
                    加入
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {/* Room management menu - visible on hover */}
      <div className="fixed bottom-4 right-4 group">
        {/* Hover indicator dot */}
        <div className="w-2 h-2 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors"></div>

        {/* Session code popup with room options */}
        <div className="absolute bottom-4 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden">
            {/* Session code */}
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-white/60 text-xs font-mono text-center">
                {sessionCode.slice(0, 3)}-{sessionCode.slice(3)}
              </p>
            </div>

            {/* Room options */}
            <div className="p-1 flex flex-col gap-1">
              <button
                onClick={handleRegenerateCode}
                className="px-3 py-1.5 text-white/40 text-xs hover:bg-white/10 rounded transition-colors text-left"
              >
                重新生成碼
              </button>
              <button
                onClick={() => {
                  const newCode = prompt('輸入房間碼：');
                  if (newCode && newCode.length === 6) {
                    setCustomCode(newCode);
                    handleJoinCustomCode();
                  }
                }}
                className="px-3 py-1.5 text-white/40 text-xs hover:bg-white/10 rounded transition-colors text-left"
              >
                加入其他房間
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
