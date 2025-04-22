"use client";
import { use } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import ItemDetail from "@/components/ItemDetail";
import ItemChat from "@/components/Chat/ItemChat";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ItemImage = {
  image_id: number;
  item_id: number;
  image_url: string;
};

type JwtPayload = {
  user_id: number;
};

type ItemData = {
  item_id: number;
};

export default function ItemPage({ params }: PageProps) {
  const { id } = use(params); // URLのitem_id
  const router = useRouter();

  const [tab, setTab] = useState<"detail" | "chat">("detail");
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [images, setImages] = useState<ItemImage[]>([]);
  const [threadExists, setThreadExists] = useState<boolean | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const decoded = token ? jwtDecode<JwtPayload>(token) : null;
  const userId = decoded?.user_id;

  const searchParams = useSearchParams();
  const groupId = searchParams.get("group_id");
  const passedUserId = searchParams.get("user_id");
  const [itemName, setItemName] = useState<string>("");

  // group_idに該当するitem_id一覧取得
  useEffect(() => {
    if (!groupId) return;

    const fetchItemIdsByGroup = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/group/${groupId}`);
      const data: ItemData[] = await res.json();
      const ids = data.map(item => String(item.item_id));
      setItemIds(ids);
      const index = ids.indexOf(id);
      setCurrentIndex(index >= 0 ? index : 0);
    };

    fetchItemIdsByGroup();
  }, [groupId, id]);

  // 画像,アイテム名取得（URLのitem_idを使用）
  useEffect(() => {
    if (!id) return;

    const fetchImages = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/item-images/${id}`);
        if (!res.ok) throw new Error("画像の取得に失敗しました");
        const data = await res.json();
        setImages(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchImages();

    const fetchItemName = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/detail/${id}`);
        if (!res.ok) throw new Error("item取得失敗");
        const data = await res.json();
        setItemName(data.item_name || "");
      } catch (err) {
        console.error("item_name取得エラー", err);
      }
    };

    fetchItemName();
    
  }, [id]);

  // チャットスレッドの有無確認
  useEffect(() => {
    if (!id) return;

    const checkThread = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/threads/by-item/${id}`);
        const data = await res.json();
        setThreadExists(!!data?.thread_id);
      } catch (error) {
        console.log("スレッド未作成またはエラー", error);
        setThreadExists(false);
      }
    };

    checkThread();
  }, [id]);

  const handleCreateThread = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: Number(id) }),
      });

      if (!res.ok) throw new Error("Thread作成失敗");

      const data = await res.json();
      if (data?.thread_id) setThreadExists(true);
    } catch (err) {
      console.error("Thread作成エラー", err);
    }
  };

  // スワイプ処理
  let touchStartX = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;

    if (diff > 50 && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      router.replace(`/item/${itemIds[newIndex]}?user_id=${passedUserId}&group_id=${groupId}`);
    } else if (diff < -50 && currentIndex < itemIds.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      router.replace(`/item/${itemIds[newIndex]}?user_id=${passedUserId}&group_id=${groupId}`);
    }
  };

  return (
    <div className="flex flex-col bg-white">
      { tab === "chat" ? (
        // メッセージタブ：固定表示
        <div className="fixed top-16 z-50 bg-white w-full max-w-[710px] left-1/2 transform -translate-x-1/2">
          {/* 左ボタン・画像・item_name・右ボタン */}
          <div className="flex items-center justify-between w-full px-4 py-2">
            {/* ← 左ボタン */}
            <button
              className="text-3xl font-bold bg-white/70 text-[#757575] rounded-full"
              onClick={() => {
                const newIndex = currentIndex - 1;
                setCurrentIndex(newIndex);
                router.replace(`/item/${itemIds[newIndex]}?user_id=${passedUserId}&group_id=${groupId}`);
              }}
              disabled={currentIndex === 0}
            >
              ⟨
            </button>
            {/* 中央エリア：画像＋item名 */}
            <div className="flex items-center space-x-4 overflow-hidden mx-2">
              {images[0] && (
                <img
                  src={images[0].image_url || "/no-image.svg"}
                  alt="item"
                  className="max-h-[60px] w-auto rounded-[10px] shadow"
                />
              )}
              <span className="text-lg font-bold truncate max-w-[220px]">{itemName}</span>
            </div>
            {/* → 右ボタン */}
            <button
              className="text-3xl font-bold bg-white/70 text-[#757575] rounded-full"
              onClick={() => {
                const newIndex = currentIndex + 1;
                setCurrentIndex(newIndex);
                router.replace(`/item/${itemIds[newIndex]}?user_id=${passedUserId}&group_id=${groupId}`);
              }}
              disabled={currentIndex >= itemIds.length - 1}
            >
              ⟩
            </button>
          </div>

          {/* タブ切り替え＋ボーダー */}
          <div>
            <div className="flex justify-around">
              <button
                onClick={() => setTab("detail")}
                className="text-center px-12 py-0 font-bold text-[22px] text-gray-500"
              >
                詳細
              </button>
              <button
                onClick={() => setTab("chat")}
                className="text-center px-4 py-0 font-bold text-[22px] text-[#000000]"
              >
                メッセージ
              </button>
            </div>
            <div className="flex h-[4px] w-full">
              <div className="w-1/2 bg-[#F5F5F5]" />
              <div className="w-1/2 bg-[#17b5b5]" />
            </div>
          </div>
        </div>
      ) : (
        // 詳細タブ：従来表示（元のコードに戻す）
        <>
          <div className="relative py-4">
            {images.length > 0 && currentIndex > 0 && (
              <button
                className="absolute mx-2 left-0 top-1/2 transform -translate-y-1/2 text-3xl font-bold z-10 bg-white/70 text-[#757575] rounded-full"
                onClick={() => {
                  const newIndex = currentIndex - 1;
                  setCurrentIndex(newIndex);
                  router.replace(`/item/${itemIds[newIndex]}?user_id=${passedUserId}&group_id=${groupId}`);
                }}
              >
                ⟨
              </button>
            )}

            <div
              className="flex justify-center overflow-x-auto space-x-4"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {images.map((img) => (
                <img
                  key={img.image_id}
                  src={img.image_url || "/no-image.svg"}
                  alt={`Item Image ${img.image_id}`}
                  className="h-72 rounded-[10px] shadow"
                />
              ))}
            </div>

            {images.length > 0 && currentIndex < itemIds.length - 1 && (
              <button
                className="absolute px-2 right-0 top-1/2 transform -translate-y-1/2 text-3xl font-bold z-10 bg-white/70 text-[#757575] rounded-full"
                onClick={() => {
                  const newIndex = currentIndex + 1;
                  setCurrentIndex(newIndex);
                  router.replace(`/item/${itemIds[newIndex]}?user_id=${passedUserId}&group_id=${groupId}`);
                }}
              >
                ⟩
              </button>
            )}
          </div>

          {/* タブ切り替え＋ボーダーライン */}
          <div>
            <div className="flex justify-around">
              <button
                onClick={() => setTab("detail")}
                className="text-center px-12 py-2 font-bold text-[22px] text-[#000000]"
              >
                詳細
              </button>
              <button
                onClick={() => setTab("chat")}
                className="text-center px-4 py-2 font-bold text-[22px] text-gray-500"
              >
                メッセージ
              </button>
            </div>
            <div className="flex h-[4px] w-full">
              <div className="w-1/2 bg-[#17b5b5]" />
              <div className="w-1/2 bg-[#F5F5F5]" />
            </div>
          </div>
        </>
      )}




      {/* コンテンツ表示 */}
      {tab === "detail" && id && <ItemDetail itemId={id} />}

      {tab === "chat" && (
        threadExists === null ? (
          <p className="p-4">読み込み中...</p>
        ) : threadExists === false ? (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="mb-4">このアイテムのチャットはまだ開始されていません。</p>
              <button
                onClick={handleCreateThread}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                チャットを開始
              </button>
            </div>
          </div>
        ) : (
          id && userId !== undefined && (
            <ItemChat itemId={id} userId={userId} />
          )
        )
      )}
    </div>
  );
}
