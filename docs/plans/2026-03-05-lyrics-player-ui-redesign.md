# 歌词播放器 UI 重新设计实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 根据Pencil设计重新构建歌词播放器UI，添加主题系统、和弦显示、移调、计时器、舞台/观众模式等功能

**架构:**
1. 更新共享类型定义以支持新功能
2. 创建模块化UI组件（Sidebar、StylePanel、LyricPreview等）
3. 实现主题预设系统和自定义主题
4. 扩展Display支持舞台/观众双模式
5. 所有状态通过Supabase Realtime同步

**技术栈:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Realtime
- Lucide Icons

---

## 任务列表

### 任务 1: 扩展共享类型定义

**文件:**
- 修改: `packages/shared/src/types/index.ts`

**Step 1: 添加新类型定义**

在现有类型后添加：

```typescript
// ============ 主题系统 ============

export interface ThemePreset {
  id: string;
  name: string;
  displayName: string;
  style: StyleConfig;
  previewColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'worship-warm',
    name: 'Worship Warm',
    displayName: '敬拜暖色',
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 48,
      fontWeight: 600,
      color: '#FCD34D',
      textAlign: 'center',
      textShadow: { enabled: true, color: '#000000', blur: 8, offsetX: 2, offsetY: 2 },
      textStroke: { enabled: false, color: '#000000', width: 2 },
      background: { type: 'solid', value: '#1A1A2E' },
      fadeDuration: 500,
      padding: 40,
      lineHeight: 1.5,
    },
    previewColor: '#FCD34D',
  },
  {
    id: 'concert-cool',
    name: 'Concert Cool',
    displayName: '演唱会冷色',
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 52,
      fontWeight: 700,
      color: '#3B82F6',
      textAlign: 'center',
      textShadow: { enabled: true, color: '#000000', blur: 12, offsetX: 0, offsetY: 0 },
      textStroke: { enabled: false, color: '#000000', width: 2 },
      background: { type: 'gradient', value: 'radial-gradient(circle, #1A1A2E 0%, #000000 100%)' },
      fadeDuration: 500,
      padding: 40,
      lineHeight: 1.5,
    },
    previewColor: '#3B82F6',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    displayName: '极简白',
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 48,
      fontWeight: 500,
      color: '#FFFFFF',
      textAlign: 'center',
      textShadow: { enabled: false, color: '#000000', blur: 0, offsetX: 0, offsetY: 0 },
      textStroke: { enabled: true, color: '#000000', width: 1 },
      background: { type: 'solid', value: '#000000' },
      fadeDuration: 300,
      padding: 40,
      lineHeight: 1.4,
    },
    previewColor: '#FFFFFF',
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    displayName: '高对比度',
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 56,
      fontWeight: 700,
      color: '#FFFF00',
      textAlign: 'center',
      textShadow: { enabled: true, color: '#000000', blur: 4, offsetX: 3, offsetY: 3 },
      textStroke: { enabled: true, color: '#000000', width: 2 },
      background: { type: 'solid', value: '#000000' },
      fadeDuration: 500,
      padding: 40,
      lineHeight: 1.5,
    },
    previewColor: '#FFFF00',
  },
  {
    id: 'pastel-soft',
    name: 'Pastel Soft',
    displayName: '柔和粉彩',
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 46,
      fontWeight: 500,
      color: '#FBCFE8',
      textAlign: 'center',
      textShadow: { enabled: true, color: '#831843', blur: 6, offsetX: 1, offsetY: 1 },
      textStroke: { enabled: false, color: '#000000', width: 2 },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      fadeDuration: 600,
      padding: 40,
      lineHeight: 1.5,
    },
    previewColor: '#FBCFE8',
  },
  {
    id: 'neon-vibrant',
    name: 'Neon Vibrant',
    displayName: '霓虹活力',
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 50,
      fontWeight: 700,
      color: '#00FF88',
      textAlign: 'center',
      textShadow: { enabled: true, color: '#00FF88', blur: 20, offsetX: 0, offsetY: 0 },
      textStroke: { enabled: false, color: '#000000', width: 2 },
      background: { type: 'solid', value: '#0A0A0F' },
      fadeDuration: 400,
      padding: 40,
      lineHeight: 1.5,
    },
    previewColor: '#00FF88',
  },
];

// ============ 和弦系统 ============

export interface Chord {
  name: string;       // e.g., "C", "Am", "G7"
  position: number;   // character position in lyric text
}

export interface LyricWithChords extends Lyric {
  chords?: Chord[];
}

// ============ 移调 ============

export interface TransposeState {
  semitones: number;  // -11 to 11, 0 = original key
}

// ============ 计时器 ============

export interface TimerState {
  isEnabled: boolean;
  duration: number;   // seconds
  remaining: number;  // seconds
  isRunning: boolean;
}

// ============ 显示模式 ============

export type DisplayMode = 'audience' | 'stage';

export interface ExtendedDisplayState extends DisplayState {
  mode: DisplayMode;
  showChords: boolean;
  chords?: Chord[];
  transpose?: TransposeState;
  timer?: TimerState;
}

// ============ 连接状态 ============

export interface ConnectionInfo {
  deviceCount: number;
  isConnected: boolean;
}

// ============ 播放列表 ============

export interface PlaylistItem {
  id: string;
  sessionId: string;
  songName: string;
  artist?: string;
  orderIndex: number;
  lyrics: LyricWithChords[];
}

// ============ 颜色类别 ============

export interface ColorCategory {
  name: string;
  colors: string[];
}

export const COLOR_CATEGORIES: ColorCategory[] = [
  { name: 'Classic', colors: ['#FFFFFF', '#FCD34D', '#22C55E', '#3B82F6', '#EC4899', '#F97316'] },
  { name: 'Warm', colors: ['#FCD34D', '#FBBF24', '#F59E0B', '#F97316', '#EF4444', '#EC4899'] },
  { name: 'Cool', colors: ['#3B82F6', '#60A5FA', '#22C55E', '#10B981', '#06B6D4', '#8B5CF6'] },
  { name: 'Pastel', colors: ['#FBCFE8', '#F9A8D4', '#C4B5FD', '#A5B4FC', '#A7F3D0', '#FDE68A'] },
  { name: 'Neon', colors: ['#00FF88', '#00FFFF', '#FF00FF', '#FFFF00', '#FF6B6B', '#7C3AED'] },
];
```

