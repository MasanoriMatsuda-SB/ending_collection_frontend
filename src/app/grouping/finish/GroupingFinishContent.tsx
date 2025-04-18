// app/grouping/finish/GroupingFinishContent.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Button from "@/components/Button";
import Link from 'next/link';
import { useEffect } from 'react';

export default function GroupingFinishContent() {
  const params = useSearchParams();
  const { user } = useAuth();
  const groupName = params.get('groupName') || '未設定';
  const groupId = params.get('groupId');

  // グループ作成完了画面が表示されたタイミングで localStorage に selectedGroupId を保存
  useEffect(() => {
    if (user && groupId) {
      localStorage.setItem('selectedGroupId', groupId);
    }
  }, [user, groupId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
      {user?.sub ? (
        <>
          <img src="/check-icon.png" alt="check" className="w-14 h-14 mb-4" />
          <h1 className="text-2xl font-bold text-center mb-6">グループが作成されました</h1>
          <div className="mb-8">
            <p className="text-sm text-gray-600">グループ名</p>
            <p className="text-lg font-bold">{groupName}</p>
          </div>
          <Button
            title="メンバーを招待する"
            href="/invite"
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
