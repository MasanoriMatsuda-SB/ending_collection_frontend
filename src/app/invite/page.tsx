'use client';

import { useAuth } from '@/lib/AuthContext';
import Button from "@/components/Button";

export default function HomePage() {
  const { user } = useAuth();

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
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText("https://example.com/invite/mock-link");
              alert("招待リンクをコピーしました");
            }}
            className="flex items-center justify-center w-full max-w-md py-3 px-4 rounded-full text-white font-bold bg-[#7B6224] hover:bg-[#A8956F] mb-6"
          >
            <img src="/link-icon.png" alt="link" className="w-5 h-5 mr-2" />
            招待リンクをコピーする
          </button>
          <p className="text-center text-gray-700 mb-4">またはSNSで招待リンクを送る</p>
          <button
            onClick={() => {
              const inviteUrl = "https://example.com/invite/mock-link";
              const userAgent = navigator.userAgent.toLowerCase();
              const isMobile = /iphone|android/.test(userAgent);
            // PCならブラウザのLINEシェアページに、モバイルならLINEアプリの送信画面に飛ばす
              if (isMobile) {
                const message = `このリンクから参加してね: ${inviteUrl}`;
                const lineScheme = `line://msg/text/${encodeURIComponent(message)}`;
                window.location.href = lineScheme;
              } else {
                const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(inviteUrl)}`;
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
