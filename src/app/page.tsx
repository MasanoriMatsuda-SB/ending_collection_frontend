// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';

interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
}

export default function HomePage() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUsername(decoded.sub);
      } catch (error) {
        console.error('JWT decode error:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUsername(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">Ending Collection</h1>
      {username ? (
        <>
          <p className="text-xl mb-8 text-gray-900">ようこそ、{username}さん</p>
          <div className="flex space-x-4 mb-4">
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
              機能A
            </button>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
              機能B
            </button>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
              機能C
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            ログアウト
          </button>
        </>
      ) : (
        <>
          <p className="text-xl mb-8 text-gray-900">
            ログインをお願いいたします。初めてのご利用の場合は会員登録をお願いいたします。
          </p>
          <div className="flex space-x-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              会員登録
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
