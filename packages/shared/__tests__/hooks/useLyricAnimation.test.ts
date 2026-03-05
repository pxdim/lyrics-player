import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLyricAnimation } from '../../src/hooks/useLyricAnimation';
import type { AnimationConfig } from '../../src/types';

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
    const { result } = renderHook(() =>
      useLyricAnimation(null, { ...defaultConfig, enabled: false })
    );

    expect(result.current.displayIndex).toBeNull();
    expect(result.current.isEntering).toBe(false);
    expect(result.current.isExiting).toBe(false);
  });

  it('should return initial state when first load', () => {
    const { result } = renderHook(() =>
      useLyricAnimation(0, defaultConfig)
    );

    expect(result.current.displayIndex).toBe(0);
    expect(result.current.isEntering).toBe(false);
    expect(result.current.isExiting).toBe(false);
  });

  it('should trigger crossfade animation on index change', async () => {
    const { result, rerender } = renderHook(
      ({ index }) => useLyricAnimation(index, defaultConfig),
      { initialProps: { index: 0 } }
    );

    // Initial render
    expect(result.current.displayIndex).toBe(0);

    // Change to index 1
    rerender({ index: 1 });

    // Should have entering animation
    expect(result.current.displayIndex).toBe(1);
    expect(result.current.isEntering).toBe(true);
    expect(result.current.enterOpacity).toBe(1);
    expect(result.current.exitOpacity).toBe(0);
  });

  it('should not trigger animation when animation is disabled', () => {
    const { result, rerender } = renderHook(
      ({ index }) => useLyricAnimation(index, { ...defaultConfig, enabled: false }),
      { initialProps: { index: 0 } }
    );

    expect(result.current.displayIndex).toBe(0);

    rerender({ index: 1 });

    expect(result.current.displayIndex).toBe(1);
    expect(result.current.isEntering).toBe(false);
    expect(result.current.isExiting).toBe(false);
  });

  it('should not trigger animation for same index', () => {
    const { result, rerender } = renderHook(
      ({ index }) => useLyricAnimation(index, defaultConfig),
      { initialProps: { index: 0 } }
    );

    rerender({ index: 0 });

    expect(result.current.isEntering).toBe(false);
    expect(result.current.isExiting).toBe(false);
  });

  it('should handle null index', () => {
    const { result } = renderHook(() =>
      useLyricAnimation(null, defaultConfig)
    );

    expect(result.current.displayIndex).toBeNull();
  });

  it('should transition from null to first index', () => {
    const { result, rerender } = renderHook(
      ({ index }) => useLyricAnimation(index, defaultConfig),
      { initialProps: { index: null } }
    );

    expect(result.current.displayIndex).toBeNull();

    rerender({ index: 0 });

    // First load should directly show without animation
    expect(result.current.displayIndex).toBe(0);
    expect(result.current.isEntering).toBe(false);
  });
});
