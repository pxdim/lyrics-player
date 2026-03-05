'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X, Search, Mic, Plus, Download, Eye, Check, AlertCircle, Star } from 'lucide-react';
import { DESIGN_TOKENS } from 'shared';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';

interface SearchResult {
  songName: string;
  artist: string;
  confidence?: number;
}

interface LyricLine {
  text: string;
  notes?: string;
}

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSong: (song: SearchResult, lyrics: LyricLine[]) => void;
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  onSearch: (e?: FormEvent) => void | Promise<void>;
  onFetchLyrics: (songName: string, artist: string) => Promise<LyricLine[]>;
  warning?: string;
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
  onFetchLyrics,
  warning,
}: AISearchModalProps) {
  const { user } = useAuth();
  const [selectedSong, setSelectedSong] = useState<SearchResult | null>(null);
  const [previewLyrics, setPreviewLyrics] = useState<LyricLine[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewWarning, setPreviewWarning] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriting, setFavoriting] = useState<Set<string>>(new Set());

  // 載入收藏列表
  const loadFavorites = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/user/favorites');
      if (response.ok) {
        const { favorites: favs } = await response.json();
        setFavorites(new Set(favs.map((f: any) => f.song_name)));
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

  // 當 modal 打開或用戶狀態變化時，載入收藏
  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen, user]);

  const handleToggleFavorite = async (song: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const key = song.songName;
    const isFavorited = favorites.has(key);

    setFavoriting(prev => new Set(prev).add(key));

    try {
      if (isFavorited) {
        // 取消收藏
        await fetch('/api/user/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songName: song.songName }),
        });
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        // 添加收藏
        await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songName: song.songName,
            artist: song.artist,
          }),
        });
        setFavorites(prev => new Set(prev).add(key));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setFavoriting(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  if (!isOpen) return null;

  const handlePreview = async (song: SearchResult) => {
    setSelectedSong(song);
    setIsPreviewLoading(true);
    setPreviewWarning(null);

    try {
      const response = await fetch('/api/lyrics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'lyrics',
          songName: song.songName,
          artist: song.artist,
        }),
      });

      const data = await response.json();

      if (data.error === 'unsure') {
        setPreviewWarning(data.message || '無法確認此歌曲');
        setPreviewLyrics([]);
      } else if (data.lyrics) {
        setPreviewLyrics(data.lyrics);
        setPreviewWarning(data.warning || null);
      } else {
        setPreviewLyrics([]);
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      setPreviewWarning('獲取歌詞預覽失敗');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleAddSong = () => {
    if (selectedSong && previewLyrics.length > 0) {
      onAddSong(selectedSong, previewLyrics);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedSong(null);
    setPreviewLyrics([]);
    setPreviewWarning(null);
    onClose();
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return DESIGN_TOKENS.colors.text.tertiary;
    if (confidence >= 0.8) return '#22c55e'; // green
    if (confidence >= 0.6) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return '';
    if (confidence >= 0.8) return '高信心';
    if (confidence >= 0.6) return '中信心';
    return '低信心';
  };

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={handleClose}
      >
        <div
          className="w-[520px] rounded-3xl overflow-hidden flex flex-col max-h-[85vh]"
          style={{ backgroundColor: DESIGN_TOKENS.colors.panel, border: `1px solid ${DESIGN_TOKENS.colors.panelBorder}` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 shrink-0">
            <div>
              <h2
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.lg,
                  fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                  color: DESIGN_TOKENS.colors.text.primary,
                }}
              >
                {selectedSong ? '預覽歌詞' : 'AI 搜歌'}
              </h2>
              {selectedSong && (
                <p
                  style={{
                    fontSize: DESIGN_TOKENS.fontSize.sm,
                    color: DESIGN_TOKENS.colors.text.tertiary,
                    marginTop: '4px',
                  }}
                >
                  {selectedSong.songName} - {selectedSong.artist}
                </p>
              )}
            </div>
            <button onClick={handleClose}>
              <X size={20} color={DESIGN_TOKENS.colors.text.tertiary} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

          {/* Warning banner */}
          {warning && !selectedSong && (
            <div
              className="mx-6 mt-4 p-3 rounded-xl flex items-start gap-2"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
              <p style={{ fontSize: DESIGN_TOKENS.fontSize.sm, color: '#f59e0b' }}>
                {warning}
              </p>
            </div>
          )}

          {/* Content */}
          {!selectedSong ? (
            <>
              {/* Search Input */}
              <div className="p-6 shrink-0">
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
              <div className="px-6 pb-4 flex-1 overflow-y-auto max-h-[400px]">
                {isSearching ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-xl group"
                        style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              style={{
                                fontSize: DESIGN_TOKENS.fontSize.md,
                                fontWeight: DESIGN_TOKENS.fontWeight.medium,
                                color: DESIGN_TOKENS.colors.text.primary,
                              }}
                            >
                              {result.songName}
                            </p>
                            {result.confidence !== undefined && (
                              <span
                                className="px-2 py-0.5 rounded text-xs"
                                style={{
                                  backgroundColor: `${getConfidenceColor(result.confidence)}20`,
                                  color: getConfidenceColor(result.confidence),
                                }}
                              >
                                {getConfidenceLabel(result.confidence)}
                              </span>
                            )}
                          </div>
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
                            onClick={(e) => handleToggleFavorite(result, e)}
                            disabled={favoriting.has(result.songName)}
                            className="p-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: DESIGN_TOKENS.colors.background }}
                            title={favorites.has(result.songName) ? '取消收藏' : '加入收藏'}
                          >
                            <Star
                              size={16}
                              fill={favorites.has(result.songName) ? DESIGN_TOKENS.colors.accent : 'none'}
                              color={favorites.has(result.songName) ? DESIGN_TOKENS.colors.accent : DESIGN_TOKENS.colors.text.secondary}
                            />
                          </button>
                          <button
                            onClick={() => handlePreview(result)}
                            disabled={isSearching}
                            className="p-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: DESIGN_TOKENS.colors.background }}
                            title="預覽歌詞"
                          >
                            <Eye size={16} color={DESIGN_TOKENS.colors.text.secondary} />
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
            </>
          ) : (
            <>
              {/* Preview Mode */}
              <div className="p-6 flex-1 overflow-y-auto">
                {isPreviewLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
                    <p className="mt-4" style={{ color: DESIGN_TOKENS.colors.text.tertiary }}>
                      獲取歌詞中...
                    </p>
                  </div>
                ) : previewWarning && previewLyrics.length === 0 ? (
                  <div
                    className="text-center py-8 rounded-xl p-6"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <AlertCircle size={32} className="mx-auto mb-3" style={{ color: '#ef4444' }} />
                    <p style={{ color: '#ef4444' }}>{previewWarning}</p>
                    <button
                      onClick={() => setSelectedSong(null)}
                      className="mt-4 px-4 py-2 rounded-lg"
                      style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
                    >
                      返回搜尋
                    </button>
                  </div>
                ) : (
                  <>
                    {previewWarning && (
                      <div
                        className="mb-4 p-3 rounded-xl flex items-start gap-2"
                        style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                      >
                        <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                        <p style={{ fontSize: DESIGN_TOKENS.fontSize.sm, color: '#f59e0b' }}>
                          {previewWarning}
                        </p>
                      </div>
                    )}

                    <div
                      className="rounded-xl p-4 space-y-2 max-h-[50vh] overflow-y-auto"
                      style={{ backgroundColor: DESIGN_TOKENS.colors.background }}
                    >
                      {previewLyrics.slice(0, 30).map((line, index) => (
                        <div
                          key={index}
                          className="flex gap-3"
                        >
                          {line.notes && (
                            <span
                              className="text-xs shrink-0 opacity-60"
                              style={{ minWidth: '60px', color: DESIGN_TOKENS.colors.text.tertiary }}
                            >
                              {line.notes}
                            </span>
                          )}
                          <p
                            style={{
                              fontSize: DESIGN_TOKENS.fontSize.sm,
                              color: line.text ? DESIGN_TOKENS.colors.text.secondary : DESIGN_TOKENS.colors.text.tertiary,
                              lineHeight: 1.6,
                            }}
                          >
                            {line.text || <span className="opacity-40">♪</span>}
                          </p>
                        </div>
                      ))}
                      {previewLyrics.length > 30 && (
                        <p
                          className="text-center pt-2"
                          style={{ fontSize: DESIGN_TOKENS.fontSize.sm, color: DESIGN_TOKENS.colors.text.tertiary }}
                        >
                          ... 還有 {previewLyrics.length - 30} 行
                        </p>
                      )}
                    </div>

                    {/* Action hint */}
                    <div
                      className="mt-4 p-3 rounded-xl flex items-center gap-2"
                      style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                    >
                      <Check size={16} style={{ color: '#22c55e' }} />
                      <p style={{ fontSize: DESIGN_TOKENS.fontSize.sm, color: '#22c55e' }}>
                        確認歌詞正確後，點擊下方「加入歌單」按鈕
                      </p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-between p-4 shrink-0"
            style={{ borderTop: `1px solid ${DESIGN_TOKENS.colors.panelBorder}` }}
          >
            <button
              onClick={selectedSong ? () => setSelectedSong(null) : handleClose}
              className="px-6 py-3 rounded-xl"
              style={{ backgroundColor: DESIGN_TOKENS.colors.input, color: DESIGN_TOKENS.colors.text.secondary }}
            >
              {selectedSong ? '返回' : '取消'}
            </button>
            {selectedSong && previewLyrics.length > 0 && (
              <button
                onClick={handleAddSong}
                className="px-6 py-3 rounded-xl flex items-center gap-2"
                style={{ backgroundColor: DESIGN_TOKENS.colors.accent, color: DESIGN_TOKENS.colors.text.primary }}
              >
                <Plus size={16} />
                加入歌單
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        feature="收藏歌曲"
      />
    </>
  );
}
