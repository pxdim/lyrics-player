# 歌詞切換動畫功能 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 讓歌詞在切換下一句時自動播放淡入淡出/滑入滑出/縮放等動畫效果

**Architecture:** 擴展現有的 DisplayState 和 StyleConfig 來支持動畫配置，在 LyricDisplay 組件中使用 CSS transitions 和 React state 來實現動畫效果，動畫設定透過 Realtime 同步到顯示端。

**Tech Stack:** React hooks (useState, useEffect), CSS transitions, Supabase Realtime, TypeScript

---

### Task 1: 擴展類型定義 (shared/src/types/index.ts)

**Files:**
- Modify: `packages/shared/src/types/index.ts`

**Step 1: 添加動畫相關類型**

在現有的 DisplayState interface 後面添加：

```typescript
// ============ 動畫系統 ============

export type AnimationType =
  | 'none'           // 無動畫
  | 'fade-out-in'    // 淡出後淡入
  | 'crossfade'      // 交錯淡入淡出
  | 'slide'          // 滑入滑出
  | 'scale';         // 縮放效果

export type RapidSwitchMode =
  | 'immediate'      // 立即切換
  | 'queued'         // 排隊播放
  | 'skip';          // 跳過中間動畫

export interface AnimationConfig {
  enabled: boolean;              // 是否啟用歌詞切換動畫
  type: AnimationType;           // 動畫類型
  duration: number;              // 動畫持續時間（毫秒）
  easing: string;                // 緩動函數
  rapidSwitchMode: RapidSwitchMode; // 快速切換模式
}

export const DEFAULT_ANIMATION: AnimationConfig = {
  enabled: true,
  type: 'crossfade',
  duration: 400,
  easing: 'ease-in-out',
  rapidSwitchMode: 'immediate',
};
```

**Step 2: 擴展 DisplayState interface**

修改現有的 DisplayState interface：

```typescript
// 顯示狀態（透過 Realtime 同步）
export interface DisplayState {
  currentIndex: number | null;
  isVisible: boolean;
  opacity: number;
  isFadingIn: boolean;
  isFadingOut: boolean;
  // 新增動畫狀態
  isAnimating: boolean;         // 是否正在播放動畫
  previousIndex: number | null; // 上一句歌詞索引（用於退出動畫）
  animationTrigger: number;     // 動畫觸發計數器（用於強制重新渲染）
}
```

**Step 3: 擴展 StyleConfig interface**

在現有的 StyleConfig interface 中添加 animation 欄位：

```typescript
// 樣式配置
export interface StyleConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  textShadow: { /* ... */ };
  textStroke: { /* ... */ };
  background: { /* ... */ };
  fadeDuration: number;
  padding: number;
  lineHeight: number;
  // 新增動畫配置
  animation: AnimationConfig;
}
```

**Step 4: 更新 DEFAULT_STYLE**

在 DEFAULT_STYLE 中添加：

```typescript
export const DEFAULT_STYLE: StyleConfig = {
  // ... 現有欄位
  animation: DEFAULT_ANIMATION,
};
```

**Step 5: 執行 TypeScript 編譯驗證**

Run: `cd packages/shared && bun run build`
Expected: 編譯成功，無錯誤

**Step 6: Commit**

```bash
git add packages/shared/src/types/index.ts
git commit -m "feat(types): add animation types and extend DisplayState/StyleConfig"
```

---

### Task 2: 建立動畫 Hook (packages/shared/src/hooks/useLyricAnimation.ts)

**Files:**
- Create: `packages/shared/src/hooks/useLyricAnimation.ts`

**Step 1: 創建動畫 Hook**

