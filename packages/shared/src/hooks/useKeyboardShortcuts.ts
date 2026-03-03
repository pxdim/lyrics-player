import { useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  handler: () => void;
  description?: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
}

export interface KeyboardShortcutsMap {
  [key: string]: KeyboardShortcut;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const handlersRef = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Build the key map
    const keyMap = new Map<string, () => void>();

    shortcuts.forEach((shortcut) => {
      const keyCombo = buildKeyCombo(shortcut);
      keyMap.set(keyCombo, shortcut.handler);
      handlersRef.current.set(keyCombo, shortcut.handler);
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const keyCombo = buildKeyCombo({
        key: event.key,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      });

      const handler = handlersRef.current.get(keyCombo);
      if (handler) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);

  return null;
}

function buildKeyCombo(shortcut: {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('ctrl');
  if (shortcut.metaKey) parts.push('meta');
  if (shortcut.altKey) parts.push('alt');
  if (shortcut.shiftKey) parts.push('shift');

  // Normalize key
  let key = shortcut.key.toLowerCase();

  // Map special keys
  const keyMap: Record<string, string> = {
    ' ': 'space',
    arrowleft: 'arrowleft',
    arrowright: 'arrowright',
    arrowup: 'arrowup',
    arrowdown: 'arrowdown',
    escape: 'escape',
  };

  key = keyMap[key] || key;
  parts.push(key);

  return parts.join('+');
}

// Predefined shortcuts for lyrics player
export function useLyricsPlayerShortcuts(
  handlers: {
    onPrevious?: () => void;
    onNext?: () => void;
    onToggleVisibility?: () => void;
    onFadeIn?: () => void;
    onFadeOut?: () => void;
    onEmergencyClear?: () => void;
    onJumpToLyric?: (index: number) => void;
  },
  enabled: boolean = true,
  lyricCount: number = 0
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowLeft',
      handler: () => handlers.onPrevious?.(),
      description: '上一行歌詞',
      preventDefault: true,
    },
    {
      key: 'ArrowRight',
      handler: () => handlers.onNext?.(),
      description: '下一行歌詞',
      preventDefault: true,
    },
    {
      key: ' ',
      handler: () => handlers.onToggleVisibility?.(),
      description: '顯示/隱藏',
      preventDefault: true,
    },
    {
      key: 'f',
      handler: () => {
        // Toggle fade - fade in if not visible, fade out if visible
        if (handlers.onFadeIn && handlers.onFadeOut) {
          // This is a simplified toggle - the actual implementation
          // should track state separately
          handlers.onFadeIn();
        }
      },
      description: '淡入',
      preventDefault: true,
    },
    {
      key: 'F',
      shiftKey: true,
      handler: () => handlers.onFadeOut?.(),
      description: '淡出',
      preventDefault: true,
    },
    {
      key: 'Escape',
      handler: () => handlers.onEmergencyClear?.(),
      description: '緊急清除',
      preventDefault: true,
    },
  ];

  // Add number shortcuts for jumping to lyrics
  for (let i = 0; i < 10 && i < lyricCount; i++) {
    shortcuts.push({
      key: i.toString(),
      handler: () => handlers.onJumpToLyric?.(i),
      description: `跳到第 ${i + 1} 行`,
      preventDefault: true,
    });
  }

  return useKeyboardShortcuts(shortcuts, enabled);
}
