"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import VoiceRecorder from "./VoiceRecorder";
import VoiceMessage from "./VoiceMessage";

import DevUserSwitcher from "./DevUserSwitcher"; // テスト用の暫定機能（最後に削除。(1)末尾の<DevUserSwitcher ... /、(2)component/DevUserSwitcheの削除も忘れずに！）

interface Message {
  message_id: number;
  user_id: number;
  content: string;
  created_at: string;
  username: string;
  photoURL?: string;
}

interface Attachment {
  attachment_id: number;
  attachment_url: string;
  attachment_type: "image" | "video" | "voice" | "file";
  uploaded_at: string;
}

interface ItemChatProps {
  itemId: string;
}

const socket = io(process.env.NEXT_PUBLIC_API_URL || "", {
  transports: ["websocket"],
});

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

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
        {messages.map((msg) => {
          const isCurrentUser = msg.user_id === currentUserId;
          const msgAttachments = attachmentsMap[msg.message_id] || [];

          return (
            <div key={msg.message_id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-end space-x-2 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                {msg.photoURL && (
                  <img
                    src={msg.photoURL}
                    alt="user"
                    width={32}
                    height={32}
                    className="rounded-full w-8 h-8 object-cover"
                  />
                )}
                <div
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedMessage(msg);
                    setContextMenu({ x: e.clientX, y: e.clientY });
                  }}
                  onTouchStart={(e) => {
                    const timeout = setTimeout(() => {
                      const touch = e.touches[0];
                      setSelectedMessage(msg);
                      setContextMenu({ x: touch.clientX, y: touch.clientY });
                    }, 600);
                    const clear = () => clearTimeout(timeout);
                    e.currentTarget.addEventListener("touchend", clear, { once: true });
                    e.currentTarget.addEventListener("touchmove", clear, { once: true });
                  }}
                  className={`max-w-xs px-4 py-2 rounded-xl text-sm shadow text-left ${
                    isCurrentUser ? "bg-blue-100" : "bg-gray-200"
                  }`}
                >
                {/* <div
                  className={`max-w-[65%] px-4 py-2 rounded-xl text-sm shadow text-left whitespace-pre-wrap break-words ${
                    isCurrentUser ? "bg-blue-100" : "bg-gray-200"
                  }`}
                > */}
                  <p>{msg.content}</p>
                  <div className="mt-2 space-y-1">
                    {msgAttachments.map((att) => {
                      switch (att.attachment_type) {
                        case "image":
                          return (
                            <img
                              key={att.attachment_id}
                              src={att.attachment_url}
                              alt="attachment"
                              className="rounded max-w-[200px]"
                            />
                          );
                        case "video":
                          return (
                            <video
                              key={att.attachment_id}
                              src={att.attachment_url}
                              controls
                              className="rounded max-w-[200px]"
                            />
                          );
                        case "voice":
                          return (
                            <VoiceMessage
                            key={att.attachment_id}
                            src={att.attachment_url}
                          />
                          );
                        default:
                          return (
                            <a
                              key={att.attachment_id}
                              href={att.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-sm block"
                            >
                              添付ファイルを開く
                            </a>
                          );
                      }
                    })}

                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {msg.username} ・ {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* コンテキストメニュー（右クリック・長押し） */}
      {contextMenu && selectedMessage && (
        <div
          className="fixed bg-white border rounded shadow-lg z-50 context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu(null)}
        >
          <ul className="text-sm">
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                console.log("リプライ対象:", selectedMessage);
                setContextMenu(null);
              }}
            >
              リプライ
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500"
              onClick={() => {
                if (selectedMessage) {
                  handleDeleteMessage(selectedMessage.message_id);
                }
                setContextMenu(null);
              }}
            >
              削除
            </li>
          </ul>
        </div>
      )}

      {/* メッセージ入力エリア */}
      <div className="mt-4 flex items-center border-t pt-2 space-x-2">
        <label htmlFor="fileInput" className="cursor-pointer">
          <img src="/icon-attachment.png" alt="添付アイコン" className="w-6 h-6" />
        </label>
        <input
          id="fileInput"
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setFile(e.target.files[0]);
            }
          }}
        />

        <VoiceRecorder
          itemId={itemId}
          currentUserId={currentUserId}
          socket={socket}
          fetchMessages={fetchMessages}
        />

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 border rounded-xl p-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl disabled:opacity-50"
          disabled={isSending} 
        >
          {isSending ? "送信中..." : "送信"} 
        </button>
      </div>

      {file && (
        <div className="mt-2 text-sm text-gray-600">
          添付ファイル: {file.name}
          <button onClick={() => setFile(null)} className="ml-2 text-red-500 text-xs">
            取消
          </button>
        </div>
      )}
      
      {/* 開発用ユーザー切り替えUI（最終的に要削除。(1)import DevUserSwitcher、(2)component/DevUserSwitcheの削除も忘れずに！！） */}
      <DevUserSwitcher
        currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId}
      />

    </div>
  );
}
