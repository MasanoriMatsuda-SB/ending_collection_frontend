// src/app/invitation/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Button from "@/components/Button";
import Link from 'next/link';

interface InviteResponse {
  group_id: number;
  group_name: string;
  inviter_username: string;
  already_in_group: boolean;
}

export default function InvitationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inviteInfo, setInviteInfo] = useState<InviteResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    const fetchInvite = async () => {
      if (!user?.sub || !token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/group-invites/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || '参加処理に失敗しました');
        }

        setInviteInfo(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('エラーが発生しました');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [user, token]);

  const handleJoinGroup = () => {
    router.push('/');
  };

  if (!user?.sub) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-center px-6">
        <p className="text-xl mb-8 text-gray-900">未ログインのため表示不可</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-center px-6">
        <p className="text-xl text-gray-900">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-center px-6">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
      <img src="/invitation-icon.png" alt="invitation" className="w-14 mb-4" />
      <h1 className="text-2xl font-bold text-center mb-6">グループに招待されています</h1>

      {inviteInfo?.already_in_group ? (
        <>
          <p className="text-red-600 font-semibold mb-2">
            すでに別のグループに入っているため参加できません
          </p>
          <p className="text-sm text-gray-600 mb-6">※1アカウントにつき1つのグループまで</p>
        </>
      ) : (
        <>
          <Button title="グループに参加する" onClick={handleJoinGroup} />
          <div className="mt-4">
            <Link href="/grouping" className="text-[#7B6224] font-semibold hover:text-[#A8956F]">
              参加せずグループを新規作成する
            </Link>
          </div>
        </>
      )}

      <div className="text-left bg-gray-100 rounded-lg p-4 w-full max-w-xs mt-6">
        <p className="text-sm text-gray-700">招待者</p>
        <p className="text-md font-semibold mb-4">{inviteInfo?.inviter_username}</p>
        <p className="text-sm text-gray-700">グループ名</p>
        <p className="text-md font-semibold">{inviteInfo?.group_name}</p>
      </div>
    </div>
  );
}