```typescript
import { useState, useEffect, useRef } from 'react';
import type { AnimationConfig, AnimationType } from '../types';

interface AnimationState {
  isExiting: boolean;      // 當前歌詞是否正在退出
  isEntering: boolean;     // 新歌詞是否正在進入
  exitOpacity: number;     // 退出歌詞的透明度
  enterOpacity: number;    // 進入歌詞的透明度
  exitTransform: string;   // 退出歌詞的變換
  enterTransform: string;  // 進入歌詞的變換
}

const INITIAL_STATE: AnimationState = {
  isExiting: false,
  isEntering: false,
  exitOpacity: 1,
  enterOpacity: 0,
  exitTransform: '',
  enterTransform: '',
};

export function useLyricAnimation(
  currentIndex: number | null,
  animationConfig: AnimationConfig,
  onAnimationComplete?: (newIndex: number) => void
) {
  const [state, setState] = useState<AnimationState>(INITIAL_STATE);
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousIndexRef = useRef<number | null>(null);

  // 當索引變化時觸發動畫
  useEffect(() => {
    if (!animationConfig.enabled || currentIndex === null) {
      setDisplayIndex(currentIndex);
      setState(INITIAL_STATE);
      return;
    }

    // 如果索引沒有變化，不執行動畫
    if (currentIndex === previousIndexRef.current) {
      return;
    }

    // 清除之前的動畫計時器
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    const isFirstLoad = previousIndexRef.current === null;

    if (isFirstLoad) {
      // 首次載入，直接顯示
      setDisplayIndex(currentIndex);
      previousIndexRef.current = currentIndex;
      return;
    }

    // 開始動畫序列
    startAnimation(currentIndex);
  }, [currentIndex, animationConfig]);

  const startAnimation = (newIndex: number) => {
    const { type, duration, easing } = animationConfig;
    const halfDuration = duration / 2;

    switch (type) {
      case 'fade-out-in':
        // 淡出 -> 淡入
        setState({
          isExiting: true,
          isEntering: false,
          exitOpacity: 0,
          enterOpacity: 0,
          exitTransform: '',
          enterTransform: '',
        });

        animationTimerRef.current = setTimeout(() => {
          setDisplayIndex(newIndex);
          setState({
            isExiting: false,
            isEntering: true,
            exitOpacity: 0,
            enterOpacity: 1,
            exitTransform: '',
            enterTransform: '',
          });

          animationTimerRef.current = setTimeout(() => {
            setState(INITIAL_STATE);
            previousIndexRef.current = newIndex;
            onAnimationComplete?.(newIndex);
          }, halfDuration);
        }, halfDuration);
        break;

      case 'crossfade':
        // 同時淡出淡入
        setDisplayIndex(newIndex);
        setState({
          isExiting: true,
          isEntering: true,
          exitOpacity: 0,
          enterOpacity: 1,
          exitTransform: '',
          enterTransform: '',
        });

        animationTimerRef.current = setTimeout(() => {
          setState(INITIAL_STATE);
          previousIndexRef.current = newIndex;
          onAnimationComplete?.(newIndex);
        }, duration);
        break;

      case 'slide':
        // 滑入滑出
        const direction = newIndex > (previousIndexRef.current || 0) ? -1 : 1;
        setDisplayIndex(newIndex);
        setState({
          isExiting: true,
          isEntering: true,
          exitOpacity: 1,
          enterOpacity: 1,
          exitTransform: `translateX(${direction * 100}%)`,
          enterTransform: `translateX(${-direction * 100}%)`,
        });

        animationTimerRef.current = setTimeout(() => {
          setState({
            isExiting: false,
            isEntering: false,
            exitOpacity: 1,
            enterOpacity: 1,
            exitTransform: `translateX(${direction * 100}%)`,
            enterTransform: 'translateX(0)',
          });
        }, 50);

        animationTimerRef.current = setTimeout(() => {
          setState(INITIAL_STATE);
          previousIndexRef.current = newIndex;
          onAnimationComplete?.(newIndex);
        }, duration);
        break;

      case 'scale':
        // 縮放效果
        setDisplayIndex(newIndex);
        setState({
          isExiting: true,
          isEntering: true,
          exitOpacity: 1,
          enterOpacity: 1,
          exitTransform: 'scale(0.8)',
          enterTransform: 'scale(1.2)',
        });

        animationTimerRef.current = setTimeout(() => {
          setState({
            isExiting: false,
            isEntering: false,
            exitOpacity: 1,
            enterOpacity: 1,
            exitTransform: 'scale(0.8)',
            enterTransform: 'scale(1)',
          });
        }, 50);

        animationTimerRef.current = setTimeout(() => {
          setState(INITIAL_STATE);
          previousIndexRef.current = newIndex;
          onAnimationComplete?.(newIndex);
        }, duration);
        break;

      default:
        setDisplayIndex(newIndex);
        setState(INITIAL_STATE);
        previousIndexRef.current = newIndex;
    }
  };

  // 清理計時器
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  return {
    displayIndex,
    previousIndex: previousIndexRef.current,
    ...state,
  };
}
```

**Step 2: 導出 Hook 從 shared index**

修改 `packages/shared/src/index.ts`：

```typescript
export * from './types';
export * from './tokens';
export * from './supabase';

// Client-side hooks
export { useKeyboardShortcuts, useLyricsPlayerShortcuts } from './hooks/useKeyboardShortcuts';
export { useLyricAnimation } from './hooks/useLyricAnimation';
```

