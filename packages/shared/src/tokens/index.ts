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

  // 响应式断点
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// 响应式工具函数
export function useBreakpoint(): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true };
  }
  const width = window.innerWidth;
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}

export type DesignTokens = typeof DESIGN_TOKENS;