**Step 2: 导出类型**

确保文件末尾导出所有新类型。

**Step 3: 提交**

```bash
git add packages/shared/src/types/index.ts
git commit -m "feat(types): add theme, chord, transpose, timer, and display mode types"
```

---

### 任务 2: 创建 UI 设计令牌（Design Tokens）

**文件:**
- 创建: `packages/shared/src/tokens/index.ts`

**Step 1: 创建设计令牌文件**

```typescript
// 设计令牌 - 与Pencil设计一致的颜色和尺寸

export const DESIGN_TOKENS = {
  colors: {
    // 背景色
    background: '#0A0A0F',
    panel: '#111116',
    panelBorder: '#1F1F2E',
    input: '#1A1A24',

    // 强调色
    accent: '#E42313',      // 红色 - 当前播放/选中
    accentHover: '#FF2D2D',

    // 功能色
    feature: '#7C3AED',     // 紫色 - AI/和弦/特色功能
    featureHover: '#8B5CF6',

    // 状态色
    success: '#22C55E',
    warning: '#FCD34D',
    error: '#EF4444',

    // 文字色
    text: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF',
      tertiary: '#6B7280',
      disabled: '#3F3F5A',
    },

    // 分隔线
    border: '#1F1F2E',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },

  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '13px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '42px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // 布局尺寸
  layout: {
    sidebarWidth: '280px',
    stylePanelWidth: '320px',
    headerHeight: '64px',
    mobileWidth: '390px',
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
```

**Step 2: 导出类型**

在 `packages/shared/src/index.ts` 中添加：

```typescript
export * from './tokens';
```

**Step 3: 提交**

```bash
git add packages/shared/src/tokens/index.ts packages/shared/src/index.ts
git commit -m "feat(tokens): add design tokens matching Pencil design"
```

---

### 任务 3: 创建 Sidebar 组件

**文件:**
- 创建: `apps/controller/components/Sidebar.tsx`

**Step 1: 创建 Sidebar 组件**

