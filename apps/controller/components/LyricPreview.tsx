'use client';

import { Lyric, parseChordsFromLyric, transposeChord, DESIGN_TOKENS, useLyricAnimation } from 'shared';
import { Clock, Music2, Play, Pause, RotateCcw, Plus, Minus, List } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { AnimationConfig } from 'shared';

interface LyricPreviewProps {
  lyrics: Lyric[];
  currentIndex: number | null;
  displayMode: 'audience' | 'stage';
  onDisplayModeChange: (mode: 'audience' | 'stage') => void;
  showChords: boolean;
  onToggleChords: () => void;
  transpose: number;
  timerDisplay: string;
  timerIsRunning: boolean;
  timerRemaining: number;
  onTimerToggle: () => void;
  onTimerReset: () => void;
  onTimerDurationChange: (minutes: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  isPlaying: boolean;
  onSelectLyric?: (index: number) => void;
  animationConfig?: AnimationConfig;
}

export default function LyricPreview({
  lyrics,
  currentIndex,
  displayMode,
  onDisplayModeChange,
  showChords,
  onToggleChords,
  transpose,
  timerDisplay,
  timerIsRunning,
  timerRemaining,
  onTimerToggle,
  onTimerReset,
  onTimerDurationChange,
  onPrevious,
  onNext,
  onPlayPause,
  isPlaying,
  onSelectLyric,
  animationConfig,
}: LyricPreviewProps) {
  const [showTimerControls, setShowTimerControls] = useState(false);
  const [showLyricList, setShowLyricList] = useState(false);

  // 使用動畫 Hook
  const animation = useLyricAnimation(
    currentIndex,
    animationConfig || {
      enabled: true,
      type: 'crossfade',
      duration: 400,
      easing: 'ease-in-out',
      rapidSwitchMode: 'immediate',
    }
  );

  const currentLyric = currentIndex !== null ? lyrics[currentIndex] : null;
  const nextLyric = currentIndex !== null && currentIndex < lyrics.length - 1 ? lyrics[currentIndex + 1] : null;

  const hasPrevious = currentIndex !== null && currentIndex > 0;
  const hasNext = currentIndex !== null && currentIndex < lyrics.length - 1;

  // 解析當前歌詞的和弦
  const currentChords = useMemo(() => {
    if (!currentLyric || !showChords) return [];
    const parsed = parseChordsFromLyric(currentLyric.text);
    return parsed.chords.map(c => ({
      ...c,
      chord: transpose !== 0 ? transposeChord(c.chord, transpose) : c.chord,
    }));
  }, [currentLyric, showChords, transpose]);

  return (
    <div className="flex-1 flex flex-col p-6 gap-4" style={{ backgroundColor: DESIGN_TOKENS.colors.background }}>
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        {/* Timer */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl relative"
          style={{ backgroundColor: DESIGN_TOKENS.colors.panel }}
        >
          <button
            onClick={() => setShowTimerControls(!showTimerControls)}
            aria-label="計時器設定"
          >
            <Clock size={20} color={DESIGN_TOKENS.colors.accent} />
          </button>
          <span
            style={{
              fontSize: DESIGN_TOKENS.fontSize['2xl'],
              fontWeight: DESIGN_TOKENS.fontWeight.semibold,
              color: timerRemaining === 0 ? DESIGN_TOKENS.colors.error : DESIGN_TOKENS.colors.text.primary,
            }}
          >
            {timerDisplay}
          </span>
          <div className="flex gap-1">
            <button
              onClick={onTimerToggle}
              className="p-1 rounded hover:bg-white/10 transition-all"
              style={{ backgroundColor: 'transparent' }}
              aria-label={timerIsRunning ? "暫停計時器" : "啟動計時器"}
            >
              {timerIsRunning ? (
                <Pause size={16} color={DESIGN_TOKENS.colors.text.secondary} />
              ) : (
                <Play size={16} color={DESIGN_TOKENS.colors.text.secondary} />
              )}
            </button>
            <button
              onClick={onTimerReset}
              className="p-1 rounded hover:bg-white/10 transition-all"
              style={{ backgroundColor: 'transparent' }}
              aria-label="重置計時器"
            >
              <RotateCcw size={16} color={DESIGN_TOKENS.colors.text.secondary} />
            </button>
          </div>

          {/* Timer Duration Controls */}
          {showTimerControls && (
            <div
              className="absolute top-full right-0 mt-2 p-3 rounded-xl z-10"
              style={{ backgroundColor: DESIGN_TOKENS.colors.panel, border: `1px solid ${DESIGN_TOKENS.colors.panelBorder}` }}
            >
              <p
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.xs,
                  color: DESIGN_TOKENS.colors.text.tertiary,
                  marginBottom: '8px',
                }}
              >
                计时器时长 (分钟)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTimerDurationChange(Math.max(1, Math.ceil(timerRemaining / 60) - 1))}
                  className="p-2 rounded"
                  style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
                >
                  <Minus size={14} color={DESIGN_TOKENS.colors.text.secondary} />
                </button>
                <span
                  style={{
                    fontSize: DESIGN_TOKENS.fontSize.md,
                    fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                    color: DESIGN_TOKENS.colors.text.primary,
                    minWidth: '30px',
                    textAlign: 'center',
                  }}
                >
                  {Math.ceil(timerRemaining / 60)}
                </span>
                <button
                  onClick={() => onTimerDurationChange(Math.min(60, Math.ceil(timerRemaining / 60) + 1))}
                  className="p-2 rounded"
                  style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
                >
                  <Plus size={14} color={DESIGN_TOKENS.colors.text.secondary} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Display Mode Toggle */}
        <div
          className="flex items-center gap-4 px-4 py-3 rounded-xl flex-1"
          style={{ backgroundColor: DESIGN_TOKENS.colors.panel }}
        >
          <span
            style={{
              fontSize: DESIGN_TOKENS.fontSize.sm,
              color: DESIGN_TOKENS.colors.text.tertiary,
            }}
          >
            Display Mode:
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onDisplayModeChange('stage')}
              className="px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: displayMode === 'stage' ? DESIGN_TOKENS.colors.accent : 'transparent',
                color: displayMode === 'stage' ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.secondary,
              }}
            >
              Stage
            </button>
            <button
              onClick={() => onDisplayModeChange('audience')}
              className="px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: displayMode === 'audience' ? DESIGN_TOKENS.colors.accent : 'transparent',
                color: displayMode === 'audience' ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.secondary,
              }}
            >
              Audience
            </button>
          </div>
        </div>

        <div className="flex-1" />

        {/* Chord Toggle */}
        <button
          onClick={onToggleChords}
          className="flex items-center gap-2 px-3 py-3 rounded-xl"
          style={{ backgroundColor: DESIGN_TOKENS.colors.panel }}
          aria-label={showChords ? "隱藏和弦" : "顯示和弦"}
        >
          <Music2 size={18} color={showChords ? DESIGN_TOKENS.colors.feature : DESIGN_TOKENS.colors.text.tertiary} />
          <span
            style={{
              fontSize: DESIGN_TOKENS.fontSize.sm,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              color: showChords ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.secondary,
            }}
          >
            Chords {showChords ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Lyric List Toggle */}
        {onSelectLyric && (
          <button
            onClick={() => setShowLyricList(!showLyricList)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl"
            style={{ backgroundColor: showLyricList ? DESIGN_TOKENS.colors.accent : DESIGN_TOKENS.colors.panel }}
            aria-label={showLyricList ? "隱藏歌詞列表" : "顯示歌詞列表"}
          >
            <List size={18} color={showLyricList ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.tertiary} />
            <span
              style={{
                fontSize: DESIGN_TOKENS.fontSize.sm,
                fontWeight: DESIGN_TOKENS.fontWeight.medium,
                color: showLyricList ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.secondary,
              }}
            >
              歌詞列表
            </span>
          </button>
        )}
      </div>

      {/* Main Content Area with optional Lyric List */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Lyric List Side Panel */}
        {showLyricList && onSelectLyric && (
          <div
            className="w-64 overflow-y-auto rounded-2xl p-4"
            style={{ backgroundColor: DESIGN_TOKENS.colors.panel }}
          >
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize.sm,
                color: DESIGN_TOKENS.colors.text.tertiary,
                fontWeight: DESIGN_TOKENS.fontWeight.medium,
                marginBottom: '12px',
              }}
            >
              快速跳行
            </p>
            <div className="space-y-1">
              {lyrics.map((lyric, index) => {
                const isActive = currentIndex === index;
                return (
                  <button
                    key={lyric.id}
                    onClick={() => {
                      onSelectLyric(index);
                      // 不關閉視窗，讓用戶可以繼續選擇
                    }}
                    className="w-full text-left p-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: isActive ? DESIGN_TOKENS.colors.accent : 'transparent',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        style={{
                          fontSize: DESIGN_TOKENS.fontSize.xs,
                          color: isActive ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.tertiary,
                          minWidth: '20px',
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p
                        style={{
                          fontSize: DESIGN_TOKENS.fontSize.sm,
                          color: isActive ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.secondary,
                          lineHeight: 1.4,
                        }}
                      >
                        {lyric.text}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {/* Lyric Preview Card */}
      <div
        className="flex-1 flex flex-col items-center justify-center rounded-2xl p-12 gap-8 relative"
        style={{ backgroundColor: DESIGN_TOKENS.colors.panel }}
      >
        {/* Previous lyric (exiting animation) */}
        {animation.previousIndex !== null && animation.isExiting && lyrics[animation.previousIndex] && (
          <div
            className="absolute inset-0 flex items-center justify-center p-12"
            style={{
              opacity: animation.exitOpacity,
              transform: animation.exitTransform,
              transition: `all ${animationConfig?.duration || 400}ms ${animationConfig?.easing || 'ease-in-out'}`,
              pointerEvents: 'none',
            }}
          >
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize['4xl'],
                fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.text.primary,
                textAlign: 'center',
              }}
            >
              {lyrics[animation.previousIndex].text}
            </p>
          </div>
        )}

        {currentLyric ? (
          <>
            {/* Current Lyric with animation */}
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize['4xl'],
                fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.text.primary,
                textAlign: 'center',
                opacity: animation.isEntering ? animation.enterOpacity : 1,
                transform: animation.enterTransform,
                transition: animation.isEntering || animation.isExiting
                  ? `all ${animationConfig?.duration || 400}ms ${animationConfig?.easing || 'ease-in-out'}`
                  : 'none',
              }}
            >
              {currentLyric.text}
            </p>

            {/* Next Lyric Preview */}
            {nextLyric && (
              <>
                <p
                  style={{
                    fontSize: DESIGN_TOKENS.fontSize.xs,
                    color: DESIGN_TOKENS.colors.text.tertiary,
                    fontWeight: DESIGN_TOKENS.fontWeight.medium,
                    letterSpacing: '1px',
                  }}
                >
                  NEXT:
                </p>
                <p
                  style={{
                    fontSize: DESIGN_TOKENS.fontSize.xl,
                    color: DESIGN_TOKENS.colors.text.secondary,
                    textAlign: 'center',
                    opacity: 0.6,
                  }}
                >
                  {nextLyric.text}
                </p>
              </>
            )}

            {/* Chord Display */}
            {showChords && displayMode === 'stage' && currentChords.length > 0 && (
              <div className="flex items-center justify-center gap-8">
                {currentChords.map((chord, index) => (
                  <span
                    key={`${chord.chord}-${index}`}
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize['3xl'],
                      fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                      color: DESIGN_TOKENS.colors.feature,
                    }}
                  >
                    {chord.chord}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.lg,
              color: DESIGN_TOKENS.colors.text.tertiary,
            }}
          >
            選擇一首歌詞開始播放
          </p>
        )}

        {/* Control Bar */}
        <div className="flex items-center gap-3" role="group" aria-label="播放控制">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="w-14 h-14 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
            aria-label="上一首"
          >
            <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 20L9 12l10-8v16zM6 5v14" />
            </svg>
          </button>

          <button
            onClick={onPlayPause}
            className="w-18 h-18 rounded-2xl flex items-center justify-center transition-all"
            style={{ backgroundColor: DESIGN_TOKENS.colors.accent }}
            aria-label={isPlaying ? "暫停" : "播放"}
          >
            {isPlaying ? (
              <svg width={32} height={32} fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width={32} height={32} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="w-14 h-14 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
            aria-label="下一首"
          >
            <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 4l10 8v-8l10 8v16L15 12v8L5 12v-8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-3" role="group" aria-label="播放控制">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="w-14 h-14 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
          aria-label="上一首"
        >
          <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 20L9 12l10-8v16zM6 5v14" />
          </svg>
        </button>

        <button
          onClick={onPlayPause}
          className="w-18 h-18 rounded-2xl flex items-center justify-center transition-all"
          style={{ backgroundColor: DESIGN_TOKENS.colors.accent }}
          aria-label={isPlaying ? "暫停" : "播放"}
        >
          {isPlaying ? (
            <svg width={32} height={32} fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width={32} height={32} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="w-14 h-14 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
          aria-label="下一首"
        >
          <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M5 4l10 8v-8l10 8v16L15 12v8L5 12v-8z" />
          </svg>
        </button>
      </div>
    </div>
    </div>
  );
}
