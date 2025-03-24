'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Button from "@/components/Button";

interface JwtPayload {
  sub: string;
  photoURL?: string | null;
  exp: number;
  iat: number;
}

export default function HomePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUsername(decoded.sub);
        setPhotoURL(decoded.photoURL ?? null);
      } catch (error) {
        console.error('JWT decode error:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUsername(null);
    setPhotoURL(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex items-center space-x-4">
        <h1 className="text-4xl font-bold text-gray-900">meme mori</h1>
        {photoURL && (
          <img
            src={photoURL}
            alt="User Icon"
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
          />
        )}
      </div>
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
            終活アルバムアプリ
          </p>
          <img
            src="/cover.png"
            alt="Cover Icon"
            className="mx-auto mb-6 h-[200px]"
          />
          <Button title="新規アカウント作成" href="/signup" variant="main" />
          <Button title="ログイン" href="/login" variant="sub" />
        </>
      )}
    </div>
  );
}
