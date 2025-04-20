"use client";

import React from "react";
import VoiceMessage from "../Voice/VoiceMessage";
import { Message, Attachment } from "@/types/chat"

interface Props {
  msg: Message;
  currentUserId: number;
  attachments: Attachment[];
  replyTo: Message | null;
  onRightClick: (e: React.MouseEvent, msg: Message) => void;
  onTouchHold: (e: React.TouchEvent, msg: Message) => void;
  formatTime: (date: string) => string;
}

export default function MessageBubble({
  msg,
  currentUserId,
  attachments,
  replyTo,
  onRightClick,
  onTouchHold,
  formatTime,
}: Props) {
  const isCurrentUser = msg.user_id === currentUserId;

  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
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
          onContextMenu={(e) => onRightClick(e, msg)}
          onTouchStart={(e) => onTouchHold(e, msg)}
          className={`max-w-xs px-4 py-2 rounded-xl text-sm shadow text-left ${
            isCurrentUser ? "bg-stone-300" : "bg-gray-200"
          }`}
        >
          {replyTo && (
            <div className="mb-2 p-2 bg-white/70 text-gray-700 text-xs border-l-4 border-stone-400 rounded">
              <p className="font-semibold">{replyTo.username}</p>
              <p className="truncate">{replyTo.content}</p>
            </div>
          )}
          {msg.parent_message_id && !replyTo && (
            <div className="mb-2 p-2 bg-white/50 text-gray-500 text-xs border-l-4 border-gray-300 rounded">
              <p className="italic">メッセージは削除されました</p>
            </div>
          )}

          <p>{msg.content}</p>

          <div className="mt-2 space-y-1">
            {attachments.map((att) => {
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
                  return <VoiceMessage key={att.attachment_id} src={att.attachment_url} />;
                default:
                  return (
                    <a
                      key={att.attachment_id}
                      href={att.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-600 underline text-sm block"
                    >
                      添付ファイルを開く
                    </a>
                  );
              }
            })}
          </div>

          <p className="text-[10px] text-gray-500 mt-1">
            {msg.username} ・ {formatTime(msg.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
