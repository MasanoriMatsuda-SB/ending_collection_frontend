"use client";

import { Message, Attachment } from "@/types/chat"
import { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";
import socket from "@/lib/socket";
import { formatTime, isSameDay } from "@/lib/utils";

import DevUserSwitcher from "../DevUserSwitcher"; // テスト用の暫定機能（最後に削除。(1)末尾の<DevUserSwitcher ... /、(2)component/DevUserSwitcheの削除も忘れずに！）

import MessageBubble from "./MessageBubble";
import ContextMenu from "./ContextMenu"
import DateLabel from "./DateLabel"; 
import MessageInputArea from "./MessageInputArea"


interface ItemChatProps {
  itemId: string;
}

// const socket = io(process.env.NEXT_PUBLIC_API_URL || "", {
//   transports: ["websocket"],
// });

export default function ItemChat({ itemId }: ItemChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachmentsMap, setAttachmentsMap] = useState<Record<number, Attachment[]>>({});
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // const currentUserId = 14;    //暫定対応
  const [currentUserId, setCurrentUserId] = useState(14);   //開発テスト用の暫定対応。最後に削除

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // const formatTime = (dateString: string) => {
  //   const date = new Date(dateString);
  //   const hours = date.getHours(); // 0埋めしない
  //   const minutes = String(date.getMinutes()).padStart(2, "0");
  //   return `${hours}:${minutes}`;
  // };

  // const isSameDay = (date1: string, date2: string) => {
  //   const d1 = new Date(date1);
  //   const d2 = new Date(date2);
  //   return (
  //     d1.getFullYear() === d2.getFullYear() &&
  //     d1.getMonth() === d2.getMonth() &&
  //     d1.getDate() === d2.getDate()
  //   );
  // };


  const fetchMessages = async () => {
    try {
      const threadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/threads/by-item/${itemId}`);
      const threadData = await threadRes.json();
      const threadId = threadData?.thread_id;

      if (!threadId) {
        console.error("スレッドが見つかりません");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages?thread_id=${threadId}`);
      const data = await res.json();

      console.log(data);
      
      setMessages(data);

      const allAttachments: Record<number, Attachment[]> = {};
      await Promise.all(
        data.map(async (msg: Message) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attachments/by-message/${msg.message_id}`);
          const attachments = await res.json();
          allAttachments[msg.message_id] = attachments;
        })
      );
      setAttachmentsMap(allAttachments);
    } catch (err) {
      console.error("メッセージ取得失敗", err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [itemId]);

  useEffect(() => {
    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("delete_message", ({ message_id }: { message_id: number }) => {
      setMessages((prev) => prev.filter((msg) => msg.message_id !== message_id));
    });

    return () => {
      socket.off("receive_message");
      socket.off("delete_message");
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".context-menu")) {
        setContextMenu(null);
      }
    };
  
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (isSending || (!input.trim() && !file)) return;
    setIsSending(true);

    try {
      const threadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/threads/by-item/${itemId}`);
      const thread = await threadRes.json();
      if (!thread.thread_id) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: thread.thread_id,
          user_id: currentUserId,
          content: input,
          parent_message_id: replyToMessage?.message_id ?? null,
        }),
      });

      const newMessage = await res.json();

      if (file) {
        const formData = new FormData();
        formData.append("message_id", String(newMessage.message_id));
        formData.append("file", file);

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message_attachments`, {
          method: "POST",
          body: formData,
        });
        setFile(null);
      }

      socket.emit("send_message", newMessage);
      setInput("");
      setReplyToMessage(null);
      await fetchMessages();
    } catch (err) {
      console.error("メッセージ送信エラー", err);
    } finally {
      setIsSending(false); 
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm("このメッセージを削除しますか？")) return;
  
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}`, {
        method: "DELETE",
      });
  
      setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
      socket.emit("delete_message", { message_id: messageId });
    } catch (err) {
      console.error("削除失敗", err);
    }
  };
  

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] overflow-y-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg, index) => {
          const replyTo = msg.parent_message_id
            ? messages.find((m) => m.message_id === msg.parent_message_id)
            : null;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDateLabel = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);

          return (
            <div key={msg.message_id}>
              {showDateLabel && (
                <DateLabel dateString={msg.created_at} />
              )}

              <MessageBubble
                msg={msg}
                currentUserId={currentUserId}
                attachments={attachmentsMap[msg.message_id] || []}
                replyTo={replyTo ?? null}
                onRightClick={(e, m) => {
                  e.preventDefault();
                  setSelectedMessage(m);
                  setContextMenu({ x: e.clientX, y: e.clientY });
                }}
                onTouchHold={(e, m) => {
                  const timeout = setTimeout(() => {
                    const touch = e.touches[0];
                    setSelectedMessage(m);
                    setContextMenu({ x: touch.clientX, y: touch.clientY });
                  }, 600);
                  const clear = () => clearTimeout(timeout);
                  e.currentTarget.addEventListener("touchend", clear, { once: true });
                  e.currentTarget.addEventListener("touchmove", clear, { once: true });
                }}
                formatTime={formatTime}
              />
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* コンテキストメニュー（右クリック・長押し） */}
      <ContextMenu
        contextMenu={contextMenu}
        selectedMessage={selectedMessage}
        onClose={() => setContextMenu(null)}
        onReply={() => {
          if (selectedMessage) {
            setReplyToMessage(selectedMessage);
          }
        }}
        onDelete={() => {
          if (selectedMessage) {
            handleDeleteMessage(selectedMessage.message_id);
          }
        }}
      />

      {/* メッセージ入力エリア */}
      <MessageInputArea
        input={input}
        setInput={setInput}
        file={file}
        setFile={setFile}
        replyToMessage={replyToMessage}
        setReplyToMessage={setReplyToMessage}
        sendMessage={sendMessage}
        currentUserId={currentUserId}
        itemId={itemId}
        socket={socket}
        fetchMessages={fetchMessages}
      />
      
      {/* 開発用ユーザー切り替えUI（最終的に要削除。(1)import DevUserSwitcher、(2)component/DevUserSwitcheの削除も忘れずに！！） */}
      <DevUserSwitcher
        currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId}
      />

    </div>
  );
}
