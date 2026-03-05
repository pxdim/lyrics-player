# 測試套件設定 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 為立完整的測試環境，使用 Vitest + React Testing Library 支援單元測試和組件測試

**Architecture:** 在 monorepo 根目錄配置 Vitest，每個 package/app 有自己的測試目錄，共享測試工具函數在 workspace 中

**Tech Stack:** Vitest, @testing-library/react, @testing-library/jest-dom, jsdom, happy-dom

---

## Task 1: 安裝根目錄測試依賴

**Files:**
- Modify: `package.json`

**Step 1: 安裝 Vitest 及相關依賴**

Run: `npm install -D vitest @vitest/ui @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom`

**Step 2: 驗證安裝成功**

Run: `npm list | grep -E "(vitest|testing-library)"`
Expected: 看到安裝的套件版本

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "test: install vitest and testing library dependencies"
```

---

## Task 2: 建立 Vitest 配置檔

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

**Step 1: 創建 vitest.config.ts**

在專案根目錄創建：

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'out'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['**/*.{ts,tsx}', '**/*.{js,jsx}'],
      exclude: ['**/*.d.ts', '**/*.config.{ts,js}', '**/node_modules/**', '**/.next/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/controller'),
      'shared': path.resolve(__dirname, './packages/shared'),
      'ui': path.resolve(__dirname, './packages/ui'),
    },
  },
});
```

**Step 2: 添加 test 腳本到根 package.json**

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Step 3: 驗證配置**

Run: `npx vitest --version`
Expected: 顯示 Vitest 版本

**Step 4: Commit**

```bash
git add vitest.config.ts package.json
git commit -m "test: add vitest configuration and test scripts"
```

---

## Task 3: 建立測試設置檔

**Files:**
- Create: `test/setup.ts`
- Create: `test/test-utils.tsx`

**Step 1: 創建 test/setup.ts**

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

**Step 2: 創建 test/test-utils.tsx**

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Config } from '@testing-library/dom';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'queries'> {
  config?: Config;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return render(ui, {
    ...options,
  });
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { expect } from 'vitest';
```

**Step 3: 驗證配置檔案**

Run: `ls -la test/`
Expected: 看到 setup.ts 和 test-utils.tsx

**Step 4: Commit**

```bash
git add test/
git commit -m "test: add test setup and utilities"
```

---

## Task 4: 為立 shared package 測試

**Files:**
- Modify: `packages/shared/package.json`
- Create: `packages/shared/__tests__/index.test.ts`

**Step 1: 添加測試腳本到 shared/package.json**

```json
{
  "name": "shared",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "happy-dom": "^1.0.0"
  }
}
```

**Step 2: 創建 shared/__tests__/index.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { DEFAULT_ANIMATION, AnimationConfig, THEME_PRESETS, parseChordsFromLyric, transposeChord } from '../src/index';

describe('shared - Types', () => {
  describe('DEFAULT_ANIMATION', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_ANIMATION.enabled).toBe(true);
      expect(DEFAULT_ANIMATION.type).toBe('crossfade');
      expect(DEFAULT_ANIMATION.duration).toBe(400);
      expect(DEFAULT_ANIMATION.easing).toBe('ease-in-out');
      expect(DEFAULT_ANIMATION.rapidSwitchMode).toBe('immediate');
    });
  });

  describe('THEME_PRESETS', () => {
    it('should have 6 theme presets', () => {
      expect(THEME_PRESETS).toHaveLength(6);
    });

    it('each theme should have required properties', () => {
      THEME_PRESETS.forEach((theme) => {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('displayName');
        expect(theme).toHaveProperty('style');
        expect(theme.style).toHaveProperty('fontFamily');
        expect(theme.style).toHaveProperty('fontSize');
      });
    });
  });
});

describe('shared - Chord Utilities', () => {
  describe('parseChordsFromLyric', () => {
    it('should parse chord markers in brackets', () => {
      const result = parseChordsFromLyric('[C]Hello [Am]World');
      expect(result.text).toBe('Hello World');
      expect(result.chords).toHaveLength(2);
      expect(result.chords[0].chord).toBe('C');
      expect(result.chords[1].chord).toBe('Am');
    });

    it('should parse chord markers in braces', () => {
      const result = parseChordsFromLyric('{D}Test {G}Content');
      expect(result.text).toBe('Test Content');
      expect(result.chords).toHaveLength(2);
    });

    it('should handle lyrics without chords', () => {
      const result = parseChordsFromLyric('Simple lyric text');
      expect(result.text).toBe('Simple lyric text');
      expect(result.chords).toHaveLength(0);
    });

    it('should parse mixed chord formats', () => {
      const result = parseChordsFromLyric('[F]Mai[Am]lyrics with [C]hords');
      expect(result.chords).toHaveLength(3);
    });
  });

  describe('transposeChord', () => {
    it('should transpose C up by 2 semitones to D', () => {
      expect(transposeChord('C', 2)).toBe('D');
    });

    it('should transpose Am down by 2 semitones to Gm', () => {
      expect(transposeChord('Am', -2)).toBe('Gm');
    });

    it('should transpose C# up by 1 semitone to D', () => {
      expect(transposeChord('C#', 1)).toBe('D');
    });

    it('should handle slash chords', () => {
      expect(transposeChord('C/G', 2)).toBe('D/A');
    });

    it('should wrap around the octave', () => {
      expect(transposeChord('B', 1)).toBe('C');
      expect(transposeChord('C', -1)).toBe('B');
    });
  });

  describe('formatTime', () => {
    it('should format seconds as MM:SS', () => {
      const { formatTime } = require('../src/index');
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(59)).toBe('00:59');
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(3661)).toBe('61:01');
    });
  });

  describe('parseTime', () => {
    it('should parse MM:SS format to seconds', () => {
      const { parseTime } = require('../src/index');
      expect(parseTime('00:00')).toBe(0);
      expect(parseTime('01:00')).toBe(60);
      expect(parseTime('61:01')).toBe(3661);
    });
  });
});
```

