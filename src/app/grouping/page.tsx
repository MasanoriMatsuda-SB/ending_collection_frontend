'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Button from "@/components/Button";

export default function GroupingPage() {
    const { user } = useAuth();
    const [groupName, setGroupName] = useState('');
    const router = useRouter();

  const handleCreateGroup = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grouping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupName }),
      });

      if (!res.ok) throw new Error('作成に失敗しました');

      // 成功したらfinishページに遷移
      router.push(`/grouping/finish?groupName=${encodeURIComponent(groupName)}`);
    } catch (err) {
      console.error('作成エラー:', err);
      alert('グループの作成に失敗しました');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
    {user?.sub ? (
    <>
        <h1 className="text-2xl font-bold text-center mb-6">グループ作成</h1>
        <div className="w-full max-w-md mb-6">
            <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(); }}>
            <label className="block text-sm font-medium text-gray-900 text-left">グループ名</label>
            <input
              type="text"
              placeholder="メメモリ家"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-[#17B5B5] focus:border-[#17B5B5]"
            />
            </form>
        </div>
      <Button
        title="グループ作成"
        type="submit"
        variant="main"
        onClick={handleCreateGroup}
      />
    </>
    ) : (
        <p className="text-xl mb-8 text-gray-900">
        未ログインのため表示不可
        </p>
    )}
    </div>
  );
}