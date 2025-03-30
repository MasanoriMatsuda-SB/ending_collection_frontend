"use client";

import React from "react";
import VoiceRecorder from "../Voice/VoiceRecorder";
import { Message } from "@/types/chat";
import type { Socket } from "socket.io-client";

interface Props {
  input: string;
  setInput: (value: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  replyToMessage: Message | null;
  setReplyToMessage: (msg: Message | null) => void;
  sendMessage: () => void;
  currentUserId: number;
  itemId: string;
  socket: Socket;
  fetchMessages: () => void;
}

export default function MessageInputArea({
  input,
  setInput,
  file,
  setFile,
  replyToMessage,
  setReplyToMessage,
  sendMessage,
  currentUserId,
  itemId,
  socket,
  fetchMessages,
}: Props) {
  return (
    <>
      {replyToMessage && (
        <div className="mb-2 px-3 py-2 bg-gray-100 border-l-4 border-blue-400 rounded relative text-sm text-gray-700">
          <p className="font-semibold">{replyToMessage.username} への返信</p>
          <p className="truncate">{replyToMessage.content}</p>
          <button
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs"
            onClick={() => setReplyToMessage(null)}
          >
            ×
          </button>
        </div>
      )}

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
          disabled={!input && !file}
        >
          送信
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
    </>
  );
}
