'use client';

import { useState, FormEvent } from 'react';
import { X, Search, Mic, Plus, Download } from 'lucide-react';
import { DESIGN_TOKENS } from 'shared';

interface SearchResult {
  songName: string;
  artist: string;
}

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSong: (song: SearchResult) => void;
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  onSearch: (e?: FormEvent) => void | Promise<void>;
}

export default function AISearchModal({
  isOpen,
  onClose,
  onAddSong,
  searchQuery,
  searchResults,
  isSearching,
  onSearchChange,
  onSearch,
}: AISearchModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-[480px] rounded-3xl overflow-hidden"
        style={{ backgroundColor: DESIGN_TOKENS.colors.panel, border: `1px solid ${DESIGN_TOKENS.colors.panelBorder}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2
            style={{
              fontSize: DESIGN_TOKENS.fontSize.lg,
              fontWeight: DESIGN_TOKENS.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.text.primary,
            }}
          >
            AI 搜歌
          </h2>
          <button onClick={onClose}>
            <X size={20} color={DESIGN_TOKENS.colors.text.tertiary} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Search Input */}
        <div className="p-6">
          <form onSubmit={onSearch}>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ backgroundColor: DESIGN_TOKENS.colors.background }}
            >
              <Search size={20} color={DESIGN_TOKENS.colors.text.tertiary} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="輸入歌名或歌手..."
                className="flex-1 bg-transparent outline-none"
                style={{ color: DESIGN_TOKENS.colors.text.primary }}
              />
              <button
                type="submit"
                className="p-2 rounded-lg hover:bg-gray-800"
                disabled={isSearching}
              >
                <Mic size={18} color={DESIGN_TOKENS.colors.feature} />
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        <div className="px-6 pb-4 max-h-[400px] overflow-y-auto">
          {isSearching ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: DESIGN_TOKENS.fontSize.md,
                        fontWeight: DESIGN_TOKENS.fontWeight.medium,
                        color: DESIGN_TOKENS.colors.text.primary,
                      }}
                    >
                      {result.songName}
                    </p>
                    <p
                      style={{
                        fontSize: DESIGN_TOKENS.fontSize.sm,
                        color: DESIGN_TOKENS.colors.text.tertiary,
                      }}
                    >
                      {result.artist}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAddSong(result)}
                      disabled={isSearching}
                      className="p-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                      style={{ backgroundColor: DESIGN_TOKENS.colors.accent }}
                    >
                      <Plus size={16} color={DESIGN_TOKENS.colors.text.primary} />
                    </button>
                    <button
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
                    >
                      <Download size={16} color={DESIGN_TOKENS.colors.text.tertiary} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8">
              <p style={{ color: DESIGN_TOKENS.colors.text.tertiary }}>沒有找到結果</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{ color: DESIGN_TOKENS.colors.text.tertiary }}>輸入歌名開始搜尋</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderTop: `1px solid ${DESIGN_TOKENS.colors.panelBorder}` }}
        >
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: DESIGN_TOKENS.colors.input, color: DESIGN_TOKENS.colors.text.secondary }}
          >
            取消
          </button>
          <button
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: DESIGN_TOKENS.colors.accent, color: DESIGN_TOKENS.colors.text.primary }}
          >
            匯入選取歌曲
          </button>
        </div>
      </div>
    </div>
  );
}