**Step 3: 執行測試驗證**

Run: `cd packages/shared && bun test`
Expected: 測試通過

**Step 4: Commit**

```bash
git add packages/shared/
git commit -m "test(shared): add unit tests for types and utilities"
```

---

## Task 5: 建立 controller app 測試

**Files:**
- Modify: `apps/controller/package.json`
- Create: `apps/controller/__tests__/components/PlaylistSidebar.test.tsx`

**Step 1: 添加測試依賴到 controller/package.json**

```json
{
  "name": "controller",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "@supabase/supabase-js": "^2.39.0",
    "lucide-react": "^0.577.0",
    "next": "^15.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "happy-dom": "^1.0.0"
  }
}
```

**Step 2: 安裝依賴**

Run: `cd apps/controller && bun install`

**Step 3: 創建 __tests__/components/PlaylistSidebar.test.tsx**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlaylistSidebar } from '../components/PlaylistSidebar';
import { DESIGN_TOKENS } from 'shared';

// Mock Supabase client
vi.mock('shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('shared')>();
  return {
    ...actual,
    createSupabaseClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({ data: [], error: null })),
        insert: vi.fn(() => ({ error: null })),
        delete: vi.fn(() => ({ error: null })),
        channel: vi.fn(() => ({
          on: vi.fn(() => ({ channel: {} })),
          send: vi.fn(() => ({})),
        })),
      })),
    })),
  };
});

const mockSongs = [
  {
    id: '1',
    songName: 'Test Song 1',
    artist: 'Test Artist',
    lyrics: [{ text: 'Line 1', notes: '' }],
    orderIndex: 0,
  },
  {
    id: '2',
    songName: 'Test Song 2',
    artist: null,
    lyrics: [{ text: 'Line 1', notes: '' }],
    orderIndex: 1,
  },
];

