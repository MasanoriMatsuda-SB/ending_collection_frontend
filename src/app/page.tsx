'use client';

import { useAuth } from '@/lib/AuthContext';
import Button from "@/components/Button";

export default function HomePage() {
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload(); // force refresh to update context
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex items-center space-x-4">
        <h1 className="text-4xl font-bold text-gray-900">meme mori</h1>
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt="User Icon"
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
          />
        )}
      </div>
      {user?.sub ? (
        <>
          <p className="text-xl mb-8 text-gray-900">ようこそ、{user.sub}さん</p>
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
