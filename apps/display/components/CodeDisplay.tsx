'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient, generateSessionCode } from 'shared';

export function CodeDisplay() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 生成新 session
    const initSession = async () => {
      const newCode = generateSessionCode();
      setCode(newCode);

      const supabase = createSupabaseClient();
      try {
        await supabase.from('sessions').insert({
          id: crypto.randomUUID(),
          code: newCode,
        });
      } catch (error) {
        console.error('Failed to create session:', error);
      }
      setLoading(false);
    };

    initSession();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-2xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">歌詞顯示端</h1>

      <div className="bg-gray-800 rounded-2xl p-12 shadow-2xl">
        <p className="text-xl mb-4 text-gray-300">請在控制端輸入此連接碼：</p>
        <div className="text-8xl font-mono font-bold tracking-wider text-center py-8">
          {code.slice(0, 3)}-{code.slice(3)}
        </div>
      </div>

      <p className="mt-8 text-gray-400">等待連接...</p>
    </div>
  );
}
