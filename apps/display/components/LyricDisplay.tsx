'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from 'shared';
import type { DisplayState, StyleConfig, Lyric } from 'shared';

const DEFAULT_STYLE: StyleConfig = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 48,
  fontWeight: 700,
  color: '#ffffff',
  textAlign: 'center',
  textShadow: {
    enabled: true,
    color: '#000000',
    blur: 8,
    offsetX: 2,
    offsetY: 2,
  },
  textStroke: {
    enabled: false,
    color: '#000000',
    width: 2,
  },
  background: {
    type: 'transparent',
  },
  fadeDuration: 500,
  padding: 40,
  lineHeight: 1.5,
};

interface LyricDisplayProps {
  sessionId: string;
}

export function LyricDisplay({ sessionId }: LyricDisplayProps) {
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [state, setState] = useState<DisplayState>({
    currentIndex: null,
    isVisible: false,
    opacity: 0,
    isFadingIn: false,
    isFadingOut: false,
  });
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);

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
      .on('broadcast', { event: 'state' }, (payload) => {
        setState(payload.payload.state);
      })
      .on('broadcast', { event: 'style' }, (payload) => {
        setStyle(payload.payload.style);
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

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={backgroundStyle}
    >
      <div style={containerStyle}>
        {currentLyric && (
          <div style={textStyle}>
            {currentLyric.text}
          </div>
        )}
      </div>
    </div>
  );
}