**Step 3: 執行編譯驗證**

Run: `bun run build`
Expected: 編譯成功，無錯誤

**Step 4: Commit**

```bash
git add packages/shared/src/hooks/useLyricAnimation.ts packages/shared/src/index.ts
git commit -m "feat(shared): add useLyricAnimation hook for lyric transitions"
```

---

### Task 3: 更新 LyricDisplay 組件使用動畫

**Files:**
- Modify: `apps/display/components/LyricDisplay.tsx`

**Step 1: 導入並使用動畫 Hook**

在文件頂部添加導入：

```typescript
import { useState, useEffect } from 'react';
import { createSupabaseClient, DEFAULT_STYLE, DESIGN_TOKENS, parseChordsFromLyric, transposeChord, useLyricAnimation } from 'shared';
```

**Step 2: 在組件中添加動畫狀態**

在 LyricDisplay 函數組件中，替換現有的 state 定義：

```typescript
export function LyricDisplay({ sessionId, mode = 'stage' }: LyricDisplayProps) {
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [state, setState] = useState<DisplayState>({
    currentIndex: null,
    isVisible: false,
    opacity: 0,
    isFadingIn: false,
    isFadingOut: false,
    isAnimating: false,
    previousIndex: null,
    animationTrigger: 0,
  });
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);
  const [showChords, setShowChords] = useState(true);
  const [transpose, setTranspose] = useState(0);

  // 使用動畫 Hook
  const animation = useLyricAnimation(
    state.currentIndex,
    style.animation,
    (newIndex) => {
      // 動畫完成回調
      setState(prev => ({ ...prev, isAnimating: false, previousIndex: null }));
    }
  );
```

**Step 3: 更新歌詞渲染邏輯**

替換現有的歌詞顯示部分（大約在第 137-167 行）：

```typescript
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
      <div className="flex flex-col items-center justify-center gap-12 relative" style={{ minHeight: '300px' }}>
        {/* Previous lyric (exiting) */}
        {animation.previousIndex !== null && animation.isExiting && lyrics[animation.previousIndex] && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: animation.exitOpacity,
              transform: animation.exitTransform,
              transition: `all ${style.animation.duration}ms ${style.animation.easing}`,
              pointerEvents: 'none',
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <div style={{ ...containerStyle, opacity: animation.exitOpacity }}>
                {parseChordsFromLyric(lyrics[animation.previousIndex].text).text}
              </div>
            </div>
          </div>
        )}

        {/* Main lyric with chords */}
        <div className="flex flex-col items-center gap-4">
          {/* Chords display */}
          {showChords && currentChords.length > 0 && mode === 'stage' && !animation.isExiting && (
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
          <div
            style={{
              ...containerStyle,
              opacity: state.isVisible ? (animation.isEntering ? animation.enterOpacity : state.opacity) : 0,
              transform: animation.enterTransform,
              transition: animation.isEntering || animation.isExiting
                ? `all ${style.animation.duration}ms ${style.animation.easing}`
                : `opacity ${style.fadeDuration}ms ease-in-out`,
            }}
          >
            {currentLyric && (
              <div style={textStyle}>
                {currentParsed.text || currentLyric.text}
              </div>
            )}
          </div>
        </div>

        {/* Next lyric preview (stage mode only) */}
        {mode === 'stage' && nextLyric && !animation.isAnimating && (
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
```

**Step 4: 執行編譯驗證**

Run: `bun run build`
Expected: 編譯成功

**Step 5: Commit**

```bash
git add apps/display/components/LyricDisplay.tsx
git commit -m "feat(display): integrate lyric animation transitions"
```

---

### Task 4: 建立動畫設定組件 (apps/controller/components/AnimationSettings.tsx)

**Files:**
- Create: `apps/controller/components/AnimationSettings.tsx`

**Step 1: 創建動畫設定組件**