```tsx
'use client';

import { Lyric } from 'shared';
import { DESIGN_TOKENS } from 'shared';
import { Copy, Music, Sparkles, Plus, Play } from 'lucide-react';

interface SidebarProps {
  sessionCode: string;
  isConnected: boolean;
  deviceCount: number;
  lyrics: Lyric[];
  currentIndex: number | null;
  onShowAISearch: () => void;
  onAddSong: () => void;
  onSelectLyric: (index: number) => void;
}

export default function Sidebar({
  sessionCode,
  isConnected,
  deviceCount,
  lyrics,
  currentIndex,
  onShowAISearch,
  onAddSong,
  onSelectLyric,
}: SidebarProps) {
  const copyCode = () => {
    navigator.clipboard.writeText(sessionCode);
  };

  return (
    <div
      className="flex flex-col"
      style={{
        width: DESIGN_TOKENS.layout.sidebarWidth,
        backgroundColor: DESIGN_TOKENS.colors.panel,
        borderRight: `1px solid ${DESIGN_TOKENS.colors.panelBorder}`,
      }}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <p
          style={{
            fontSize: DESIGN_TOKENS.fontSize.xs,
            color: DESIGN_TOKENS.colors.text.tertiary,
            fontWeight: DESIGN_TOKENS.fontWeight.medium,
            letterSpacing: '1px',
          }}
        >
          SESSION CODE
        </p>
        <div
          className="flex items-center gap-3 mt-2 p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
          onClick={copyCode}
        >
          <span
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xl,
              fontWeight: DESIGN_TOKENS.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.text.primary,
            }}
          >
            {sessionCode}
          </span>
          <Copy size={18} color={DESIGN_TOKENS.colors.text.tertiary} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? DESIGN_TOKENS.colors.success : DESIGN_TOKENS.colors.error,
            }}
          />
          <span
            style={{
              fontSize: DESIGN_TOKENS.fontSize.sm,
              color: DESIGN_TOKENS.colors.text.tertiary,
            }}
          >
            {deviceCount} devices connected
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

      {/* Playlist Header */}
      <div className="flex items-center justify-between p-5 pb-2">
        <span
          style={{
            fontSize: DESIGN_TOKENS.fontSize.md,
            fontWeight: DESIGN_TOKENS.fontWeight.semibold,
            color: DESIGN_TOKENS.colors.text.primary,
          }}
        >
          Set List
        </span>
        <button
          className="p-2 rounded-lg hover:opacity-80 transition-opacity"
          style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
          onClick={onAddSong}
        >
          <Plus size={16} color={DESIGN_TOKENS.colors.text.tertiary} />
        </button>
      </div>

      {/* Playlist Items */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {lyrics.map((lyric, index) => {
          const isActive = currentIndex === index;
          return (
            <button
              key={lyric.id}
              onClick={() => onSelectLyric(index)}
              className="flex items-center gap-3 w-full p-3 rounded-lg transition-all mb-1"
              style={{
                backgroundColor: isActive ? DESIGN_TOKENS.colors.accent : 'transparent',
              }}
            >
              <span
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.md,
                  fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                  color: isActive ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.tertiary,
                  opacity: isActive ? 1 : 0.5,
                  minWidth: '20px',
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 text-left">
                <p
                  style={{
                    fontSize: DESIGN_TOKENS.fontSize.sm,
                    fontWeight: DESIGN_TOKENS.fontWeight.medium,
                    color: isActive ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.secondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lyric.text.slice(0, 30)}
                  {lyric.text.length > 30 ? '...' : ''}
                </p>
              </div>
              {isActive && <Play size={16} color={DESIGN_TOKENS.colors.text.primary} />}
            </button>
          );
        })}
      </div>

      {/* AI Search Button */}
      <button
        className="m-4 p-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90"
        style={{
          backgroundColor: DESIGN_TOKENS.colors.feature,
        }}
        onClick={onShowAISearch}
      >
        <Sparkles size={18} color={DESIGN_TOKENS.colors.text.primary} />
        <span
          style={{
            fontSize: DESIGN_TOKENS.fontSize.md,
            fontWeight: DESIGN_TOKENS.fontWeight.medium,
            color: DESIGN_TOKENS.colors.text.primary,
          }}
        >
          AI 搜歌
        </span>
      </button>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add apps/controller/components/Sidebar.tsx
git commit -m "feat(ui): create Sidebar component with session info and playlist"
```

---

### 任务 4: 创建 StylePanel 组件

**文件:**
- 创建: `apps/controller/components/StylePanel.tsx`

**Step 1: 创建 StylePanel 组件**

