"use client";

import { useEffect, useRef, useState } from "react";
// import { useSession } from "next-auth/react"; // 認証してる場合
// import Image from "next/image";

interface Message {
  message_id: number;
  user_id: number;
  content: string;
  created_at: string;
  username: string;
  photoURL?: string;
}

interface ItemChatProps {
  itemId: string;
}

export default function ItemChat({ itemId }: ItemChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentUserId = 1; // 仮でログイン中のユーザーID（本来は認証情報から取得）

  useEffect(() => {
    fetch(`/api/messages?item_id=${itemId}`)
      .then((res) => res.json())
      .then(setMessages);
  }, [itemId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, content: input }),
    });

    const newMessage = await res.json();
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] overflow-y-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-2">
        ===開発テスト用(start)===<br/>
        {itemId}<br/>
        &quot;===開発テスト用(End)===&quot;
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.message_id}
            className={`flex ${
              msg.user_id === currentUserId ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-xl text-sm shadow ${
                msg.user_id === currentUserId
                  ? "bg-blue-100 text-right"
                  : "bg-gray-200 text-left"
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                {msg.username} ・ {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* メッセージ入力 */}
      <div className="mt-4 flex items-center border-t pt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 border rounded-xl p-2 mr-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl"
        >
          送信
        </button>
      </div>
    </div>
  );
}
