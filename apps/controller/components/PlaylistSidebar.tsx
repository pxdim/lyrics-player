'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronRight, Music3, Trash2, MoreVertical, Copy, Users } from 'lucide-react';
import { DESIGN_TOKENS } from 'shared';
import type { SongGroup } from 'shared';

interface PlaylistSidebarProps {
  sessionId: string;
  sessionCode?: string; // 房間號碼
  currentSongIndex: number | null;
  currentLyricIndex: number | null;
  onSongSelect: (songIndex: number, lyricIndex?: number) => void;
  onNextSong: () => void;
  onPreviousSong: () => void;
  onAddSong?: () => void;
  onDeleteSong?: (songIndex: number) => void;
  autoPlay?: boolean;
  onAutoPlayChange?: (enabled: boolean) => void;
  autoPlayInterval?: number;
}

export function PlaylistSidebar({
  sessionId,
  sessionCode,
  currentSongIndex,
  currentLyricIndex,
  onSongSelect,
  onNextSong,
  onPreviousSong,
  onAddSong,
  onDeleteSong,
  autoPlay = false,
  onAutoPlayChange,
  autoPlayInterval = 5000,
}: PlaylistSidebarProps) {
  const [songs, setSongs] = useState<SongGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSongIndex, setHoveredSongIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // 複製房間號碼
  const handleCopyCode = async () => {
    if (!sessionCode) return;
    const displayUrl = typeof window !== 'undefined' ? `${window.location.origin}/display/${sessionCode}` : '';
    await navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 處理刪除歌曲
  const handleDeleteSong = async (songIndex: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止觸發選擇歌曲

    const song = songs[songIndex];
    if (!song) return;

    // 確認刪除
    if (!confirm(`確定要刪除「${song.songName}」嗎？`)) return;

    try {
      const response = await fetch('/api/playlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          songId: song.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '刪除失敗');
      }

      // 重新載入歌單
      loadPlaylist();

      // 通知父組件
      onDeleteSong?.(songIndex);
    } catch (err) {
      console.error('Error deleting song:', err);
      alert(err instanceof Error ? err.message : '刪除歌曲失敗');
    }
  };

  // 載入歌單
  const loadPlaylist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/playlist?sessionId=${sessionId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '載入失敗' }));
        throw new Error(errorData.error || '載入歌單失敗');
      }
      const data = await response.json();
      setSongs(data.songs || []);
    } catch (err) {
      console.error('Error loading playlist:', err);
      setError(err instanceof Error ? err.message : '載入歌單失敗');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadPlaylist();
    }
  }, [sessionId]);

  // 自動播放邏輯
  useEffect(() => {
    if (!autoPlay || currentSongIndex === null || currentLyricIndex === null) return;

    const currentSong = songs[currentSongIndex];
    if (!currentSong) return;

    // 檢查是否已到歌曲結尾
    if (currentLyricIndex >= currentSong.lyrics.length - 1) {
      // 歌曲結束，切換到下一首
      if (currentSongIndex < songs.length - 1) {
        const timer = setTimeout(() => {
          onNextSong();
        }, 2000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // 自動跳到下一句
    const timer = setTimeout(() => {
      onSongSelect(currentSongIndex, currentLyricIndex + 1);
    }, autoPlayInterval);

    return () => clearTimeout(timer);
  }, [autoPlay, currentSongIndex, currentLyricIndex, songs, onSongSelect, onNextSong, autoPlayInterval]);

  const currentSong = currentSongIndex !== null ? songs[currentSongIndex] : null;

  return (
    <div
      className="flex flex-col"
      style={{
        width: 320,
        backgroundColor: '#0A0A0A',
        borderRight: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '24px 24px 16px' }}>
        {/* 房間號碼顯示 */}
        {sessionCode && (
          <div
            className="flex items-center justify-between mb-4 p-3 rounded-xl"
            style={{ backgroundColor: 'rgba(201, 169, 98, 0.15)', border: '1px solid rgba(201, 169, 98, 0.3)' }}
          >
            <div className="flex items-center gap-2">
              <Users size={16} style={{ color: '#C9A962' }} />
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.5)',
                    margin: 0,
                    marginBottom: '2px',
                  }}
                >
                  房間號碼
                </p>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#C9A962',
                    margin: 0,
                    fontFamily: 'monospace',
                  }}
                >
                  {sessionCode}
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: 'rgba(201, 169, 98, 0.2)', color: '#C9A962' }}
            >
              <Copy size={14} />
              <span style={{ fontSize: '12px' }}>{copied ? '已複製' : '複製連結'}</span>
            </button>
          </div>
        )}

        <div
          className="flex items-center justify-between mb-4"
          style={{ gap: '12px' }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 500,
              fontFamily: 'Cormorant Garamond, serif',
              color: '#FFFFFF',
            }}
          >
            歌單
          </h2>
          <button
            onClick={onAddSong}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: '#C9A962',
              color: '#0A0A0A',
              fontWeight: 500,
              fontSize: '14px',
            }}
          >
            <Plus size={16} />
            新歌
          </button>
        </div>

        {/* 歌曲計數 */}
        <p
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.4)',
            textAlign: 'center',
          }}
        >
          {songs.length} 首歌
        </p>
      </div>

      {/* Song List */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: '0 16px',
          gap: '8px',
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            載入中...
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: '#EF4444', marginBottom: '16px', fontSize: '14px' }}>{error}</p>
            <button
              onClick={loadPlaylist}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#C9A962',
                color: '#0A0A0A',
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              重試
            </button>
          </div>
        ) : songs.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            <Music3 size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>還沒有歌曲</p>
            <p style={{ fontSize: '12px' }}>點擊「新歌」新增</p>
          </div>
        ) : (
          songs.map((song, index) => {
            const isCurrent = index === currentSongIndex;
            return (
              <div
                key={song.id}
                onClick={() => onSongSelect(index)}
                onMouseEnter={() => setHoveredSongIndex(index)}
                onMouseLeave={() => setHoveredSongIndex(null)}
                className="cursor-pointer transition-all"
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isCurrent
                    ? 'rgba(201, 169, 98, 0.25)'
                    : 'rgba(255,255,255,0.06)',
                  border: isCurrent
                    ? '1px solid rgba(201, 169, 98, 0.5)'
                    : '1px solid transparent',
                  position: 'relative',
                }}
              >
                {/* Delete button */}
                {hoveredSongIndex === index && (
                  <button
                    onClick={(e) => handleDeleteSong(index, e)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '4px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="刪除歌曲"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                {/* Song Title */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    paddingRight: hoveredSongIndex === index ? '24px' : '0',
                  }}
                >
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: isCurrent ? '#C9A962' : '#FFFFFF',
                      flex: 1,
                    }}
                  >
                    {song.songName}
                  </span>
                  {isCurrent && (
                    <ChevronRight size={16} style={{ color: '#C9A962' }} />
                  )}
                </div>

                {/* Artist */}
                {song.artist && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '8px',
                    }}
                  >
                    {song.artist}
                  </p>
                )}

                {/* Status */}
                {isCurrent && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#C9A962',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#C9A962',
                      }}
                    >
                      播放中
                    </span>
                    {currentLyricIndex !== null && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {currentLyricIndex + 1}/{song.lyrics.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Controls */}
      <div
        style={{
          padding: '24px 24px 28px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Song Navigation */}
        <div
          className="flex items-center justify-between mb-4"
          style={{ gap: '8px' }}
        >
          <button
            onClick={onPreviousSong}
            disabled={currentSongIndex === null || currentSongIndex === 0}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
              opacity:
                currentSongIndex === null || currentSongIndex === 0 ? 0.3 : 1,
            }}
          >
            上一首
          </button>
          <button
            onClick={onNextSong}
            disabled={currentSongIndex === null || currentSongIndex >= songs.length - 1}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
              opacity:
                currentSongIndex === null || currentSongIndex >= songs.length - 1
                  ? 0.3
                  : 1,
            }}
          >
            下一首
          </button>
        </div>

        {/* Auto Play Toggle */}
        <button
          onClick={() => onAutoPlayChange?.(!autoPlay)}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg"
          style={{
            backgroundColor: autoPlay ? 'rgba(201, 169, 98, 0.2)' : 'transparent',
            border: autoPlay ? '1px solid rgba(201, 169, 98, 0.3)' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: autoPlay ? '#C9A962' : 'rgba(255,255,255,0.2)',
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: autoPlay ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                transition: 'all 0.2s',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            自動播放
          </span>
        </button>
      </div>
    </div>
  );
}