describe('PlaylistSidebar Component', () => {
  const mockProps = {
    sessionId: 'test-session',
    currentSongIndex: 0,
    currentLyricIndex: 0,
    onSongSelect: vi.fn(),
    onNextSong: vi.fn(),
    onPreviousSong: vi.fn(),
    onAddSong: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render song list', () => {
    render(<PlaylistSidebar {...mockProps} />);
    expect(screen.getByText('Test Song 1')).toBeTruthy();
  });

  it('should display song count', () => {
    render(<PlaylistSidebar {...mockProps} />);
    expect(screen.getByText(/首歌曲/)).toBeTruthy();
  });

  it('should call onSongSelect when clicking a song', async () => {
    render(<PlaylistSidebar {...mockProps} />);
    const songButton = screen.getByText('Test Song 2');
    fireEvent.click(songButton);
    expect(mockProps.onSongSelect).toHaveBeenCalledWith(1, 0);
  });

  it('should disable previous button on first song', () => {
    render(<PlaylistSidebar {...mockProps} currentSongIndex={0} />);
    const prevButton = screen.getByText('上一首');
    expect(prevButton).toHaveStyle({ opacity: expect.any(Number) });
  });

  it('should disable next button on last song', () => {
    render(<PlaylistSidebar {...mockProps} currentSongIndex={1} />);
    const nextButton = screen.getByText('下一首');
    expect(nextButton).toHaveStyle({ opacity: expect.any(Number) });
  });

  it('should show empty state when no songs', () => {
    render(<PlaylistSidebar {...mockProps} currentSongIndex={null} />);
    expect(screen.getByText(/還沒有歌曲/)).toBeTruthy();
  });
});
```

**Step 4: 執行測試**

Run: `cd apps/controller && bun test`
Expected: 測試通過

**Step 5: Commit**

```bash
git add apps/controller/
git commit -m "test(controller): add PlaylistSidebar component tests"
```

---

## Task 6: 建立 AnimationSettings 組件測試

**Files:**
- Create: `apps/controller/__tests__/components/AnimationSettings.test.tsx`

**Step 1: 創建 AnimationSettings.test.tsx**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnimationSettings } from '../../components/AnimationSettings';
import type { AnimationConfig } from 'shared';

const mockConfig: AnimationConfig = {
  enabled: true,
  type: 'crossfade',
  duration: 400,
  easing: 'ease-in-out',
  rapidSwitchMode: 'immediate',
};

describe('AnimationSettings Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render animation toggle', () => {
    render(<AnimationSettings config={mockConfig} onChange={mockOnChange} />);
    expect(screen.getByText('啟用歌詞切換動畫')).toBeTruthy();
    expect(screen.getByText(/切換下一句時播放過渡效果/)).toBeTruthy();
  });

  it('should toggle enabled state', () => {
    render(<AnimationSettings config={mockConfig} onChange={mockOnChange} />);
    const toggle = screen.getByRole('switch').parentElement || screen.getByRole('button');
    fireEvent.click(toggle);
    expect(mockOnChange).toHaveBeenCalledWith({ enabled: false });
  });

  it('should render all 5 animation types', () => {
    render(<AnimationSettings config={mockConfig} onChange={mockOnChange} />);
    expect(screen.getByText('無動畫')).toBeTruthy();
    expect(screen.getByText('淡出淡入')).toBeTruthy();
    expect(screen.getByText('交錯淡入淡出')).toBeTruthy();
    expect(screen.getByText('滑入滑出')).toBeTruthy();
    expect(screen.getByText('縮放效果')).toBeTruthy();
  });

  it('should show settings when enabled', () => {
    render(<AnimationSettings config={mockConfig} onChange={mockOnChange} />);
    expect(screen.getByText('動畫類型')).toBeTruthy();
    expect(screen.getByText('動畫速度')).toBeTruthy();
    expect(screen.getByText('緩動效果')).toBeTruthy();
    expect(screen.getByText('快速切換行為')).toBeTruthy();
  });

  it('should hide settings when disabled', () => {
    render(<AnimationSettings config={{ ...mockConfig, enabled: false }} onChange={mockOnChange} />);
    expect(screen.queryByText('動畫類型')).not.toBeTruthy();
  });
});
```

**Step 2: 執行測試**

Run: `cd apps/controller && bun test`
Expected: 測試通過

**Step 3: Commit**

```bash
git add apps/controller/__tests__/components/AnimationSettings.test.tsx
git commit -m "test(controller): add AnimationSettings component tests"
```

---

## Task 7: 建立 useLyricAnimation Hook 測試

**Files:**
- Create: `packages/shared/__tests__/hooks/useLyricAnimation.test.ts`

**Step 1: 安裝 @testing-library/react-dom 到 shared**

修改 `packages/shared/package.json`：

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "happy-dom": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

Run: `cd packages/shared && bun install`

**Step 2: 創建 useLyricAnimation.test.ts**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLyricAnimation } from '../src/hooks/useLyricAnimation';
import type { AnimationConfig } from '../src/types';

