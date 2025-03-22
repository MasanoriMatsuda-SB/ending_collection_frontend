"use client";
import { useState } from "react";
// import ItemDetail from "@/components/ItemDetail";
import ItemChat from "@/components/ItemChat";

export default function ItemPage({ params }: { params: { id: string } }) {
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
        // <ItemDetail itemId={params.id} />
        "aaaa"
      ) : (
        <ItemChat itemId={params.id} />
      )}
    </div>
  );
}
