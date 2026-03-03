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
