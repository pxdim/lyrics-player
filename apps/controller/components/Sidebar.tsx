'use client';

import { Lyric } from 'shared';
import { DESIGN_TOKENS } from 'shared';
import { Copy, Music, Sparkles, Plus, Play } from 'lucide-react';

interface SidebarProps {
  sessionCode: string;
  isConnected: boolean;
  deviceCount: number;
  lyrics: Lyric[];
  currentIndex: number | null;
  onShowAISearch: () => void;
  onAddSong: () => void;
  onSelectLyric: (index: number) => void;
}

export default function Sidebar({
  sessionCode,
  isConnected,
  deviceCount,
  lyrics,
  currentIndex,
  onShowAISearch,
  onAddSong,
  onSelectLyric,
}: SidebarProps) {
  const copyCode = () => {
    navigator.clipboard.writeText(sessionCode);
  };

  return (
    <div
      className="flex flex-col"
      style={{
        width: DESIGN_TOKENS.layout.sidebarWidth,
        backgroundColor: DESIGN_TOKENS.colors.panel,
        borderRight: `1px solid ${DESIGN_TOKENS.colors.panelBorder}`,
      }}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <p
          style={{
            fontSize: DESIGN_TOKENS.fontSize.xs,
            color: DESIGN_TOKENS.colors.text.tertiary,
            fontWeight: DESIGN_TOKENS.fontWeight.medium,
            letterSpacing: '1px',
          }}
        >
          SESSION CODE
        </p>
        <div
          className="flex items-center gap-3 mt-2 p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
          onClick={copyCode}
          role="button"
          tabIndex={0}
          aria-label="複製會議代碼"
          onKeyDown={(e) => e.key === 'Enter' && copyCode()}
        >
          <span
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xl,
              fontWeight: DESIGN_TOKENS.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.text.primary,
            }}
          >
            {sessionCode}
          </span>
          <Copy size={18} color={DESIGN_TOKENS.colors.text.tertiary} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? DESIGN_TOKENS.colors.success : DESIGN_TOKENS.colors.error,
            }}
          />
          <span
            style={{
              fontSize: DESIGN_TOKENS.fontSize.sm,
              color: DESIGN_TOKENS.colors.text.tertiary,
            }}
          >
            {deviceCount} devices connected
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

      {/* Playlist Header */}
      <div className="flex items-center justify-between p-5 pb-2">
        <span
          style={{
            fontSize: DESIGN_TOKENS.fontSize.md,
            fontWeight: DESIGN_TOKENS.fontWeight.semibold,
            color: DESIGN_TOKENS.colors.text.primary,
          }}
        >
          Set List
        </span>
        <button
          className="p-2 rounded-lg hover:opacity-80 transition-opacity"
          style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
          onClick={onAddSong}
          aria-label="添加歌曲"
        >
          <Plus size={16} color={DESIGN_TOKENS.colors.text.tertiary} />
        </button>
      </div>

      {/* Playlist Items */}
      <div className="flex-1 overflow-y-auto px-2 py-2" role="list" aria-label="播放列表">
        {lyrics.map((lyric, index) => {
          const isActive = currentIndex === index;
          return (
            <button
              key={lyric.id}
              onClick={() => onSelectLyric(index)}
              className="flex items-center gap-3 w-full p-3 rounded-lg transition-all mb-1"
              style={{
                backgroundColor: isActive ? DESIGN_TOKENS.colors.accent : 'transparent',
              }}
              role="listitem"
              aria-label={`歌詞 ${index + 1}${isActive ? '，正在播放' : ''}`}
              aria-current={isActive ? 'true' : undefined}
            >
              <span
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.md,
                  fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                  color: isActive ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.tertiary,
                  opacity: isActive ? 1 : 0.5,
                  minWidth: '20px',
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 text-left">
                <p
                  style={{
                    fontSize: DESIGN_TOKENS.fontSize.sm,
                    fontWeight: DESIGN_TOKENS.fontWeight.medium,
                    color: isActive ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.secondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lyric.text.slice(0, 30)}
                  {lyric.text.length > 30 ? '...' : ''}
                </p>
              </div>
              {isActive && <Play size={16} color={DESIGN_TOKENS.colors.text.primary} />}
            </button>
          );
        })}
      </div>

      {/* AI Search Button */}
      <button
        className="m-4 p-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90"
        style={{
          backgroundColor: DESIGN_TOKENS.colors.feature,
        }}
        onClick={onShowAISearch}
        aria-label="AI 搜歌"
      >
        <Sparkles size={18} color={DESIGN_TOKENS.colors.text.primary} />
        <span
          style={{
            fontSize: DESIGN_TOKENS.fontSize.md,
            fontWeight: DESIGN_TOKENS.fontWeight.medium,
            color: DESIGN_TOKENS.colors.text.primary,
          }}
        >
          AI 搜歌
        </span>
      </button>
    </div>
  );
}
