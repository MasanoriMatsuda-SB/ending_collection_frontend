// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhoto(e.target.files[0]);
    } else {
      setPhoto(null);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // FormDataに必要な情報を追加
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      if (photo) {
        formData.append('photo', photo);
      }

      // /signup エンドポイントへ送信
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.detail
          ? Array.isArray(data.detail)
            ? data.detail.map((err: { msg: string }) => err.msg).join(', ')
            : data.detail.toString()
          : '登録に失敗しました';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // 登録成功後、自動ログイン
      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        const loginData = await loginRes.json();
        const errorMessage = loginData.detail
          ? typeof loginData.detail === 'string'
            ? loginData.detail
            : Array.isArray(loginData.detail)
            ? loginData.detail.map((err: { msg: string }) => err.msg).join(', ')
            : loginData.detail.toString()
          : 'ログインに失敗しました';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      const loginData = await loginRes.json();
      localStorage.setItem('token', loginData.access_token);
      router.push('/');
    } catch (err: unknown) {
      console.error('Registration/Login error:', err);
      setError('エラーが発生しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">会員登録</h2>
        <form onSubmit={handleRegistration} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900">ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900">アイコン（任意）</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded transition ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? '登録中…' : '登録する'}
          </button>
        </form>
        {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
