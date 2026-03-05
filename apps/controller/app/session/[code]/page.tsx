'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseClient, Lyric, Session, DisplayState, StyleConfig, DEFAULT_STYLE, THEME_PRESETS, useLyricsPlayerShortcuts, formatTime, parseTime, DESIGN_TOKENS } from 'shared';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Sidebar from '@/components/Sidebar';
import StylePanel from '@/components/StylePanel';
import LyricPreview from '@/components/LyricPreview';
import AISearchModal from '@/components/AISearchModal';
import MobileNavigation, { MobileTab } from '@/components/MobileNavigation';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  // Mobile state
  const [mobileTab, setMobileTab] = useState<MobileTab>('lyrics');

  // State
  const [session, setSession] = useState<Session | null>(null);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [displayState, setDisplayState] = useState<DisplayState>({
    currentIndex: null,
    isVisible: true,
    opacity: 1,
    isFadingIn: false,
    isFadingOut: false,
  });
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(DEFAULT_STYLE);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [supabase] = useState(() => createSupabaseClient());

  // Search states
  const [showAISearch, setShowAISearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ songName: string; artist: string }[]>([]);

  // UI State
  const [currentThemeId, setCurrentThemeId] = useState('worship-warm');
  const [displayMode, setDisplayMode] = useState<'audience' | 'stage'>('stage');
  const [showChords, setShowChords] = useState(true);
  const [transpose, setTranspose] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Timer state
  const [timerDuration, setTimerDuration] = useState(300); // 5 minutes default
  const [timerRemaining, setTimerRemaining] = useState(300);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (timerIsRunning && timerRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setTimerIsRunning(false);
            // Timer finished - play sound or show alert
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerIsRunning, timerRemaining]);

  // Broadcast timer state
  useEffect(() => {
    if (session) {
      supabase.channel(`session:${session.id}`).send({
        type: 'broadcast',
        event: 'timer_state',
        payload: {
          duration: timerDuration,
          remaining: timerRemaining,
          isRunning: timerIsRunning,
        },
      });
    }
  }, [timerDuration, timerRemaining, timerIsRunning, session]);

  const timerDisplay = formatTime(timerRemaining);

  // Load session and lyrics
  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionResponse = await fetch(`/api/session/validate?code=${code}`);
        if (!sessionResponse.ok) {
          router.push('/');
          return;
        }

        const sessionData = await sessionResponse.json();
        setSession(sessionData.session);

        const { data: lyricsData } = await supabase
          .from('lyrics')
          .select('*')
          .eq('session_id', sessionData.session.id)
          .order('order_index');

        if (lyricsData) {
          setLyrics(lyricsData);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [code, supabase, router]);

  // Setup realtime subscription
  useEffect(() => {
    if (!session) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      channel = supabase
        .channel(`session:${session.id}`)
        .on(
          'broadcast' as any,
          { event: 'display_state' },
          (payload: { payload?: DisplayState }) => {
            if (payload.payload) {
              setDisplayState(payload.payload);
            }
          }
        )
        .on(
          'broadcast' as any,
          { event: 'style' },
          (payload: { payload?: StyleConfig }) => {
            if (payload.payload) {
              setStyleConfig(payload.payload);
            }
          }
        )
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'lyrics',
            filter: `session_id=eq.${session.id}`,
          },
          async () => {
            const { data } = await supabase
              .from('lyrics')
              .select('*')
              .eq('session_id', session.id)
              .order('order_index');

            if (data) {
              setLyrics(data);
            }
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
          if (status === 'SUBSCRIBED') {
            setDeviceCount((prev) => prev + 1);
          }
        });
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [session, supabase]);

  // Broadcast display state changes
  const broadcastDisplayState = (newState: Partial<DisplayState>) => {
    const updated = { ...displayState, ...newState };
    setDisplayState(updated);
    if (session) {
      supabase.channel(`session:${session.id}`).send({
        type: 'broadcast',
        event: 'display_state',
        payload: updated,
      });
    }
  };

  // Broadcast style changes
  const broadcastStyle = (newStyle: Partial<StyleConfig>) => {
    const updated = { ...styleConfig, ...newStyle };
    setStyleConfig(updated);
    if (session) {
      supabase.channel(`session:${session.id}`).send({
        type: 'broadcast',
        event: 'style',
        payload: updated,
      });
    }
  };

  const handleSelectLyric = (index: number) => {
    broadcastDisplayState({ currentIndex: index, isVisible: true });
  };

  const handleStyleChange = (updates: Partial<StyleConfig>) => {
    broadcastStyle(updates);
  };

  const handleThemeSelect = (themeId: string) => {
    const theme = THEME_PRESETS.find((t) => t.id === themeId);
    if (theme) {
      setCurrentThemeId(themeId);
      broadcastStyle(theme.style);
    }
  };

  const handlePrevious = () => {
    if (displayState.currentIndex !== null && displayState.currentIndex > 0) {
      broadcastDisplayState({ currentIndex: displayState.currentIndex - 1 });
    }
  };

  const handleNext = () => {
    if (displayState.currentIndex === null && lyrics.length > 0) {
      broadcastDisplayState({ currentIndex: 0 });
    } else if (displayState.currentIndex !== null && displayState.currentIndex < lyrics.length - 1) {
      broadcastDisplayState({ currentIndex: displayState.currentIndex + 1 });
    }
  };

  const handleToggleVisibility = () => {
    broadcastDisplayState({ isVisible: !displayState.isVisible });
  };

  const handleFadeIn = () => {
    broadcastDisplayState({
      isFadingIn: true,
      isFadingOut: false,
      isVisible: true,
      opacity: 1,
    });
  };

  const handleFadeOut = () => {
    broadcastDisplayState({
      isFadingOut: true,
      isFadingIn: false,
      opacity: 0,
    });
  };

  const handleEmergencyClear = () => {
    broadcastDisplayState({
      currentIndex: null,
      isVisible: false,
      opacity: 0,
      isFadingIn: false,
      isFadingOut: false,
    });
  };

  // Broadcast chord settings
  const broadcastChordSettings = (settings: { showChords?: boolean; transpose?: number }) => {
    if (session) {
      supabase.channel(`session:${session.id}`).send({
        type: 'broadcast',
        event: 'chord_settings',
        payload: settings,
      });
    }
  };

  const handleToggleChords = () => {
    const newShowChords = !showChords;
    setShowChords(newShowChords);
    broadcastChordSettings({ showChords: newShowChords, transpose });
  };

  const handleTransposeChange = (newTranspose: number) => {
    setTranspose(newTranspose);
    broadcastChordSettings({ showChords, transpose: newTranspose });
  };

  // Timer handlers
  const handleTimerToggle = () => {
    if (timerRemaining === 0) {
      setTimerRemaining(timerDuration);
    }
    setTimerIsRunning(!timerIsRunning);
  };

  const handleTimerReset = () => {
    setTimerIsRunning(false);
    setTimerRemaining(timerDuration);
  };

  const handleTimerDurationChange = (minutes: number) => {
    const newDuration = minutes * 60;
    setTimerDuration(newDuration);
    if (!timerIsRunning) {
      setTimerRemaining(newDuration);
    }
  };

  // AI Search functions
  const handleSearchOptions = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !session) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch('/api/lyrics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          mode: 'search',
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const { options } = await response.json();
      setSearchResults(options || []);
    } catch (error) {
      console.error('Error searching:', error);
      alert('搜尋失敗，請再試一次');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportLyrics = async (songName: string, artist: string) => {
    if (!session) return;

    setIsSearching(true);

    try {
      const response = await fetch('/api/lyrics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'lyrics',
          songName,
          artist,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch lyrics');
      }

      const { lyrics: foundLyrics } = await response.json();

      if (!foundLyrics || foundLyrics.length === 0) {
        alert('未找到歌詞，請嘗試其他歌曲');
        setIsSearching(false);
        return;
      }

      // Backup existing lyrics before delete in case insert fails
      const { data: existingLyrics } = await supabase
        .from('lyrics')
        .select('*')
        .eq('session_id', session.id);

      // Delete existing and insert new
      const { error: deleteError } = await supabase
        .from('lyrics')
        .delete()
        .eq('session_id', session.id);

      if (deleteError) throw deleteError;

      const lyricsToInsert = foundLyrics.map((lyric: { text: string; notes?: string }) => ({
        id: crypto.randomUUID(),
        session_id: session.id,
        text: lyric.text,
        notes: lyric.notes || null,
        order_index: foundLyrics.indexOf(lyric),
      }));

      const { error: insertError } = await supabase.from('lyrics').insert(lyricsToInsert);
      if (insertError) {
        // Restore from backup if insert fails
        if (existingLyrics && existingLyrics.length > 0) {
          await supabase.from('lyrics').insert(existingLyrics);
        }
        throw insertError;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      broadcastDisplayState({
        currentIndex: 0,
        isVisible: true,
        opacity: 1,
        isFadingIn: false,
        isFadingOut: false,
      });

      setShowAISearch(false);
      setSearchQuery('');
      setSearchResults([]);

      alert(`成功匯入「${songName}」- ${foundLyrics.length} 行歌詞`);
    } catch (error) {
      console.error('Error importing lyrics:', error);
      alert(error instanceof Error ? error.message : '匯入歌詞失敗');
    } finally {
      setIsSearching(false);
    }
  };

  // Keyboard shortcuts
  useLyricsPlayerShortcuts(
    {
      onPrevious: handlePrevious,
      onNext: handleNext,
      onToggleVisibility: handleToggleVisibility,
      onFadeIn: handleFadeIn,
      onFadeOut: handleFadeOut,
      onEmergencyClear: handleEmergencyClear,
      onJumpToLyric: (index) => {
        if (index >= 0 && index < lyrics.length) {
          handleSelectLyric(index);
        }
      },
    },
    true,
    lyrics.length
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="text-white">載入中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          sessionCode={code}
          isConnected={isConnected}
          deviceCount={deviceCount}
          lyrics={lyrics}
          currentIndex={displayState.currentIndex}
          onShowAISearch={() => setShowAISearch(true)}
          onAddSong={() => setShowAISearch(true)}
          onSelectLyric={handleSelectLyric}
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation currentTab={mobileTab} onTabChange={setMobileTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0">
        {/* Mobile: Show content based on tab */}
        <div className={`${mobileTab === 'lyrics' ? 'flex' : 'hidden'} md:flex flex-1`}>
          <LyricPreview
            lyrics={lyrics}
            currentIndex={displayState.currentIndex}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            showChords={showChords}
            onToggleChords={handleToggleChords}
            transpose={transpose}
            timerDisplay={timerDisplay}
            timerIsRunning={timerIsRunning}
            timerRemaining={timerRemaining}
            onTimerToggle={handleTimerToggle}
            onTimerReset={handleTimerReset}
            onTimerDurationChange={handleTimerDurationChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            isPlaying={isPlaying}
          />
        </div>

        {/* Mobile Playlist Tab */}
        <div className={`${mobileTab === 'playlist' ? 'flex' : 'hidden'} md:hidden flex-1 overflow-y-auto p-4`}>
          <div className="space-y-2">
            {lyrics.map((lyric, index) => {
              const isActive = displayState.currentIndex === index;
              return (
                <button
                  key={lyric.id}
                  onClick={() => {
                    handleSelectLyric(index);
                    setMobileTab('lyrics');
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: isActive ? DESIGN_TOKENS.colors.accent : DESIGN_TOKENS.colors.panel,
                  }}
                >
                  <span
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize.md,
                      fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                      color: isActive ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.tertiary,
                      opacity: isActive ? 1 : 0.5,
                      minWidth: '30px',
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
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
                    {lyric.text}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style Panel - Desktop always visible, Mobile only on style tab */}
        <div className={`${mobileTab === 'style' ? 'flex' : 'hidden'} md:flex`}>
          <StylePanel
            style={styleConfig}
            currentThemeId={currentThemeId}
            onStyleChange={handleStyleChange}
            onThemeSelect={handleThemeSelect}
            isEditing={false}
            onToggleEdit={() => {}}
            transpose={transpose}
            onTransposeChange={handleTransposeChange}
            showChords={showChords}
            onToggleChords={handleToggleChords}
          />
        </div>
      </div>

      {/* AI Search Modal */}
      <AISearchModal
        isOpen={showAISearch}
        onClose={() => {
          setShowAISearch(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
        onAddSong={(song) => {
          handleImportLyrics(song.songName, song.artist);
        }}
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        onSearchChange={setSearchQuery}
        onSearch={handleSearchOptions}
      />
    </div>
  );
}
