// app/signup/finish/page.tsx
'use client';

import { useAuth } from '@/lib/AuthContext';
import Button from "@/components/Button";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function HomePage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    
    const handleCreateGroup = () => {
    // ここで招待URL経由であれば/invitationに遷移するように条件分岐追加してください
        router.push('/grouping');
    };
  
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
        {user?.sub ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">アカウントが作成されました</h1>
            <img
              src={user?.photoURL || "/face-icon.svg"}
              alt="User Icon"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 mb-6"
            />
            <div className="text-left w-full max-w-xs">
              <p className="text-sm text-gray-700">アカウント名</p>
              <p className="text-md font-semibold mb-4">{user.sub}</p>
              <p className="text-sm text-gray-700">メールアドレス</p>
              <p className="text-md font-semibold  mb-4">{user.email}</p>
              <p className="text-sm text-gray-700">パスワード</p>
              <p className="text-md font-semibold  mb-8">**********</p>
            </div>
            <Button
              title="グループを作成する"
              onClick={handleCreateGroup}
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
  