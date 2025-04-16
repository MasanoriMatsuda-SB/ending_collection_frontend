// src/app/invite/[token]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function InviteRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : params.token?.[0];


  useEffect(() => {
    if (token) {
      router.push(`/login?fromInvitation=1&token=${token}`);  // ログインページにリダイレクトし、トークンとフラグをクエリで渡す
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-xl text-gray-700">招待リンクを確認しています...</p>
    </div>
  );
}

