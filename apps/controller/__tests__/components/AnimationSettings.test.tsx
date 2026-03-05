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

    // Click the toggle button
    const toggleContainer = screen.getByText('啟用歌詞切換動畫').parentElement;
    const toggleButton = toggleContainer?.querySelector('button') || toggleContainer?.querySelector('[role="button"]');

    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(mockOnChange).toHaveBeenCalledWith({ enabled: false });
    }
  });

  it('should render all 5 animation types when enabled', () => {
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

  it('should call onChange when selecting animation type', () => {
    render(<AnimationSettings config={mockConfig} onChange={mockOnChange} />);

    const slideButton = screen.getByText('滑入滑出');
    fireEvent.click(slideButton);
    expect(mockOnChange).toHaveBeenCalledWith({ type: 'slide' });
  });

  it('should display speed preset buttons', () => {
    render(<AnimationSettings config={mockConfig} onChange={mockOnChange} />);

    expect(screen.getByText('200ms')).toBeTruthy();
    expect(screen.getByText('500ms')).toBeTruthy();
    expect(screen.getByText('1000ms')).toBeTruthy();
  });

  it('should call onChange when clicking speed preset', () => {
    render(<AnimationSettings config={mockConfig} onChange={mockOnChange} />);

    const speedButton = screen.getByText('500ms');
    fireEvent.click(speedButton);
    expect(mockOnChange).toHaveBeenCalledWith({ duration: 500 });
  });

  it('should call onChange when selecting easing function', () => {
    render(<AnimationSettings config={mockConfig} onChange={mockOnChange} />);

    const linearButton = screen.getByText('Linear');
    fireEvent.click(linearButton);
    expect(mockOnChange).toHaveBeenCalledWith({ easing: 'linear' });
  });

  it('should call onChange when selecting rapid switch mode', () => {
    render(<AnimationSettings config={mockConfig} onChange={mockOnChange} />);

    const queuedButton = screen.getByText('排隊播放');
    fireEvent.click(queuedButton);
    expect(mockOnChange).toHaveBeenCalledWith({ rapidSwitchMode: 'queued' });
  });

  it('should display current duration value', () => {
    render(<AnimationSettings config={{ ...mockConfig, duration: 600 }} onChange={mockOnChange} />);
    expect(screen.getByText('600ms')).toBeTruthy();
  });
});
