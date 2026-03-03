'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Lyric, Session, DisplayState, StyleConfig, DEFAULT_STYLE } from 'shared';
import LyricList from '@/components/LyricList';
import ControlPanel from '@/components/ControlPanel';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

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
  const [supabase] = useState(() => createSupabaseClient());

  // New lyric form state
  const [newLyricText, setNewLyricText] = useState('');
  const [newLyricNotes, setNewLyricNotes] = useState('');
  const [isAddingLyric, setIsAddingLyric] = useState(false);

  // Edit lyric state
  const [editingLyric, setEditingLyric] = useState<Lyric | null>(null);
  const [editText, setEditText] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Validate session
        const sessionResponse = await fetch(`/api/session/validate?code=${code}`);
        if (!sessionResponse.ok) {
          router.push('/');
          return;
        }

        const sessionData = await sessionResponse.json();
        setSession(sessionData.session);

        // Fetch lyrics
        const { data: lyricsData } = await supabase
          .from('lyrics')
          .select('*')
          .eq('session_id', sessionData.session.id)
          .order('order_index');

        if (lyricsData) {
          setLyrics(lyricsData);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching session data:', error);
        router.push('/');
      }
    };

    fetchSessionData();
  }, [code, router, supabase]);

  // Setup Realtime subscription
  useEffect(() => {
    if (!session) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      channel = supabase
        .channel(`session:${session.id}`)
        .on(
          'broadcast',
          { event: 'display_state' },
          (payload: { payload?: DisplayState }) => {
            if (payload.payload) {
              setDisplayState(payload.payload);
            }
          }
        )
        .on(
          'broadcast',
          { event: 'style' },
          (payload: { payload?: StyleConfig }) => {
            if (payload.payload) {
              setStyleConfig(payload.payload);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lyrics',
            filter: `session_id=eq.${session.id}`,
          },
          async () => {
            // Refresh lyrics on any change
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
  const broadcastDisplayState = (newState: DisplayState) => {
    setDisplayState(newState);
    if (session && isConnected) {
      supabase.channel(`session:${session.id}`).send({
        type: 'broadcast',
        event: 'display_state',
        payload: newState,
      });
    }
  };

  // Broadcast style changes
  const broadcastStyle = (newStyle: StyleConfig) => {
    setStyleConfig(newStyle);
    if (session && isConnected) {
      supabase.channel(`session:${session.id}`).send({
        type: 'broadcast',
        event: 'style',
        payload: newStyle,
      });
    }
  };

  // Control handlers
  const handlePrevious = () => {
    if (displayState.currentIndex !== null && displayState.currentIndex > 0) {
      broadcastDisplayState({
        ...displayState,
        currentIndex: displayState.currentIndex - 1,
      });
    }
  };

  const handleNext = () => {
    if (displayState.currentIndex === null && lyrics.length > 0) {
      broadcastDisplayState({
        ...displayState,
        currentIndex: 0,
      });
    } else if (displayState.currentIndex !== null && displayState.currentIndex < lyrics.length - 1) {
      broadcastDisplayState({
        ...displayState,
        currentIndex: displayState.currentIndex + 1,
      });
    }
  };

  const handleToggleVisibility = () => {
    broadcastDisplayState({
      ...displayState,
      isVisible: !displayState.isVisible,
    });
  };

  const handleFadeIn = () => {
    broadcastDisplayState({
      ...displayState,
      isFadingIn: true,
      isFadingOut: false,
      isVisible: true,
      opacity: 1,
    });
  };

  const handleFadeOut = () => {
    broadcastDisplayState({
      ...displayState,
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

  // Lyric CRUD operations
  const handleAddLyric = async (e: FormEvent) => {
    e.preventDefault();

    if (!newLyricText.trim() || !session) return;

    setIsAddingLyric(true);

    try {
      const { error } = await supabase.from('lyrics').insert({
        id: crypto.randomUUID(),
        session_id: session.id,
        text: newLyricText.trim(),
        notes: newLyricNotes.trim() || null,
        order_index: lyrics.length,
      });

      if (error) throw error;

      setNewLyricText('');
      setNewLyricNotes('');
    } catch (error) {
      console.error('Error adding lyric:', error);
      alert('新增歌詞失敗');
    } finally {
      setIsAddingLyric(false);
    }
  };

  const handleEditLyric = async (e: FormEvent) => {
    e.preventDefault();

    if (!editingLyric) return;

    try {
      const { error } = await supabase
        .from('lyrics')
        .update({
          text: editText.trim(),
          notes: editNotes.trim() || null,
        })
        .eq('id', editingLyric.id);

      if (error) throw error;

      setEditingLyric(null);
      setEditText('');
      setEditNotes('');
    } catch (error) {
      console.error('Error updating lyric:', error);
      alert('更新歌詞失敗');
    }
  };

  const handleDeleteLyric = async (id: string) => {
    if (!confirm('確定要刪除這首詞嗎？')) return;

    try {
      const { error } = await supabase.from('lyrics').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting lyric:', error);
      alert('刪除歌詞失敗');
    }
  };

  const handleEditClick = (lyric: Lyric) => {
    setEditingLyric(lyric);
    setEditText(lyric.text);
    setEditNotes(lyric.notes || '');
  };

  // Handle click on lyric to select it
  const handleLyricClick = (index: number) => {
    broadcastDisplayState({
      ...displayState,
      currentIndex: index,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">歌詞播放器控制器</h1>
            <p className="text-sm text-gray-500">Session 代碼: {code}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`} />
              {isConnected ? '已連線' : '連線中...'}
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              返回首頁
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Lyric List */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4">歌詞列表</h2>

              {/* Add Lyric Form */}
              <form onSubmit={handleAddLyric} className="mb-6 space-y-3">
                <input
                  type="text"
                  value={newLyricText}
                  onChange={(e) => setNewLyricText(e.target.value)}
                  placeholder="輸入歌詞文字..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                <input
                  type="text"
                  value={newLyricNotes}
                  onChange={(e) => setNewLyricNotes(e.target.value)}
                  placeholder="備註（選填）..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isAddingLyric || !newLyricText.trim()}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isAddingLyric ? '新增中...' : '新增歌詞'}
                </button>
              </form>

              {/* Lyric List */}
              <LyricList
                lyrics={lyrics}
                currentIndex={displayState.currentIndex}
                onEdit={handleEditClick}
                onDelete={handleDeleteLyric}
              />
            </div>

            {/* Style Config */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4">樣式設定</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    字型大小
                  </label>
                  <input
                    type="range"
                    min="24"
                    max="96"
                    value={styleConfig.fontSize}
                    onChange={(e) =>
                      broadcastStyle({
                        ...styleConfig,
                        fontSize: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{styleConfig.fontSize}px</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    文字顏色
                  </label>
                  <input
                    type="color"
                    value={styleConfig.color}
                    onChange={(e) =>
                      broadcastStyle({
                        ...styleConfig,
                        color: e.target.value,
                      })
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    文字對齊
                  </label>
                  <div className="flex gap-2">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() =>
                          broadcastStyle({
                            ...styleConfig,
                            textAlign: align,
                          })
                        }
                        className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                          styleConfig.textAlign === align
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {align === 'left' ? '靠左' : align === 'center' ? '置中' : '靠右'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    背景類型
                  </label>
                  <select
                    value={styleConfig.background.type}
                    onChange={(e) =>
                      broadcastStyle({
                        ...styleConfig,
                        background: {
                          ...styleConfig.background,
                          type: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  >
                    <option value="transparent">透明</option>
                    <option value="solid">純色</option>
                    <option value="gradient">漸層</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Control Panel */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <ControlPanel
              lyrics={lyrics}
              currentIndex={displayState.currentIndex}
              isVisible={displayState.isVisible}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToggleVisibility={handleToggleVisibility}
              onFadeIn={handleFadeIn}
              onFadeOut={handleFadeOut}
              onEmergencyClear={handleEmergencyClear}
            />
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingLyric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">編輯歌詞</h3>

            <form onSubmit={handleEditLyric} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  歌詞文字
                </label>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備註
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all"
                >
                  儲存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingLyric(null);
                    setEditText('');
                    setEditNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
