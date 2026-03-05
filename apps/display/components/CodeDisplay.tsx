'use client';

import { useState, useEffect } from 'react';

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function CodeDisplay() {
  const [code] = useState(() => generateSessionCode());
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    // Register this session in the database
    fetch('/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
      .then(res => res.json())
      .then(data => {
        console.log('Session registered:', data);
        setRegistered(true);
      })
      .catch(err => {
        console.error('Failed to register session:', err);
      });
  }, [code]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">歌詞顯示端</h1>

      <div className="bg-gray-800 rounded-2xl p-12 shadow-2xl">
        <p className="text-xl mb-4 text-gray-300">請在控制端輸入此連接碼：</p>
        <div className="text-8xl font-mono font-bold tracking-wider text-center py-8">
          {code.slice(0, 3)}-{code.slice(3)}
        </div>
      </div>

      <p className="mt-8 text-gray-400">
        {registered ? '等待連接...' : '正在註冊...'}
      </p>
      <p className="mt-2 text-gray-500 text-sm">Session ID: {code}</p>
    </div>
  );
}
