// app/signup/finish/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Button from "@/components/Button";
import Link from 'next/link';

interface JwtPayload {
  sub: string;
  photoURL?: string | null;
  email?: string;
  exp: number;
  iat: number;
}

export default function HomePage() {
    const [username, setUsername] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [photoURL, setPhotoURL] = useState<string | null>(null);
  
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          setUsername(decoded.sub);
          setEmail(decoded.email ?? '');
          setPhotoURL(decoded.photoURL ?? null);
        } catch (error) {
          console.error('JWT decode error:', error);
        }
      }
    }, []);
  
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
        {username ? (
          <>
            {/* <img src="/check-icon.png" alt="check" className="w-14 h-14 mb-4" /> */}
            <h1 className="text-xl font-bold mb-6">アカウントが作成されました</h1>
            <img
              src={photoURL || "/face-icon.svg"}
              alt="User Icon"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 mb-6"
            />
            <div className="text-left w-full max-w-xs">
              <p className="text-sm text-gray-700">アカウント名</p>
              <p className="text-md font-semibold mb-4">{username}</p>
              <p className="text-sm text-gray-700">メールアドレス</p>
              <p className="text-md font-semibold  mb-4">{email}</p>
              <p className="text-sm text-gray-700">パスワード</p>
              <p className="text-md font-semibold  mb-8">**********</p>
            </div>
            <Button
              title="グループを作成する"
              href="/grouping"
              variant="main"
            />
            <div className="mt-4 text-center">
              <Link href="/" className="text-[#7B6224] font-semibold hover:text-[#A8956F]">
                スキップ
              </Link>
            </div>
          </>
        ) : (
          <p className="text-xl mb-8 text-gray-900">
            未ログインのため表示不可
          </p>
        )}
      </div>
    );
  }
  