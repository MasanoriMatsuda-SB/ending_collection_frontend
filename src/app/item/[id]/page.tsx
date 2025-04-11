"use client";
import { use } from "react";
import { useState, useEffect } from "react";
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

export default function ItemPage({ params }: PageProps) {
  const { id } = use(params);
  const [tab, setTab] = useState<"detail" | "chat">("detail");
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [images, setImages] = useState<ItemImage[]>([]);

  // JWTからuser_id取得
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const decoded = token ? jwtDecode<JwtPayload>(token) : null;
  const userId = decoded?.user_id;

  // item_id一覧取得
  useEffect(() => {
    if (!userId) return;

    const fetchItemIds = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/item-ids`);
      const data = await res.json();
      const stringIds = data.map(String);
      setItemIds(stringIds);
      const initialIndex = stringIds.indexOf(id);
      setCurrentIndex(initialIndex >= 0 ? initialIndex : 0);
    };

    fetchItemIds();
  }, [userId, id]);

  const currentItemId = itemIds[currentIndex];

  // 画像取得
  useEffect(() => {
    if (!currentItemId) return;

    const fetchImages = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/item-images/${currentItemId}`);
        if (!res.ok) throw new Error("画像の取得に失敗しました");
        const data = await res.json();
        setImages(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchImages();
  }, [currentItemId]);

  useEffect(() => {
    console.log("userId", userId);
  }, [userId]);

  useEffect(() => {
    console.log("itemIds", itemIds);
    console.log("currentIndex", currentIndex);
    console.log("currentItemId", currentItemId);
  }, [itemIds, currentIndex]);


  // スワイプ処理
  let touchStartX = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;

    if (diff > 50 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (diff < -50 && currentIndex < itemIds.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div>
      {/* スワイプ画像エリア */}
      <div
        className="flex overflow-x-auto space-x-4 p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img) => {
          return (
            <img
              key={img.image_id}
              src={img.image_url || "/no-image.svg"}
              alt={`Item Image ${img.image_id}`}
              className="h-48 rounded shadow"
            />
          );
        })}
      </div>

      {/* タブ切り替え */}
      <div className="flex justify-around border-b">
        <button
          onClick={() => setTab("detail")}
          className={tab === "detail" ? "border-b-2 font-bold" : ""}
        >
          詳細
        </button>
        <button
          onClick={() => setTab("chat")}
          className={tab === "chat" ? "border-b-2 font-bold" : ""}
        >
          メッセージ
        </button>
      </div>

      {/* コンテンツ表示 */}
      {currentItemId && tab === "detail" && (
        <ItemDetail itemId={currentItemId} />
      )}
      {currentItemId && tab === "chat" && (
        <ItemChat itemId={currentItemId} />
      )}
    </div>
  );
}