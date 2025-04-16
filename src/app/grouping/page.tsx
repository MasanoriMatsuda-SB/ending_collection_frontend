// app/grouping/page.tsx

'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Button from "@/components/Button";

export default function GroupingPage() {
    const { user } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

  const handleCreateGroup = async () => {
    if (isSubmitting) return; // 多重送信防止

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token'); //token を localStorage から取得
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grouping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,  // JWTトークンをバックエンドに送りトークンからuser_idを取り出せるようにする
        },
        body: JSON.stringify({ groupName }),
      });

      // レスポンスボディを読み取って判断
      const result = await res.json();

      // ログイントークンが期限切れの時にログイン画面に遷移させる
      if (!res.ok) {
        if (res.status === 401 || result.detail?.includes("認証情報が見つかりません")) {
          // JWTが期限切れなどで無効なとき
          localStorage.removeItem('token');       // トークン削除
          alert('ログインの有効期限が切れています。再度ログインしてください。');
          router.push('/login');                  // ログイン画面へ遷移
          return;
        }
        alert(result.detail || 'グループの作成に失敗しました');
        return;
      }

      // 成功したらfinishページに遷移
      router.push(`/grouping/finish?groupName=${encodeURIComponent(groupName)}`);
    } catch (err) {
      if (err instanceof Error) {
        console.error('作成エラー:', err);
        alert(err.message);
      } else {
        console.error('作成エラー:', err);
        alert('グループの作成に失敗しました');
      }
    } finally {
      setIsSubmitting(false);
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