```tsx
'use client';

import { StyleConfig, ThemePreset, THEME_PRESETS, COLOR_CATEGORIES, DESIGN_TOKENS } from 'shared';
import { Edit3, Minus, Plus } from 'lucide-react';

interface StylePanelProps {
  style: StyleConfig;
  currentThemeId: string;
  onStyleChange: (style: Partial<StyleConfig>) => void;
  onThemeSelect: (themeId: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  transpose: number;
  onTransposeChange: (semitones: number) => void;
  showChords: boolean;
  onToggleChords: () => void;
}

export default function StylePanel({
  style,
  currentThemeId,
  onStyleChange,
  onThemeSelect,
  isEditing,
  onToggleEdit,
  transpose,
  onTransposeChange,
  showChords,
  onToggleChords,
}: StylePanelProps) {
  return (
    <div
      className="flex flex-col"
      style={{
        width: DESIGN_TOKENS.layout.stylePanelWidth,
        backgroundColor: DESIGN_TOKENS.colors.panel,
        borderLeft: `1px solid ${DESIGN_TOKENS.colors.panelBorder}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <span
          style={{
            fontSize: DESIGN_TOKENS.fontSize.lg,
            fontWeight: DESIGN_TOKENS.fontWeight.semibold,
            color: DESIGN_TOKENS.colors.text.primary,
          }}
        >
          Display Settings
        </span>
        <button
          className="p-2 rounded-lg"
          style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
          onClick={onToggleEdit}
        >
          <Edit3 size={16} color={DESIGN_TOKENS.colors.text.tertiary} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Theme Presets */}
        <section>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              letterSpacing: '1px',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            THEME PRESETS
          </p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_PRESETS.slice(0, 6).map((theme) => (
              <button
                key={theme.id}
                onClick={() => onThemeSelect(theme.id)}
                className="flex flex-col items-center justify-center p-2 rounded-lg transition-all hover:opacity-80"
                style={{
                  backgroundColor:
                    currentThemeId === theme.id ? DESIGN_TOKENS.colors.background : DESIGN_TOKENS.colors.input,
                  border: currentThemeId === theme.id ? `2px solid ${DESIGN_TOKENS.colors.accent}` : 'none',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full mb-1"
                  style={{ backgroundColor: theme.previewColor }}
                />
                <span
                  style={{
                    fontSize: DESIGN_TOKENS.fontSize.xs,
                    color: DESIGN_TOKENS.colors.text.secondary,
                  }}
                >
                  {theme.displayName}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Text Color */}
        <section>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              letterSpacing: '1px',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            TEXT COLOR
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_CATEGORIES[0].colors.map((color) => (
              <button
                key={color}
                onClick={() => onStyleChange({ color })}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  border: style.color === color ? `2px solid ${DESIGN_TOKENS.colors.accent}` : 'none',
                }}
              />
            ))}
            <button
              className="w-7 h-7 rounded border border-gray-600 flex items-center justify-center"
              style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
            >
              <span style={{ fontSize: '10px', color: DESIGN_TOKENS.colors.text.tertiary }}>+</span>
            </button>
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Font Size */}
        <section>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              letterSpacing: '1px',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            FONT SIZE
          </p>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '12px', color: DESIGN_TOKENS.colors.text.tertiary }}>A</span>
            <input
              type="range"
              min="24"
              max="96"
              value={style.fontSize}
              onChange={(e) => onStyleChange({ fontSize: Number(e.target.value) })}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: DESIGN_TOKENS.colors.input,
                accentColor: DESIGN_TOKENS.colors.accent,
              }}
            />
            <span style={{ fontSize: '18px', color: DESIGN_TOKENS.colors.text.tertiary }}>A</span>
            <span
              style={{
                fontSize: DESIGN_TOKENS.fontSize.base,
                fontWeight: DESIGN_TOKENS.fontWeight.medium,
                color: DESIGN_TOKENS.colors.text.primary,
                minWidth: '50px',
                textAlign: 'right',
              }}
            >
              {style.fontSize}px
            </span>
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Background */}
        <section>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              letterSpacing: '1px',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            BACKGROUND
          </p>
          <div className="flex gap-2">
            {['#000000', '#1A1A2E', '#16213E', '#0F3460', '#2D1B3D'].map((bg) => (
              <button
                key={bg}
                onClick={() => onStyleChange({ background: { type: 'solid', value: bg } })}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: bg,
                  border: style.background.value === bg ? `2px solid ${DESIGN_TOKENS.colors.accent}` : 'none',
                }}
              />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Transpose */}
        <section>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              letterSpacing: '1px',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            TRANSPOSE KEY
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTransposeChange(Math.max(-11, transpose - 1))}
              className="flex-1 py-3 rounded-lg transition-all hover:opacity-80"
              style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
            >
              <Minus size={16} color={DESIGN_TOKENS.colors.text.secondary} />
            </button>
            <div
              className="flex-1 py-3 rounded-lg text-center"
              style={{ backgroundColor: DESIGN_TOKENS.colors.background }}
            >
              <span
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.md,
                  fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                  color: DESIGN_TOKENS.colors.text.primary,
                }}
              >
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
            </div>
            <button
              onClick={() => onTransposeChange(Math.min(11, transpose + 1))}
              className="flex-1 py-3 rounded-lg transition-all hover:opacity-80"
              style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
            >
              <Plus size={16} color={DESIGN_TOKENS.colors.text.secondary} />
            </button>
          </div>
        </section>
      </div>

      {/* Footer Info */}
      <div className="p-6 pt-0">
        <div className="flex items-center justify-between" style={{ fontSize: DESIGN_TOKENS.fontSize.xs }}>
          <span style={{ color: DESIGN_TOKENS.colors.text.disabled }}>Lyrics Player v2.0</span>
          <div className="flex items-center gap-1">
            <div
              style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: DESIGN_TOKENS.colors.success }}
            />
            <span style={{ color: DESIGN_TOKENS.colors.text.disabled }}>Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add apps/controller/components/StylePanel.tsx
