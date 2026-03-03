import { Lyric } from 'shared';

interface ControlPanelProps {
  lyrics: Lyric[];
  currentIndex: number | null;
  isVisible: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleVisibility: () => void;
  onFadeIn: () => void;
  onFadeOut: () => void;
  onEmergencyClear: () => void;
}

export default function ControlPanel({
  lyrics,
  currentIndex,
  isVisible,
  onPrevious,
  onNext,
  onToggleVisibility,
  onFadeIn,
  onFadeOut,
  onEmergencyClear,
}: ControlPanelProps) {
  const currentLyric = currentIndex !== null ? lyrics[currentIndex] : null;
  const hasPrevious = currentIndex !== null && currentIndex > 0;
  const hasNext = currentIndex !== null && currentIndex < lyrics.length - 1;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Current Lyric Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg min-h-[80px] flex items-center justify-center">
        {currentLyric ? (
          <p className="text-2xl text-center font-medium text-gray-800">
            {currentLyric.text}
          </p>
        ) : (
          <p className="text-lg text-gray-400 text-center">
            {lyrics.length === 0 ? '無歌詞' : '請選擇一首歌詞'}
          </p>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一首
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          下一首
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Visibility Toggle */}
      <button
        onClick={onToggleVisibility}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all mb-4 ${
          isVisible
            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        {isVisible ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            顯示中
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            已隱藏
          </>
        )}
      </button>

      {/* Fade Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={onFadeIn}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          淡入
        </button>

        <button
          onClick={onFadeOut}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          淡出
        </button>
      </div>

      {/* Emergency Clear */}
      <button
        onClick={onEmergencyClear}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        緊急清除
      </button>

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>總歌詞數：{lyrics.length}</span>
          <span>
            當前：
            {currentIndex !== null ? `${currentIndex + 1} / ${lyrics.length}` : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
