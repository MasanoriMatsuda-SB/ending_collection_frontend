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
        // <div className="mb-2 px-3 py-2 bg-gray-100 border-l-4 border-blue-400 rounded relative text-sm text-gray-700">
        <div className="mb-2 px-3 py-2 bg-gray-100 border-l-4 border-stone-600 rounded relative text-sm text-gray-700">
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

      {/* <div className="mt-4 flex items-center border-t pt-2 space-x-2">
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
        /> */}

      {/* flex-wrap と gap でアイコンの崩れを防止 */}
      <div className="mt-4 flex flex-wrap items-center border-t pt-2 gap-2 sm:gap-2">
        {/* 添付アイコン：サイズ調整 */}
        <label htmlFor="fileInput" className="cursor-pointer">
          <img
            src="/icon-attachment.png"
            alt="添付アイコン"
            className="mt-1 w-5 h-5 sm:mt-1 sm:w-6 sm:h-6" // スマホでは少し小さく
          />
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

        {/* <VoiceRecorder
          itemId={itemId}
          currentUserId={currentUserId}
          socket={socket}
          fetchMessages={fetchMessages}
        /> */}

        {/* 録音アイコン：同様にサイズ指定で揃える */}
        <div className="w-5 h-5 sm:w-6 sm:h-6">
          <VoiceRecorder
            itemId={itemId}
            currentUserId={currentUserId}
            socket={socket}
            fetchMessages={fetchMessages}
          />
        </div>

        {/* <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 border rounded-xl p-2"
        />
        <button
          onClick={sendMessage}
          // className="bg-blue-500 text-white px-4 py-2 rounded-xl disabled:opacity-50"
          className="bg-[#7B6224] text-white px-4 py-2 rounded-xl disabled:opacity-50"
          disabled={!input && !file}
        >
          送信
        </button>
      </div> */}

        {/* 入力欄：min-w-0 で横幅制限に対応 */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 min-w-0 border rounded-xl px-3 py-2 text-sm sm:text-xs" // スマホで文字・余白を縮小
        />

        {/* 送信ボタン：スマホではコンパクトに */}
        <button
          onClick={sendMessage}
          // className="bg-[#7B6224] text-white px-4 py-2 rounded-xl disabled:opacity-50 sm:text-sm sm:px-3 sm:py-1" // スマホで小型化
          className="bg-[#7B6224] text-white text-[13px] px-2 py-1.5 rounded-xl disabled:opacity-50 sm:text-sm sm:px-3 sm:py-1"
          disabled={!input && !file}
        >
          送信
        </button>
      </div>


      {/* {file && (
        <div className="mt-2 text-sm text-gray-600">
          添付ファイル: {file.name}
          <button onClick={() => setFile(null)} className="ml-2 text-red-500 text-xs">
            取消
          </button>
        </div>
      )}
    </>
  );
} */}

      {/* 添付ファイル名：折返し＆スマホ対応 */}
      {file && (
        <div className="mt-2 text-sm text-gray-600 break-all sm:text-xs"> {/* ✅ break-all */}
          添付ファイル: {file.name}
          <button onClick={() => setFile(null)} className="ml-2 text-red-500 text-xs">
            取消
          </button>
        </div>
      )}
    </>
  );
}
