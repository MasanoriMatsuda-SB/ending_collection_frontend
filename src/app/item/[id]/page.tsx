"use client";
import { use } from "react"
import { useState } from "react";
// import ItemDetail from "@/components/ItemDetail";
import ItemChat from "@/components/ItemChat";

type PageProps = {
    params: Promise<{
      id: string;
    }>;
  };
  

export default function ItemPage({ params }: PageProps) {
    const { id } = use(params); // `React.use()` でアンラップ
    const [tab, setTab] = useState<"detail" | "chat">("detail");

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
      {tab === "detail" ? (
        // <ItemDetail itemId={id} />
        "aaaa"
      ) : (
        <ItemChat itemId={id} />
      )}
    </div>
  );
}
