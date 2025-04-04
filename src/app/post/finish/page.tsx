// src/app/post/finish/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ItemDetails {
  item_id: number;
  item_name: string;
  image_url: string;
}

function FinishContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('id');
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      if (!itemId) {
        setError('アイテムIDが指定されていません');
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/${itemId}`);
        if (!res.ok) throw new Error('アイテムの取得に失敗しました');
        const data = await res.json();
        setItem(data);
      } catch (err) {
        console.error('Item fetch error:', err);
        setError(err instanceof Error ? err.message : 'アイテムの取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }
    fetchItem();
  }, [itemId]);

  const handleHomeClick = () => {
    router.push('/');
  };

  const handleAddMoreClick = () => {
    router.push('/post');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded shadow text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded shadow text-center">
          <p className="text-red-500 mb-6">{error}</p>
          <button
            onClick={handleHomeClick}
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            アイテムを追加しました
          </h2>
        </div>
        
        {item && (
          <div className="space-y-4 mb-8">
            <div className="relative w-full pt-[75%] bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={item.image_url}
                alt={item.item_name}
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            </div>
            <p className="text-lg font-medium text-gray-900">{item.item_name}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleHomeClick}
            className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            ホームに戻る
          </button>
          
          <button
            onClick={handleAddMoreClick}
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            他のアイテムを追加
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FinishPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    }>
      <FinishContent />
    </Suspense>
  );
}
