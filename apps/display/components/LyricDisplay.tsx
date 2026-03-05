'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient, DEFAULT_STYLE, DESIGN_TOKENS, parseChordsFromLyric, transposeChord } from 'shared';
import type { DisplayState, StyleConfig, Lyric, ParsedChord } from 'shared';

interface LyricDisplayProps {
  sessionId: string;
  mode?: 'audience' | 'stage';
}

export function LyricDisplay({ sessionId, mode = 'stage' }: LyricDisplayProps) {
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [state, setState] = useState<DisplayState>({
    currentIndex: null,
    isVisible: false,
    opacity: 0,
    isFadingIn: false,
    isFadingOut: false,
  });
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);
  const [showChords, setShowChords] = useState(true);
  const [transpose, setTranspose] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseClient();

    // 載入歌詞
    const loadLyrics = async () => {
      const { data } = await supabase
        .from('lyrics')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index');

      if (data) setLyrics(data);
    };

    loadLyrics();

    // 訂閱 Realtime 更新
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('broadcast', { event: 'display_state' }, (payload: any) => {
        if (payload) setState(payload as DisplayState);
      })
      .on('broadcast', { event: 'style' }, (payload: any) => {
        if (payload) setStyle(payload as StyleConfig);
      })
      .on('broadcast', { event: 'chord_settings' }, (payload: any) => {
        if (payload) {
          if (payload.showChords !== undefined) setShowChords(payload.showChords);
          if (payload.transpose !== undefined) setTranspose(payload.transpose);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // 處理淡入淡出動畫
  useEffect(() => {
    if (state.isFadingIn && state.isVisible) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, opacity: 1, isFadingIn: false }));
      }, 50);
      return () => clearTimeout(timer);
    }

    if (state.isFadingOut && !state.isVisible) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, opacity: 0, isFadingOut: false }));
      }, style.fadeDuration);
      return () => clearTimeout(timer);
    }
  }, [state.isFadingIn, state.isFadingOut, state.isVisible, style.fadeDuration]);

  // 計算當前歌詞樣式
  const containerStyle: React.CSSProperties = {
    opacity: state.isVisible ? state.opacity : 0,
    transition: `opacity ${style.fadeDuration}ms ease-in-out`,
    padding: style.padding,
    textAlign: style.textAlign,
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    color: style.color,
    lineHeight: style.lineHeight,
  };

  // 背景樣式
  let backgroundStyle: React.CSSProperties = {};
  if (style.background.type === 'solid') {
    backgroundStyle = { backgroundColor: style.background.value };
  } else if (style.background.type === 'gradient') {
    backgroundStyle = { background: style.background.value };
  } else if (style.background.type === 'image') {
    backgroundStyle = {
      backgroundImage: `url(${style.background.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  const textStyle: React.CSSProperties = {};
  if (style.textShadow.enabled) {
    textStyle.textShadow = `${style.textShadow.offsetX}px ${style.textShadow.offsetY}px ${style.textShadow.blur}px ${style.textShadow.color}`;
  }
  if (style.textStroke.enabled) {
    textStyle.WebkitTextStroke = `${style.textStroke.width}px ${style.textStroke.color}`;
  }

  const currentLyric = state.currentIndex !== null ? lyrics[state.currentIndex] : null;
  const nextLyric = state.currentIndex !== null && state.currentIndex < lyrics.length - 1 ? lyrics[state.currentIndex + 1] : null;

  // 解析和弦
  const currentParsed = currentLyric
    ? parseChordsFromLyric(currentLyric.text)
    : { text: '', chords: [] };
  const currentChords = showChords ? currentParsed.chords.map(c => ({
    ...c,
    chord: transpose !== 0 ? transposeChord(c.chord, transpose) : c.chord,
  })) : [];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        ...backgroundStyle,
        background: mode === 'stage' && style.background.type === 'transparent'
          ? 'radial-gradient(circle, #1A1A2E 0%, #000000 100%)'
          : backgroundStyle.background,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-12">
        {/* Main lyric with chords */}
        <div className="flex flex-col items-center gap-4">
          {/* Chords display */}
          {showChords && currentChords.length > 0 && mode === 'stage' && (
            <div className="flex items-center justify-center gap-8">
              {currentChords.map((chord, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: `${style.fontSize * 0.5}px`,
                    fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                    color: DESIGN_TOKENS.colors.feature,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {chord.chord}
                </span>
              ))}
            </div>
          )}

          {/* Main lyric text */}
          <div style={containerStyle}>
            {currentLyric && (
              <div style={textStyle}>
                {currentParsed.text || currentLyric.text}
              </div>
            )}
          </div>
        </div>

        {/* Next lyric preview (stage mode only) */}
        {mode === 'stage' && nextLyric && (
          <div style={{ opacity: 0.6 }}>
            <p
              style={{
                fontSize: '11px',
                color: DESIGN_TOKENS.colors.text.tertiary,
                fontWeight: 500,
                letterSpacing: '1px',
                marginBottom: '8px',
                textAlign: 'center',
              }}
            >
              NEXT:
            </p>
            <p
              style={{
                fontSize: `${style.fontSize * 0.5}px`,
                color: DESIGN_TOKENS.colors.text.secondary,
                textAlign: 'center',
              }}
            >
              {nextLyric.text}
            </p>
          </div>
        )}
      </div>

      {/* Footer info (stage mode only) */}
      {mode === 'stage' && (
        <div
          className="fixed bottom-0 left-0 right-0 flex items-center justify-between"
          style={{ padding: '0 48px', height: '80px' }}
        >
          <span style={{ fontSize: '13px', color: DESIGN_TOKENS.colors.text.tertiary }}>
            Session: {sessionId.slice(0, 6)}
          </span>
          <div className="flex items-center gap-4">
            {showChords && currentChords.length > 0 && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '13px', color: DESIGN_TOKENS.colors.feature }}>
                  {transpose > 0 ? `+${transpose}` : transpose}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: DESIGN_TOKENS.colors.success }} />
              <span style={{ fontSize: '13px', color: DESIGN_TOKENS.colors.text.tertiary }}>Stage Mode</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
