"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import VoiceRecorder from "./VoiceRecorder";
import VoiceMessage from "./VoiceMessage";

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

  const currentUserId = 14;    //暫定対応

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

    return () => {
      socket.off("receive_message");
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
                  className={`max-w-xs px-4 py-2 rounded-xl text-sm shadow text-left ${
                    isCurrentUser ? "bg-blue-100" : "bg-gray-200"
                  }`}
                >
                  <p>{msg.content}</p>
                  <div className="mt-2 space-y-1">
                    {/* {Array.isArray(msgAttachments) && msgAttachments.map((att) =>
                      att.attachment_type === "image" ? (
                        <img
                          key={att.attachment_id}
                          src={att.attachment_url}
                          alt="attachment"
                          className="rounded max-w-[200px]"
                        />
                      ) : (
                        <a
                          key={att.attachment_id}
                          href={att.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm block"
                        >
                          添付ファイルを開く
                        </a>
                      )
                    )} */}
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
                            // <audio
                            //   key={att.attachment_id}
                            //   src={att.attachment_url}
                            //   controls
                            //   className="block w-full"
                            // />
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
    </div>
  );
}
