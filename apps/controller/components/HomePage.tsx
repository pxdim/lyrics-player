'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          歌詞播放器控制器
        </h1>

        <form onSubmit={handleConnect} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              輸入 Session 代碼
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setCode(value.slice(0, 6));
              }}
              className="w-full px-4 py-3 text-2xl text-center tracking-widest border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              placeholder="ABC123"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {isLoading ? '連線中...' : '連線'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          <button
            onClick={handleCreateSession}
            disabled={isLoading}
            className="mt-6 w-full bg-gray-100 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-gray-300"
          >
            建立新的 Session
          </button>
        </div>
      </div>
    </div>
  );
}
