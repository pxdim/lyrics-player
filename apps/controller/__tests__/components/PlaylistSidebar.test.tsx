import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlaylistSidebar } from '../../components/PlaylistSidebar';

// Mock fetch globally
global.fetch = vi.fn();

describe('PlaylistSidebar Component', () => {
  const mockSessionId = 'test-session-123';
  const mockOnSongSelect = vi.fn();
  const mockOnNextSong = vi.fn();
  const mockOnPreviousSong = vi.fn();
  const mockOnAddSong = vi.fn();

  const mockSongs = [
    {
      id: '1',
      songName: 'Test Song 1',
      artist: 'Test Artist',
      lyrics: [{ text: 'Line 1', notes: '' }],
      orderIndex: 0,
      isCurrent: false,
    },
    {
      id: '2',
      songName: 'Test Song 2',
      artist: null,
      lyrics: [{ text: 'Line 1', notes: '' }],
      orderIndex: 1,
      isCurrent: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch to return songs
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ songs: mockSongs }),
    });
  });

  it('should render the sidebar with header', () => {
    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={0}
        currentLyricIndex={0}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
        onAddSong={mockOnAddSong}
      />
    );

    expect(screen.getByText('歌單')).toBeTruthy();
    expect(screen.getByText('新歌')).toBeTruthy();
  });

  it('should display loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolve

    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={null}
        currentLyricIndex={null}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
      />
    );

    expect(screen.getByText('載入中...')).toBeTruthy();
  });

  it('should display empty state when no songs', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ songs: [] }),
    });

    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={null}
        currentLyricIndex={null}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('還沒有歌曲')).toBeTruthy();
    });
  });

  it('should render song list when songs are loaded', async () => {
    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={0}
        currentLyricIndex={0}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
        onAddSong={mockOnAddSong}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Song 1')).toBeTruthy();
      expect(screen.getByText('Test Song 2')).toBeTruthy();
    });
  });

  it('should display song count', async () => {
    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={0}
        currentLyricIndex={0}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
        onAddSong={mockOnAddSong}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2 首歌')).toBeTruthy();
    });
  });

  it('should call onAddSong when clicking new song button', () => {
    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={null}
        currentLyricIndex={null}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
        onAddSong={mockOnAddSong}
      />
    );

    const addButton = screen.getByText('新歌');
    fireEvent.click(addButton);
    expect(mockOnAddSong).toHaveBeenCalled();
  });

  it('should show navigation buttons', async () => {
    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={0}
        currentLyricIndex={0}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('上一首')).toBeTruthy();
      expect(screen.getByText('下一首')).toBeTruthy();
    });
  });

  it('should show auto play toggle', async () => {
    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={0}
        currentLyricIndex={0}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('自動播放')).toBeTruthy();
    });
  });

  it('should display error message when loading fails', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={null}
        currentLyricIndex={null}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('should display retry button when error occurs', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={null}
        currentLyricIndex={null}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('重試')).toBeTruthy();
    });
  });

  it('should call onAutoPlayChange when clicking auto play toggle', async () => {
    const mockOnAutoPlayChange = vi.fn();

    render(
      <PlaylistSidebar
        sessionId={mockSessionId}
        currentSongIndex={0}
        currentLyricIndex={0}
        onSongSelect={mockOnSongSelect}
        onNextSong={mockOnNextSong}
        onPreviousSong={mockOnPreviousSong}
        autoPlay={false}
        onAutoPlayChange={mockOnAutoPlayChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('自動播放')).toBeTruthy();
    });

    const autoPlayButton = screen.getByText('自動播放');
    fireEvent.click(autoPlayButton);

    expect(mockOnAutoPlayChange).toHaveBeenCalledWith(true);
  });
});
