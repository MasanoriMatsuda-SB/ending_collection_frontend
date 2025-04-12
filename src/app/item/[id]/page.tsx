"use client";
import { use } from "react"
import { useState, useEffect } from "react";
// import ItemDetail from "@/components/ItemDetail";
import ItemChat from "@/components/Chat/ItemChat";

type PageProps = {
    params: Promise<{
      id: string;
    }>;
  };
  

export default function ItemPage({ params }: PageProps) {
    const { id } = use(params); // `React.use()` でアンラップ
    const [tab, setTab] = useState<"detail" | "chat">("detail");

    const [threadExists, setThreadExists] = useState<boolean | null>(null);

    useEffect(() => {
      if (!id) return;
      const checkThread = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/threads/by-item/${id}`);
          const data = await res.json();
          if (data?.thread_id) {
            setThreadExists(true);
          } else {
            setThreadExists(false);
          }
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ item_id: Number(id) }),
        });
  
        if (!res.ok) throw new Error("Thread作成失敗");
  
        const data = await res.json();
        if (data?.thread_id) {
          setThreadExists(true);
        }
      } catch (err) {
        console.error("Thread作成エラー", err);
      }
    };



  return (
    <div>
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

      {/* コンテンツ */}
      {/* {tab === "detail" ? (
        // <ItemDetail itemId={id} />
        "aaaa"
      ) : (
        <ItemChat itemId={id} />
      )} */}

      {/* コンテンツ */}
      {tab === "detail" ? (
        // <ItemDetail itemId={id} />
        "aaaa"
      ) : threadExists === null ? (
        <p className="p-4">読み込み中...</p>
      ) : threadExists === false ? (
        <div className="min-h-screen flex items-center justify-center">
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
        <ItemChat itemId={id} />
      )}  

    </div>
  );
}