```typescript
'use client';

import { DESIGN_TOKENS } from 'shared';
import type { AnimationConfig, AnimationType, RapidSwitchMode } from 'shared';

interface AnimationSettingsProps {
  config: AnimationConfig;
  onChange: (config: Partial<AnimationConfig>) => void;
}

const ANIMATION_TYPES: { value: AnimationType; label: string; description: string }[] = [
  { value: 'none', label: '無動畫', description: '立即切換' },
  { value: 'fade-out-in', label: '淡出淡入', description: '先淡出再淡入' },
  { value: 'crossfade', label: '交錯淡入淡出', description: '同時淡入淡出' },
  { value: 'slide', label: '滑入滑出', description: '左右滑動效果' },
  { value: 'scale', label: '縮放效果', description: '放大縮小動畫' },
];

const RAPID_SWITCH_MODES: { value: RapidSwitchMode; label: string; description: string }[] = [
  { value: 'immediate', label: '立即切換', description: '取消當前動畫，立即顯示' },
  { value: 'queued', label: '排隊播放', description: '等待動畫完成後播放' },
  { value: 'skip', label: '跳過中間', description: '直接跳到目標歌詞' },
];

const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
];

export function AnimationSettings({ config, onChange }: AnimationSettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 啟用動畫開關 */}
      <div className="flex items-center justify-between">
        <div>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.sm,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              color: DESIGN_TOKENS.colors.text.primary,
            }}
          >
            啟用歌詞切換動畫
          </p>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
            }}
          >
            切換下一句時播放過渡效果
          </p>
        </div>
        <button
          onClick={() => onChange({ enabled: !config.enabled })}
          className={`w-12 h-6 rounded-full transition-all ${
            config.enabled ? 'bg-blue-500' : 'bg-gray-600'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full transition-all ${
              config.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {config.enabled && (
        <>
          {/* 動畫類型選擇 */}
          <div>
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize.xs,
                fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.text.secondary,
                marginBottom: '8px',
              }}
            >
              動畫類型
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ANIMATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => onChange({ type: type.value })}
                  className={`p-3 rounded-lg text-left transition-all ${
                    config.type === type.value
                      ? 'bg-blue-500/20 border-2 border-blue-500'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <p
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize.sm,
                      fontWeight: DESIGN_TOKENS.fontWeight.medium,
                      color: config.type === type.value
                        ? DESIGN_TOKENS.colors.text.primary
                        : DESIGN_TOKENS.colors.text.secondary,
                    }}
                  >
                    {type.label}
                  </p>
                  <p
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize.xs,
                      color: DESIGN_TOKENS.colors.text.tertiary,
                      marginTop: '2px',
                    }}
                  >
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 動畫速度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.xs,
                  fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                  color: DESIGN_TOKENS.colors.text.secondary,
                }}
              >
                動畫速度
              </p>
              <span
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.xs,
                  color: DESIGN_TOKENS.colors.text.tertiary,
                }}
              >
                {config.duration}ms
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="50"
              value={config.duration}
              onChange={(e) => onChange({ duration: parseInt(e.target.value) })}
              className="w-full"
              style={{
                accentColor: DESIGN_TOKENS.colors.accent,
              }}
            />
            <div className="flex justify-between mt-1">
              {['200ms', '500ms', '1000ms'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onChange({ duration: parseInt(preset) })}
                  className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10"
                  style={{ color: DESIGN_TOKENS.colors.text.tertiary }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 緩動函數 */}
          <div>
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize.xs,
                fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.text.secondary,
                marginBottom: '8px',
              }}
            >
              緩動效果
            </p>
            <div className="flex flex-wrap gap-2">
              {EASING_OPTIONS.map((easing) => (
                <button
                  key={easing.value}
                  onClick={() => onChange({ easing: easing.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    config.easing === easing.value
                      ? 'bg-blue-500'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  style={{
                    color: config.easing === easing.value
                      ? 'white'
                      : DESIGN_TOKENS.colors.text.secondary,
                  }}
                >
                  {easing.label}
                </button>
              ))}
            </div>
          </div>

          {/* 快速切換模式 */}
          <div>
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize.xs,
                fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.text.secondary,
                marginBottom: '8px',
              }}
            >
              快速切換行為
            </p>
            <div className="space-y-2">
              {RAPID_SWITCH_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => onChange({ rapidSwitchMode: mode.value })}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    config.rapidSwitchMode === mode.value
                      ? 'bg-blue-500/20 border border-blue-500'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <p
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize.sm,
                      fontWeight: DESIGN_TOKENS.fontWeight.medium,
                      color: DESIGN_TOKENS.colors.text.secondary,
                    }}
                  >
                    {mode.label}
                  </p>
                  <p
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize.xs,
                      color: DESIGN_TOKENS.colors.text.tertiary,
                      marginTop: '2px',
                    }}
                  >
                    {mode.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 2: 執行編譯驗證**

Run: `bun run build`
Expected: 編譯成功

**Step 3: Commit**

```bash
git add apps/controller/components/AnimationSettings.tsx
git commit -m "feat(controller): add AnimationSettings component"
```

---

### Task 5: 整合動畫設定到 StylePanel

**Files:**
- Modify: `apps/controller/components/StylePanel.tsx`

**Step 1: 導入 AnimationSettings**

在文件頂部添加：

```typescript
import { AnimationSettings } from '@/components/AnimationSettings';
```

**Step 2: 在 StylePanelProps 中添加 animation prop**

修改 props interface：

```typescript
interface StylePanelProps {
  style: StyleConfig;
  currentThemeId: string;
  onStyleChange: (updates: Partial<StyleConfig>) => void;
  onThemeSelect: (themeId: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  transpose: number;
  onTransposeChange: (value: number) => void;
  showChords: boolean;
  onToggleChords: () => void;
}
```

**Step 3: 在面板中添加動畫設定區塊**

找到合適位置（在字體設定之後），添加：

```typescript
{/* Animation Settings */}
<div className="p-4 rounded-lg" style={{ backgroundColor: DESIGN_TOKENS.colors.panel }}>
  <h3
    style={{
      fontSize: DESIGN_TOKENS.fontSize.md,
      fontWeight: DESIGN_TOKENS.fontWeight.semibold,
      color: DESIGN_TOKENS.colors.text.primary,
      marginBottom: '12px',
    }}
  >
    動畫設定
  </h3>
  <AnimationSettings
    config={style.animation}
    onChange={(updates) => onStyleChange({ animation: { ...style.animation, ...updates } })}
  />
</div>
```

**Step 4: 執行編譯驗證**

Run: `bun run build`
Expected: 編譯成功

**Step 5: Commit**

```bash
git add apps/controller/components/StylePanel.tsx
git commit -m "feat(controller): integrate animation settings into StylePanel"
```

---

### Task 6: 更新控制端發送動畫狀態

**Files:**
- Modify: `apps/controller/app/session/[code]/page.tsx`

**Step 1: 更新 broadcastDisplayState 函數**

修改現有的 broadcastDisplayState 函數以包含動畫觸發：

```typescript
  const broadcastDisplayState = (newState: Partial<DisplayState>) => {
    const updated = {
      ...displayState,
      ...newState,
      // 每次切換歌詞時增加觸發計數器
      animationTrigger: newState.currentIndex !== undefined && newState.currentIndex !== displayState.currentIndex
        ? (displayState.animationTrigger || 0) + 1
        : displayState.animationTrigger || 0,
    };
    setDisplayState(updated);
    if (session) {
      supabase.channel(`session:${session.id}`).send({
        type: 'broadcast',
        event: 'display_state',
        payload: updated,
      });
    }
  };
```

**Step 2: 更新 handleSelectLyric 以觸發動畫**

```typescript
  const handleSelectLyric = (index: number) => {
    const prevIndex = displayState.currentIndex;
    broadcastDisplayState({
      currentIndex: index,
      isVisible: true,
      isAnimating: true,
      previousIndex: prevIndex,
    });
  };
```

**Step 3: 初始化 animationTrigger**

在 state 初始化中添加：

```typescript
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
```

**Step 4: 執行編譯驗證**

Run: `bun run build`
Expected: 編譯成功

**Step 5: Commit**

```bash
git add apps/controller/app/session/[code]/page.tsx
git commit -m "feat(controller): update display state broadcasting for animation support"
```

---

### Task 7: 測試與驗證

**Step 1: 啟動開發伺服器**

Run: `bun run dev`

**Step 2: 測試流程**

1. 開啟控制端和顯示端
2. 連接到同一個 session
3. 匯入一些歌詞（使用 AI 搜尋或手動輸入）
4. 進入樣式面板，找到「動畫設定」區塊
5. 測試每種動畫類型：
   - 切換「啟用歌詞切換動畫」開關
   - 選擇不同的動畫類型
   - 調整動畫速度
   - 測試下一句/上一句按鈕
6. 驗證動畫在顯示端正確播放
7. 測試快速連續切換的行為

**Step 3: 跨瀏覽器測試**

- Chrome
- Safari
- Firefox

**Step 4: Commit 最終變更**

```bash
git add .
git commit -m "feat(lyric-animation): complete lyric animation feature with all transition types"
```

---

## 驗收標準

- [ ] 顯示端歌詞切換時有平滑的動畫效果
- [ ] 四種動畫類型都能正常工作（淡出淡入、交錯、滑動、縮放）
- [ ] 控制端可以調整動畫設定（啟用/停用、類型、速度、緩動、快速切換模式）
- [ ] 快速切換行為符合設計
- [ ] 動畫不影響現有的顯示/隱藏功能
- [ ] 跨瀏覽器相容