git commit -m "feat(ui): create StylePanel component with theme, color, and transpose controls"
```

---

### 任务 5: 创建 LyricPreview 组件

**文件:**
- 创建: `apps/controller/components/LyricPreview.tsx`

**Step 1: 创建 LyricPreview 组件**

```tsx
'use client';

import { Lyric } from 'shared';
import { DESIGN_TOKENS } from 'shared';
import { Clock, Eye, EyeOff, Music, Music2 } from 'lucide-react';

interface LyricPreviewProps {
  lyrics: Lyric[];
  currentIndex: number | null;
  displayMode: 'audience' | 'stage';
  onDisplayModeChange: (mode: 'audience' | 'stage') => void;
  showChords: boolean;
  onToggleChords: () => void;
  timerDisplay: string;
  onPrevious: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  isPlaying: boolean;
}

export default function LyricPreview({
  lyrics,
  currentIndex,
  displayMode,
  onDisplayModeChange,
  showChords,
  onToggleChords,
  timerDisplay,
  onPrevious,
  onNext,
  onPlayPause,
  isPlaying,
}: LyricPreviewProps) {
  const currentLyric = currentIndex !== null ? lyrics[currentIndex] : null;
  const nextLyric = currentIndex !== null && currentIndex < lyrics.length - 1 ? lyrics[currentIndex + 1] : null;

  const hasPrevious = currentIndex !== null && currentIndex > 0;
  const hasNext = currentIndex !== null && currentIndex < lyrics.length - 1;

  return (
    <div className="flex-1 flex flex-col p-6 gap-4" style={{ backgroundColor: DESIGN_TOKENS.colors.background }}>
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        {/* Timer */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: DESIGN_TOKENS.colors.panel }}
        >
          <Clock size={20} color={DESIGN_TOKENS.colors.accent} />
          <span
            style={{
              fontSize: DESIGN_TOKENS.fontSize['2xl'],
              fontWeight: DESIGN_TOKENS.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.text.primary,
            }}
          >
            {timerDisplay}
          </span>
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
      </div>

      {/* Lyric Preview Card */}
      <div
        className="flex-1 flex flex-col items-center justify-center rounded-2xl p-12 gap-8"
        style={{ backgroundColor: DESIGN_TOKENS.colors.panel }}
      >
        {currentLyric ? (
          <>
            {/* Current Lyric */}
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize['4xl'],
                fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.text.primary,
                textAlign: 'center',
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

            {/* Chord Display (placeholder for now) */}
            {showChords && displayMode === 'stage' && (
              <div className="flex items-center justify-center gap-8">
                {['D', 'A', 'Bm', 'G'].map((chord) => (
                  <span
                    key={chord}
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize['3xl'],
                      fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                      color: DESIGN_TOKENS.colors.feature,
                    }}
                  >
                    {chord}
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
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="w-14 h-14 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
          >
            <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 20L9 12l10-8v16zM6 5v14" />
            </svg>
          </button>

          <button
            onClick={onPlayPause}
            className="w-18 h-18 rounded-2xl flex items-center justify-center transition-all"
            style={{ backgroundColor: DESIGN_TOKENS.colors.accent }}
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
```

**Step 2: 提交**

```bash
git add apps/controller/components/LyricPreview.tsx
git commit -m "feat(ui): create LyricPreview component with timer, mode toggle, and controls"
```

---

### 任务 6: 更新共享包导出

**文件:**
- 修改: `packages/shared/src/index.ts`

**Step 1: 更新导出**

确保以下导出存在：

```typescript
export * from './types';
export * from './tokens';
export * from './supabase';
```

**Step 2: 提交**

```bash
git add packages/shared/src/index.ts
git commit -m "feat(shared): update exports to include tokens"
```

---

### 任务 7: 更新主控制器页面

**文件:**
- 修改: `apps/controller/app/session/[code]/page.tsx`

**Step 1: 替换整个页面内容**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseClient, Lyric, Session, DisplayState, StyleConfig, DEFAULT_STYLE, THEME_PRESETS } from 'shared';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Sidebar from '@/components/Sidebar';
import StylePanel from '@/components/StylePanel';
import LyricPreview from '@/components/LyricPreview';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  // State
  const [session, setSession] = useState<Session | null>(null);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [displayState, setDisplayState] = useState<DisplayState>({
    currentIndex: null,
    isVisible: true,
    opacity: 1,
    isFadingIn: false,
    isFadingOut: false,
  });
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(DEFAULT_STYLE);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [supabase] = useState(() => createSupabaseClient());

  // UI State
  const [showAISearch, setShowAISearch] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState('worship-warm');
  const [displayMode, setDisplayMode] = useState<'audience' | 'stage'>('stage');
  const [showChords, setShowChords] = useState(true);
  const [transpose, setTranspose] = useState(0);
  const [timerDisplay, setTimerDisplay] = useState('02:34');
  const [isPlaying, setIsPlaying] = useState(false);

  // Load session and lyrics
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('*')
          .eq('code', code)
          .single();

        if (sessionData) {
          setSession(sessionData);

          const { data: lyricsData } = await supabase
            .from('lyrics')
            .select('*')
            .eq('session_id', sessionData.id)
            .order('order_index');

          if (lyricsData) {
            setLyrics(lyricsData);
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading session:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [code, supabase, router]);

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`session:${code}`)
      .on('broadcast', { event: 'display_state' }, (payload) => {
        setDisplayState(payload as DisplayState);
      })
      .on('broadcast', { event: 'style' }, (payload) => {
        setStyleConfig(payload as StyleConfig);
      })
      .on('broadcast', { event: 'presence' }, () => {
        // Handle presence updates
        setIsConnected(true);
        setDeviceCount((prev) => prev + 1);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setDeviceCount(1);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, supabase]);

  // Broadcast display state changes
  const broadcastDisplayState = (newState: Partial<DisplayState>) => {
    const updated = { ...displayState, ...newState };
    setDisplayState(updated);
    supabase.channel(`session:${code}`).send('broadcast', { event: 'display_state', payload: updated });
  };

  // Broadcast style changes
  const broadcastStyle = (newStyle: Partial<StyleConfig>) => {
    const updated = { ...styleConfig, ...newStyle };
    setStyleConfig(updated);
    supabase.channel(`session:${code}`).send('broadcast', { event: 'style', payload: updated });
  };

  const handleSelectLyric = (index: number) => {
    broadcastDisplayState({ currentIndex: index, isVisible: true });
  };

  const handleStyleChange = (updates: Partial<StyleConfig>) => {
    broadcastStyle(updates);
  };

  const handleThemeSelect = (themeId: string) => {
    const theme = THEME_PRESETS.find((t) => t.id === themeId);
    if (theme) {
      setCurrentThemeId(themeId);
      broadcastStyle(theme.style);
    }
  };

  const handlePrevious = () => {
    if (displayState.currentIndex !== null && displayState.currentIndex > 0) {
      broadcastDisplayState({ currentIndex: displayState.currentIndex - 1 });
    }
  };

  const handleNext = () => {
    if (displayState.currentIndex !== null && displayState.currentIndex < lyrics.length - 1) {
      broadcastDisplayState({ currentIndex: displayState.currentIndex + 1 });
    }
  };

  const handleToggleVisibility = () => {
    broadcastDisplayState({ isVisible: !displayState.isVisible });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="text-white">載入中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Sidebar */}
      <Sidebar
        sessionCode={code}
        isConnected={isConnected}
        deviceCount={deviceCount}
        lyrics={lyrics}
        currentIndex={displayState.currentIndex}
        onShowAISearch={() => setShowAISearch(true)}
        onAddSong={() => {/* TODO */}}
        onSelectLyric={handleSelectLyric}
      />

      {/* Main Content */}
      <LyricPreview
        lyrics={lyrics}
        currentIndex={displayState.currentIndex}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        showChords={showChords}
        onToggleChords={() => setShowChords(!showChords)}
        timerDisplay={timerDisplay}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        isPlaying={isPlaying}
      />

      {/* Style Panel */}
      <StylePanel
        style={styleConfig}
        currentThemeId={currentThemeId}
        onStyleChange={handleStyleChange}
        onThemeSelect={handleThemeSelect}
        isEditing={false}
        onToggleEdit={() => {/* TODO */}}
        transpose={transpose}
        onTransposeChange={setTranspose}
        showChords={showChords}
        onToggleChords={() => setShowChords(!showChords)}
      />
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add apps/controller/app/session/[code]/page.tsx
git commit -m "feat(controller): update main page with new three-column layout"
```

---

### 任务 8: 创建 AISearchModal 组件

**文件:**
- 创建: `apps/controller/components/AISearchModal.tsx`

**Step 1: 创建 AI 搜歌弹窗组件**

```tsx
'use client';

import { useState } from 'react';
import { X, Search, Mic, Plus, Download } from 'lucide-react';
import { DESIGN_TOKENS } from 'shared';

interface SearchResult {
  songName: string;
  artist: string;
}

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSong: (song: SearchResult) => void;
}

export default function AISearchModal({ isOpen, onClose, onAddSong }: AISearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    // TODO: Implement actual AI search
    setTimeout(() => {
      setResults([
        { songName: '聖哉聖哉聖哉', artist: 'Traditional' },
        { songName: '奇妙恩典', artist: 'John Newton' },
      ]);
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-[480px] rounded-3xl overflow-hidden"
        style={{ backgroundColor: DESIGN_TOKENS.colors.panel, border: `1px solid ${DESIGN_TOKENS.colors.panelBorder}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2
            style={{
              fontSize: DESIGN_TOKENS.fontSize.lg,
              fontWeight: DESIGN_TOKENS.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.text.primary,
            }}
          >
            AI 搜歌
          </h2>
          <button onClick={onClose}>
            <X size={20} color={DESIGN_TOKENS.colors.text.tertiary} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Search Input */}
        <div className="p-6">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: DESIGN_TOKENS.colors.background }}
          >
            <Search size={20} color={DESIGN_TOKENS.colors.text.tertiary} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="輸入歌名或歌手..."
              className="flex-1 bg-transparent outline-none"
              style={{ color: DESIGN_TOKENS.colors.text.primary }}
            />
            <button className="p-2 rounded-lg hover:bg-gray-800">
              <Mic size={18} color={DESIGN_TOKENS.colors.feature} />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="px-6 pb-4 max-h-[400px] overflow-y-auto">
          {isSearching ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: DESIGN_TOKENS.fontSize.md,
                        fontWeight: DESIGN_TOKENS.fontWeight.medium,
                        color: DESIGN_TOKENS.colors.text.primary,
                      }}
                    >
                      {result.songName}
                    </p>
                    <p
                      style={{
                        fontSize: DESIGN_TOKENS.fontSize.sm,
                        color: DESIGN_TOKENS.colors.text.tertiary,
                      }}
                    >
                      {result.artist}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAddSong(result)}
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ backgroundColor: DESIGN_TOKENS.colors.accent }}
                    >
                      <Plus size={16} color={DESIGN_TOKENS.colors.text.primary} />
                    </button>
                    <button
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
                    >
                      <Download size={16} color={DESIGN_TOKENS.colors.text.tertiary} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-8">
              <p style={{ color: DESIGN_TOKENS.colors.text.tertiary }}>沒有找到結果</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{ color: DESIGN_TOKENS.colors.text.tertiary }}>輸入歌名開始搜尋</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderTop: `1px solid ${DESIGN_TOKENS.colors.panelBorder}` }}
        >
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: DESIGN_TOKENS.colors.input, color: DESIGN_TOKENS.colors.text.secondary }}
          >
            取消
          </button>
          <button
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: DESIGN_TOKENS.colors.accent, color: DESIGN_TOKENS.colors.text.primary }}
          >
            匯入選取歌曲
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add apps/controller/components/AISearchModal.tsx
git commit -m "feat(ui): create AISearchModal component with search and import"
```

---

### 任务 9: 将 AISearchModal 集成到主页面

**文件:**
- 修改: `apps/controller/app/session/[code]/page.tsx`

**Step 1: 导入并添加 AISearchModal**

在导入部分添加：

```tsx
import AISearchModal from '@/components/AISearchModal';
```

在 return 语句的底部、闭合的 </div> 之后添加：

```tsx
{/* AI Search Modal */}
<AISearchModal
  isOpen={showAISearch}
  onClose={() => setShowAISearch(false)}
  onAddSong={(song) => {
    console.log('Adding song:', song);
    setShowAISearch(false);
  }}
