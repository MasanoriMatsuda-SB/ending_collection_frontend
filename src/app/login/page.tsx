'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('正しいメールアドレスの形式で入力してください');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.detail
          ? typeof data.detail === 'string'
            ? data.detail
            : Array.isArray(data.detail)
            ? data.detail.map((err: { msg: string }) => err.msg).join(', ')
            : data.detail.toString()
          : 'ログインに失敗しました';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      refreshUser();

      // ここで招待URL経由であれば/invitationに遷移するように条件分岐追加してください
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('エラーが発生しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 bg-gray rounded shadow">
        <h2 className="text-2xl font-bold text-center mb-6">ログイン</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-[#17B5B5] focus:border-[#17B5B5]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-[#17B5B5] focus:border-[#17B5B5]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-full text-white font-bold transition ${
              isLoading
                ? 'bg-[#A8956F] cursor-not-allowed'
                : 'bg-[#7B6224] hover:bg-[#A8956F]'
            }`}
          >
            {isLoading ? 'ログイン中…' : 'ログイン'}
          </button>
        </form>
        {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}
        <div className="mt-4 text-center">
          <Link href="/signup" className="text-[#7B6224] font-semibold hover:text-[#A8956F]">
            新規アカウント作成はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}
