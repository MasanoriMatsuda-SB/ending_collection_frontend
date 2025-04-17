// src/app/post/finish/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface ImageInfo {
  image_id: number;
  image_url: string;
  uploaded_at: string;
}

interface ItemDetails {
  item_id: number;
  item_name: string;
  images: ImageInfo[];
  created_at: string;
  // 必要に応じて他のフィールドを追加
}

interface JwtPayload {
  sub: string;
  user_id: number;
  photoURL?: string | null;
  exp: number;
  iat: number;
}

function FinishContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 単体追加の場合は "id"、まとめて追加の場合は "count" が URL クエリに含まれる前提
  const itemId = searchParams.get('id');
  const countParam = searchParams.get('count');

  const [items, setItems] = useState<ItemDetails[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  // ポーリングの設定（必要に応じて）
  const maxPollCount = 5;
  const pollInterval = 3000; // 3秒間隔
  const pollCountRef = useRef<number>(0);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // JWTトークンからログインユーザーのIDを取得
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserId(decoded.user_id);
      } catch (error) {
        console.error('JWT decode error:', error);
      }
    }
  }, []);

  // アイテム取得関数
  const fetchItems = async () => {
    try {
      if (itemId) {
        // 単体追加の場合：指定されたアイテムIDの詳細取得
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/${itemId}`);
        if (!res.ok) throw new Error('アイテムの取得に失敗しました');
        const data = await res.json();
        setItems([data]);
        setIsLoading(false);
      } else if (countParam && userId) {
        const count = parseInt(countParam, 10);
        if (isNaN(count) || count <= 0) {
          throw new Error('不正な件数が指定されています');
        }
        const url = `${process.env.NEXT_PUBLIC_API_URL}/items/user/${userId}?skip=0&limit=${count}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('アイテム一覧の取得に失敗しました');
        let data: ItemDetails[] = await res.json();
        // ここで item_id の昇順（低い順）に並べ替える
        data.sort((a, b) => a.item_id - b.item_id);
        setItems(data);
        // 画像取得状態のポーリング（任意）
        if (
          data.length > 0 &&
          data[0].images &&
          data[0].images.length > 0 &&
          data[0].images[0].image_url.trim() !== ''
        ) {
          setIsLoading(false);
          if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
        } else {
          if (pollCountRef.current < maxPollCount) {
            pollCountRef.current += 1;
            pollingTimerRef.current = setTimeout(fetchItems, pollInterval);
          } else {
            setIsLoading(false);
          }
        }
      } else {
        throw new Error('アイテムIDまたはチェック件数が指定されていません');
      }
    } catch (err) {
      console.error('Item fetch error:', err);
      setError(err instanceof Error ? err.message : 'アイテムの取得中にエラーが発生しました');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId !== null) {
      fetchItems();
    }
    return () => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, countParam, userId]);

  // onError ハンドラー（キャッシュバスティング、必要に応じて）
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    const separator = img.src.includes('?') ? '&' : '?';
    img.src = `${img.src}${separator}t=${Date.now()}`;
  };

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
            className="w-full py-2 px-4 bg-[#7B6224] rounded-full text-white hover:bg-[#A8956F] transition"
          >
            ホーム画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow text-center">
        {items.length === 1 ? (
          <>
            <div className="mb-8">
              <div className="w-16 h-16 bg-[#A8956F] opacity-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">アイテムを追加しました</h2>
            </div>
            <div className="space-y-4 mb-8">
              <div className="relative w-full pt-[75%] bg-gray-100 rounded-lg overflow-hidden">
                {items[0].images && items[0].images.length > 0 && items[0].images[0].image_url ? (
                  <img
                    src={items[0].images[0].image_url}
                    alt={items[0].item_name}
                    onError={handleImageError}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-500 text-sm">画像なし</span>
                  </div>
                )}
              </div>
              <p className="text-lg font-medium text-gray-900">{items[0].item_name}</p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-16 h-16 bg-[#A8956F] opacity-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">アイテムを追加しました</h2>
            </div>
            <div className="space-y-8 mb-8">
              {items.map((item) => (
                <div key={item.item_id} className="border p-4 rounded-md">
                  <div className="relative w-full pt-[75%] bg-gray-100 rounded-lg overflow-hidden mb-2">
                    {item.images && item.images.length > 0 && item.images[0].image_url ? (
                      <img
                        src={item.images[0].image_url}
                        alt={item.item_name}
                        onError={handleImageError}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-500 text-sm">画像なし</span>
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-medium text-gray-900">{item.item_name}</p>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="space-y-4">
          <button
            onClick={handleHomeClick}
            className="w-full py-2 px-4 bg-[#7B6224] rounded-full text-white hover:bg-[#A8956F] transition"
          >
            ホーム画面に戻る
          </button>
          <button
            onClick={handleAddMoreClick}
            className="w-full py-2 px-4 border border-[#7B6224] rounded-full text-[#7B6224] bg-white hover:bg-[#7B6224] hover:text-white transition"
          >
            他のアイテムを追加する
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FinishPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      }
    >
      <FinishContent />
    </Suspense>
  );
}