/>
```

**Step 2: 提交**

```bash
git add apps/controller/app/session/[code]/page.tsx
git commit -m "feat(controller): integrate AISearchModal"
```

---

### 任务 10: 更新 Display 页面支持舞台/观众模式

**文件:**
- 修改: `apps/display/components/LyricDisplay.tsx`

**Step 1: 添加显示模式支持**

更新组件以支持舞台/观众模式：

```tsx
'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient, DisplayState, StyleConfig, Lyric, DESIGN_TOKENS } from 'shared';

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
  const [style, setStyle] = useState<StyleConfig>({
    fontFamily: 'system-ui, sans-serif',
    fontSize: 48,
    fontWeight: 700,
    color: '#ffffff',
    textAlign: 'center',
    textShadow: { enabled: true, color: '#000000', blur: 8, offsetX: 2, offsetY: 2 },
    textStroke: { enabled: false, color: '#000000', width: 2 },
    background: { type: 'transparent' },
    fadeDuration: 500,
    padding: 40,
    lineHeight: 1.5,
  });

  useEffect(() => {
    const supabase = createSupabaseClient();

    const loadLyrics = async () => {
      const { data } = await supabase
        .from('lyrics')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index');

      if (data) setLyrics(data);
    };

    loadLyrics();

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('broadcast', { event: 'display_state' }, (payload: any) => {
        if (payload) setState(payload as DisplayState);
      })
      .on('broadcast', { event: 'style' }, (payload: any) => {
        if (payload) setStyle(payload as StyleConfig);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

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
        {/* Main lyric */}
        <div style={containerStyle}>
          {currentLyric && (
            <div style={textStyle}>
              {currentLyric.text}
            </div>
          )}
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
          <div className="flex items-center gap-2">
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: DESIGN_TOKENS.colors.success }} />
            <span style={{ fontSize: '13px', color: DESIGN_TOKENS.colors.text.tertiary }}>Stage Mode</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: 更新 Display 页面路由支持模式**

**文件:** `apps/display/app/display/[sessionId]/page.tsx`

```tsx
import { LyricDisplay } from '@/components/LyricDisplay';

export default async function DisplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { sessionId } = await params;
  const { mode } = await searchParams;
  return <LyricDisplay sessionId={sessionId} mode={mode === 'audience' ? 'audience' : 'stage'} />;
}
```

**Step 3: 提交**

```bash
git add apps/display/components/LyricDisplay.tsx apps/display/app/display/[sessionId]/page.tsx
git commit -m "feat(display): add stage/audience mode support with next lyric preview"
```

---

### 任务 11: 添加共享包导出 DESIGN_TOKENS

**文件:**
- 修改: `packages/shared/src/index.ts`

**Step 1: 确保 DESIGN_TOKENS 被导出**

```typescript
export * from './types';
export * from './tokens';
export * from './supabase';
```

**Step 2: 提交（如果需要）**

```bash
git add packages/shared/src/index.ts
git commit -m "feat(shared): ensure DESIGN_TOKENS is exported"
```

---

### 任务 12: 构建并验证

**Step 1: 构建共享包**

```bash
cd packages/shared && npm run build
```

**Step 2: 启动开发服务器**

```bash
# Terminal 1 - Controller
cd apps/controller && npm run dev

# Terminal 2 - Display
cd apps/display && npm run dev
```

**Step 3: 验证功能**

访问 http://localhost:3001 并：
1. 创建新会议或加入现有会议
2. 验证三栏布局正确显示
3. 验证主题切换功能
4. 验证显示模式切换
5. 验证 AI 搜歌弹窗
6. 验证实时同步

**Step 4: 提交**

```bash
git add -A
git commit -m "feat: complete UI redesign implementation"
```

---

## 实现完成检查清单

- [ ] 共享类型已更新（Theme, Chord, Transpose, Timer, DisplayMode）
- [ ] 设计令牌已创建
- [ ] Sidebar 组件已创建
- [ ] StylePanel 组件已创建
- [ ] LyricPreview 组件已创建
- [ ] AISearchModal 组件已创建
- [ ] 主控制器页面已更新
- [ ] Display 页面支持舞台/观众模式
- [ ] 应用构建成功
- [ ] 本地测试通过

---

## 后续增强功能（可选）

1. **和弦解析器** - 实现真正的和弦提取和显示
2. **移调算法** - 实现和弦移调逻辑
3. **计时器功能** - 实现倒计时和服务计时
4. **实时编辑** - 实现歌词实时编辑模式
5. **播放列表持久化** - 保存和加载播放列表
6. **自定义主题** - 允许用户创建和保存自定义主题
7. **移动端优化** - 创建专门的移动端控制器视图
