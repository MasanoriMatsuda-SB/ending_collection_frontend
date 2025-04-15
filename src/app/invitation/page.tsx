// src/app/invitation/page.tsx
'use client';

import { useAuth } from '@/lib/AuthContext';
import Button from "@/components/Button";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InvitationPage() {
  const { user } = useAuth();
  const router = useRouter();

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

  const alreadyInGroup = user.sub === 'alreadyingroup';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
      <img src="/invitation-icon.png" alt="invitation" className="w-14 mb-4" />
      <h1 className="text-2xl font-bold text-center mb-6">グループに招待されています</h1>

      {alreadyInGroup ? (
        <>
          <p className="text-red-600 font-semibold mb-2">
            すでに別のグループに入っているため参加できません
          </p>
          <p className="text-sm text-gray-600 mb-6">※1アカウントにつき1つのグループまで</p>
          <div className="text-left bg-gray-100 rounded-lg p-4 w-full max-w-xs mb-6">
            <p className="text-sm text-gray-700">招待者</p>
            <p className="text-md font-semibold mb-4">メメモリ太郎</p>
            <p className="text-sm text-gray-700">グループ名</p>
            <p className="text-md font-semibold">メメモリ家</p>
          </div>
          <Button title="ホーム画面へ移動" href="/" variant="sub"/>
        </>
      ) : (
        <>
          <div className="text-left bg-gray-100 rounded-lg p-4 w-full max-w-xs mb-6">
            <p className="text-sm text-gray-700">招待者</p>
            <p className="text-md font-semibold mb-4">メメモリ太郎</p>
            <p className="text-sm text-gray-700">グループ名</p>
            <p className="text-md font-semibold">メメモリ家</p>
          </div>
          <Button title="グループに参加する" onClick={handleJoinGroup} />
          <div className="mt-4">
            <Link href="/grouping" className="text-[#7B6224] font-semibold hover:text-[#A8956F]">
                参加せずグループを新規作成する
            </Link>
          </div>
        </>
      )}
    </div>
  );
}