// Session 類型
export interface Session {
  id: string;
  code: string;
  created_at: string;
  updated_at: string;
}

// Lyric 類型
export interface Lyric {
  id: string;
  session_id: string;
  text: string;
  order_index: number;
  notes?: string;
  created_at: string;
}

// 顯示狀態（透過 Realtime 同步）
export interface DisplayState {
  currentIndex: number | null;
  isVisible: boolean;
  opacity: number;
  isFadingIn: boolean;
  isFadingOut: boolean;
}

// 樣式配置
export interface StyleConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  textShadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  textStroke: {
    enabled: boolean;
    color: string;
    width: number;
  };
  background: {
    type: 'transparent' | 'solid' | 'gradient' | 'image';
    value?: string;
  };
  fadeDuration: number;
  padding: number;
  lineHeight: number;
}

// 預設樣式
export const DEFAULT_STYLE: StyleConfig = {
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

// Realtime 事件類型
export interface RealtimePayload {
  state: DisplayState;
  style: StyleConfig;
}

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

// ============ 自定义主题 ============

export interface CustomTheme extends ThemePreset {
  isCustom: true;
  createdAt: string;
}

const CUSTOM_THEMES_KEY = 'custom-themes';

export function getCustomThemes(): CustomTheme[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CUSTOM_THEMES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCustomTheme(theme: Omit<CustomTheme, 'id' | 'isCustom' | 'createdAt'>): CustomTheme {
  const customThemes = getCustomThemes();
  const newTheme: CustomTheme = {
    ...theme,
    id: `custom-${Date.now()}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  customThemes.push(newTheme);
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes));
  return newTheme;
}

export function deleteCustomTheme(id: string): void {
  const customThemes = getCustomThemes().filter(t => t.id !== id);
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes));
}

export function getAllThemes(): ThemePreset[] {
  return [...THEME_PRESETS, ...getCustomThemes()];
}

// ============ 和弦解析 ============

// 常见和弦格式
const CHORD_PATTERNS = [
  /\[([A-G][#b]?m?(?:aj)?[0-9]?(?:\/[A-G][#b]?)?(?:add|sus|dim|aug|maj|min)?[0-9]?)\]/g, // [C], [Am], [G7], etc.
  /\{([A-G][#b]?m?(?:aj)?[0-9]?(?:\/[A-G][#b]?)?(?:add|sus|dim|aug|maj|min)?[0-9]?)\}/g, // {C}, {Am}, etc.
  /^([A-G][#b]?m?(?:aj)?[0-9]?(?:\/[A-G][#b]?)?(?:add|sus|dim|aug|maj|min)?[0-9]?)\s/gm, // C at start, Am at start, etc.
  /\s([A-G][#b]?m?(?:aj)?[0-9]?(?:\/[A-G][#b]?)?(?:add|sus|dim|aug|maj|min)?[0-9]?)$/gm, // C at end, Am at end, etc.
];

export interface ParsedChord {
  chord: string;
  originalText: string;
  position: number;
}

export function parseChordsFromLyric(lyricText: string): { text: string; chords: ParsedChord[] } {
  const chords: ParsedChord[] = [];
  let cleanedText = lyricText;

  // 尝试匹配各种和弦格式
  for (const pattern of CHORD_PATTERNS) {
    const matches = [...lyricText.matchAll(new RegExp(pattern.source, pattern.flags))];

    for (const match of matches) {
      const chordName = match[1];
      const fullMatch = match[0];
      const position = match.index || 0;

      // 避免重复添加
      if (!chords.some(c => c.position === position)) {
        chords.push({
          chord: chordName,
          originalText: fullMatch,
          position,
        });
      }
    }
  }

  // 移除和弦标记，保留纯文本
  for (const chord of chords) {
    cleanedText = cleanedText.replace(chord.originalText, '').trim();
  }

  return { text: cleanedText, chords: chords.sort((a, b) => a.position - b.position) };
}

// 音符到半音映射
const NOTE_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
};

const SEMITONE_TO_NOTE: string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export function transposeChord(chord: string, semitones: number): string {
  // 匹配和弦名称（根音）
  const match = chord.match(/^([A-G][#b]?)(m|maj|min|aug|dim|sus|add|[0-9])?(\/([A-G][#b]?))?$/);
  if (!match) return chord;

  let [, rootNote, suffix, , bassNote] = match;

  // 移调根音
  const rootSemitone = NOTE_SEMITONES[rootNote];
  if (rootSemitone === undefined) return chord;

  const newRootSemitone = ((rootSemitone + semitones) % 12 + 12) % 12;
  const newRootNote = SEMITONE_TO_NOTE[newRootSemitone];

  let result = newRootNote + (suffix || '');

  // 处理低音（如 C/G）
  if (bassNote) {
    const bassSemitone = NOTE_SEMITONES[bassNote];
    if (bassSemitone !== undefined) {
      const newBassSemitone = ((bassSemitone + semitones) % 12 + 12) % 12;
      const newBassNote = SEMITONE_TO_NOTE[newBassSemitone];
      result += '/' + newBassNote;
    }
  }

  return result;
}

export function transposeLyricChords(chords: ParsedChord[], semitones: number): ParsedChord[] {
  return chords.map(c => ({
    ...c,
    chord: transposeChord(c.chord, semitones),
  }));
}

// ============ 计时器工具 ============

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function parseTime(timeString: string): number {
  const parts = timeString.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  return 0;
}
