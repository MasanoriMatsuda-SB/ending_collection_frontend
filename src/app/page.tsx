// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
//import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import Button from "@/components/Button";

interface JwtPayload {
  sub: string;
  photoURL?: string | null;
  exp: number;
  iat: number;
}

export default function HomePage() {
  //const [username, setUsername] = useState<string | null>(null);
  //const [photoURL, setPhotoURL] = useState<string | null>(null);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   if (token) {
  //     try {
  //       const decoded = jwtDecode<JwtPayload>(token);
  //       // setUsername(decoded.sub);
  //       // setPhotoURL(decoded.photoURL ?? null);
  //     } catch (error) {
  //       console.error('JWT decode error:', error);
  //     }
  //   }
  // }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    // setUsername(null);
    // setPhotoURL(null);
    window.location.reload(); // force refresh to update contextミッキーブランチに存在してます
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      {user? (
        <>
          <p className="text-xl mb-8 text-gray-900">ようこそ、{user.sub}さん</p>
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt="User Icon"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 mb-6"
            />
          )}
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
        <h1 className="text-4xl font-bold text-gray-900">meme mori</h1>
        <p className="text-xl mb-8 text-gray-900">
          終活アルバムアプリ
        </p>
        <img
          src="/cover.png"
          alt="Cover Icon"
          className="mx-auto mb-6 h-[300px]"
        />
        <Button title="新規アカウント作成" href="/signup" variant="main" />
        <Button title="ログイン" href="/login" variant="sub" />
      </>
      )}
    </div>
  );
}