describe('useLyricAnimation Hook', () => {
  const defaultConfig: AnimationConfig = {
    enabled: true,
    type: 'crossfade',
    duration: 400,
    easing: 'ease-in-out',
    rapidSwitchMode: 'immediate',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return initial state when not enabled', () => {
    const { result } = renderHook(() => useLyricAnimation(null, { ...defaultConfig, enabled: false }));
    expect(result.current.displayIndex).toBeNull();
    expect(result.current.isEntering).toBe(false);
    expect(result.current.isExiting).toBe(false);
  });

  it('should return initial state when first load', () => {
    const { result } = renderHook(() => useLyricAnimation(0, defaultConfig));
    expect(result.current.displayIndex).toBe(0);
    expect(result.current.isEntering).toBe(false);
  });

  it('should trigger crossfade animation on index change', async () => {
    const { result } = renderHook(() => useLyricAnimation(0, defaultConfig));
    const { rerender } = result;

    // Initial render
    expect(result.current.displayIndex).toBe(0);

    // Change to index 1
    act(() => {
      rerender({ index: 1 });
    });

    // Should have entering animation
    expect(result.current.displayIndex).toBe(1);
    expect(result.current.isEntering).toBe(true);
    expect(result.current.enterOpacity).toBe(1);
    expect(result.current.exitOpacity).toBe(0);
  });

  it('should trigger fade-out-in animation', async () => {
    const { result } = renderHook(() => useLyricAnimation(0, { ...defaultConfig, type: 'fade-out-in' }));
    const { rerender } = result;

    act(() => {
      rerender({ index: 1 });
    });

    // First phase: fade out
    expect(result.current.isExiting).toBe(true);
    expect(result.current.exitOpacity).toBe(0);

    // Fast forward half duration
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Second phase: fade in
    await waitFor(() => {
      expect(result.current.isEntering).toBe(true);
      expect(result.current.enterOpacity).toBe(1);
    });
  });

  it('should trigger slide animation with correct direction', () => {
    const { result } = renderHook(() => useLyricAnimation(0, { ...defaultConfig, type: 'slide' }));
    const { rerender } = result;

    act(() => {
      rerender({ index: 1 }); // Moving forward
    });

    expect(result.current.exitTransform).toContain('translateX(-100%)');
    expect(result.current.enterTransform).toContain('translateX(100%)');
  });

  it('should trigger scale animation', () => {
    const { result } = renderHook(() => useLyricAnimation(0, { ...defaultConfig, type: 'scale' }));
    const { rerender } = result;

    act(() => {
      rerender({ index: 1 });
    });

    expect(result.current.exitTransform).toContain('scale(0.8)');
    expect(result.current.enterTransform).toContain('scale(1.2)');
  });

  it('should call onAnimationComplete after animation', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLyricAnimation(0, defaultConfig, onComplete));
    const { rerender } = result;

    act(() => {
      rerender({ index: 1 });
    });

    // Fast forward through animation
    act(() => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(1);
    });
  });

  it('should clean up timers on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useLyricAnimation(0, defaultConfig));

    unmount();

    // Cleanup should happen
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
```

**Step 3: 執行測試**

Run: `cd packages/shared && bun test`
Expected: 測試通過

**Step 4: Commit**

```bash
git add packages/shared/
git commit -m "test(shared): add useLyricAnimation hook tests"
```

---

## Task 8: 更新 turbo.json 測試任務

**Files:**
- Modify: `turbo.json`

**Step 1: 添加測試任務到 turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["shared#test", "controller#test"],
      "outputs: ["coverage/**"]
    }
  }
}
```

**Step 2: 驗證配置**

Run: `bun run test`
Expected: 執行所有 workspace 的測試

**Step 3: Commit**

```bash
git add turbo.json
git commit -m "test: add test task to turbo.json"
```

---

## Task 9: 建立測試腳本說明文件

**Files:**
- Create: `test/README.md`

**Step 1: 創建 test/README.md**

```markdown
# 測試說明

## 執行測試

```bash
# 執行所有測試
bun test

# 執行特定 package 測試
cd apps/controller && bun test
cd packages/shared && bun test

# 觀看 UI 模式
bun run test:ui

# 產生覆蓋率報告
bun run test:coverage
```

## 測試檔案結構

```
test/
├── setup.ts           # 全域測試設置
├── test-utils.tsx     # 共用測試工具
└── README.md          # 本文件

apps/controller/__tests__/
└── components/
    ├── PlaylistSidebar.test.tsx
    └── AnimationSettings.test.tsx

packages/shared/__tests__/
├── index.test.ts      # 類型和工具函數測試
└── hooks/
    └── useLyricAnimation.test.tsx
```

## 撰境變數

部分測試可能需要環境變數：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## CI/CD

GitHub Actions 自動執行：

```yaml
- run: bun test
```
```

**Step 2: 驗證文件存在**

Run: `cat test/README.md`
Expected: 顯示測試說明

**Step 3: Commit**

```bash
git add test/README.md
git commit -m "docs: add testing guide"
```

---

## Task 10: 最終驗證與推送

**Step 1: 執行完整測試套件**

Run: `bun run test:coverage`
Expected: 所有測試通過並產生覆蓋率報告

**Step 2: 檢查覆蓋率報告**

Open `coverage/index.html` 瀋查覆蓋率是否合理

**Step 3: 推送到 GitHub**

```bash
git push origin main
```

---

## 驗收標準

- [ ] Vitest 配置正確
- [ ] 測試可以執行
- [ ] shared package 至少有 5 個測試通過
- [ ] controller 至少有 3 個組件測試通過
- [ ] 覆蓋率報告可以產生
- [ ] 測試文件說明完整
- [ ] 所有變更已推送到 GitHub
