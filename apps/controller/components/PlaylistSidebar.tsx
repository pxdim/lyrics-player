'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronRight, Music3 } from 'lucide-react';
import { DESIGN_TOKENS } from 'shared';
import type { SongGroup } from 'shared';

interface PlaylistSidebarProps {
  sessionId: string;
  currentSongIndex: number | null;
  currentLyricIndex: number | null;
  onSongSelect: (songIndex: number, lyricIndex?: number) => void;
  onNextSong: () => void;
  onPreviousSong: () => void;
  onAddSong?: () => void;
}

export function PlaylistSidebar({
  sessionId,
  currentSongIndex,
  currentLyricIndex,
  onSongSelect,
  onNextSong,
  onPreviousSong,
  onAddSong,
}: PlaylistSidebarProps) {
  const [songs, setSongs] = useState<SongGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);

  // 載入歌單
  useEffect(() => {
    const loadPlaylist = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/playlist?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSongs(data.songs || []);
        }
      } catch (error) {
        console.error('Error loading playlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      loadPlaylist();
    }
  }, [sessionId]);

  // 自動播放邏輯
  useEffect(() => {
    if (!autoPlay || currentSongIndex === null) return;

    const interval = setInterval(() => {
      // TODO: 實際的自動播放邏輯
      // 這裡應該根據歌詞長度自動切換
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, currentSongIndex]);

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
                }}
              >
                {/* Song Title */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
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
          onClick={() => setAutoPlay(!autoPlay)}
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
