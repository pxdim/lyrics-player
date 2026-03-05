'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [displayCode, setDisplayCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('請輸入 6 位數代碼');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/session/validate?code=${code.toUpperCase()}`);
      if (response.ok) {
        router.push(`/session/${code.toUpperCase()}`);
      } else {
        setError('找不到該 session，請檢查代碼是否正確');
      }
    } catch {
      setError('連線失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // First remove existing dashes and non-alphanumeric chars
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const truncated = cleaned.slice(0, 6);
    setCode(truncated);

    // Display with dash for better UX (XXX-XXX format)
    if (truncated.length >= 3) {
      setDisplayCode(truncated.slice(0, 3) + '-' + truncated.slice(3));
    } else {
      setDisplayCode(truncated);
    }
  };

  const handleCreateSession = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/session/create', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        router.push(`/session/${data.code}`);
      } else {
        setError('建立 session 失敗，請稍後再試');
      }
    } catch {
      setError('連線失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      {/* Subtle noise texture */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}></div>

      {/* Subtle ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/2 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8 w-full max-w-md shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10">
            <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4V7h4V3h-6z"/>
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-center mb-8 text-white tracking-tight">
          歌詞播放器控制器
        </h1>

        <form onSubmit={handleConnect} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wide">
              輸入 Session 代碼
            </label>
            <input
              id="code"
              type="text"
              value={displayCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full px-4 py-4 text-2xl text-center tracking-widest bg-white/[0.03] border border-white/10 rounded-xl focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all placeholder:text-white/10 text-white"
              placeholder="ABC-123"
              maxLength={7}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-white text-black py-3.5 rounded-xl font-medium hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-white/10"
          >
            {isLoading ? '連線中...' : '連線'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-zinc-900/80 text-white/30">或</span>
            </div>
          </div>

          <button
            onClick={handleCreateSession}
            disabled={isLoading}
            className="mt-6 w-full bg-white/5 text-white py-3.5 rounded-xl font-medium hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/10"
          >
            建立新的 Session
          </button>
        </div>
      </div>
    </div>
  );
}
