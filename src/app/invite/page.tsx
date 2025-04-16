// src/app/invite/page.tsx
'use client';

import { useAuth } from '@/lib/AuthContext';
import Button from "@/components/Button";
import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface Group {
  group_id: number;
  group_name: string;
}

export default function HomePage() {
  const { user } = useAuth(); //ログインしているユーザー情報（JWTの sub など）を取得
  const [inviteLink, setInviteLink] = useState(''); //生成されたリンクの保持
  const [loading, setLoading] = useState(false); //リクエスト中のボタン無効化
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // 所属グループ一覧取得
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('トークンがありません');

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/my-groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'グループ情報の取得に失敗しました');
        }

        const data = await res.json();
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroupId(data[0].group_id); // 最初のグループを初期選択
        }
      } catch (err) {
        console.error('グループID取得エラー:', err);
      }
    };

    fetchGroups();
  }, []);


  const handleGenerateInviteLink = async () => {
    if (!user?.sub || !selectedGroupId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('トークンが見つかりません');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/group-invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ group_id: selectedGroupId })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || '招待リンクの生成に失敗しました');

      const url = `${window.location.origin}/invite/${result.token}`;
      setInviteLink(url);
      navigator.clipboard.writeText(url);
      alert("招待リンクをコピーしました");
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('リンク生成エラー:', err);
        alert(err.message);
      } else {
        alert('リンクの生成に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      {user?.sub ? (
      <>
        <div className="flex flex-col items-center justify-center w-full max-w-md px-4 mx-auto mb-10">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">メンバー招待</h1>
          <p className="text-center text-gray-700 mb-6">
            グループに追加したいメンバーに<br />
            招待リンクを送りましょう
          </p>

          <div className="w-full mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">対象グループを選択:</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={selectedGroupId ?? ''}
              onChange={(e) => setSelectedGroupId(Number(e.target.value))}
            >
              {groups.map(group => (
                <option key={group.group_id} value={group.group_id}>
                  {group.group_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerateInviteLink}
            disabled={loading || !selectedGroupId}
            className="flex items-center justify-center w-full max-w-md py-3 px-4 rounded-full text-white font-bold bg-[#7B6224] hover:bg-[#A8956F] mb-6 disabled:opacity-50"
          >
            <img src="/link-icon.png" alt="link" className="w-5 h-5 mr-2" />
            {loading ? '生成中...' : '招待リンクをコピーする'}
          </button>

          {inviteLink && (
              <>
                <p className="text-center text-gray-700 mb-4">LINEで招待リンクを送る</p>
                <button
                  onClick={() => {
                    const userAgent = navigator.userAgent.toLowerCase();
                    const isMobile = /iphone|android/.test(userAgent);
                    const message = `このリンクから参加してね: ${inviteLink}`;
                    if (isMobile) {
                      const lineScheme = `line://msg/text/${encodeURIComponent(message)}`;
                      window.location.href = lineScheme;
                    } else {
                      const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(inviteLink)}`;
                      window.open(shareUrl, "_blank");
                    }
                  }}
                >
                  <img
                    src="/line-icon.png"
                    alt="LINE"
                    className="w-16 h-16 mb-10 transition duration-150 ease-in-out hover:opacity-80 active:scale-105"
                  />
                </button>

                <div className="flex flex-col items-center mt-4">
                  <p className="text-gray-700 mb-2">QRコードで招待リンクを共有</p>
                  <QRCodeCanvas value={inviteLink} size={200} />
                </div>
              </>
            )}
          </div>
          <div className="w-full px-4 flex justify-center">
            <Button
              title="ホーム画面へ移動"
              href="/"
              variant="sub"
            />
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