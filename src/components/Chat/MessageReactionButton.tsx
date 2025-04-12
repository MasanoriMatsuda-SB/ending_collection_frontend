"use client";

import { useState, useEffect } from "react";
import socket from "@/lib/socket";

interface Reaction {
  user_id: number;
  reaction_type: string;
}

interface Props {
  messageId: number;
  userId: number;
  initialReactions: Reaction[];
  onReact: (type: string) => void;
  onRemove: () => void;
  showAll?: boolean;
}

const EMOJIS = ["👍", "❤️", "😄", "😢", "👌"];

export default function MessageReactionButton({
  messageId,
  userId,
  initialReactions,
  onReact,
  onRemove,
  showAll = false,
}: Props) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);

  useEffect(() => {
    setReactions(initialReactions);
  }, [initialReactions]);

  const handleReaction = (type: string) => {
    const existing = reactions.find((r) => r.user_id === userId);
    if (existing?.reaction_type === type) {
      onRemove();
      socket.emit("remove_reaction", { message_id: messageId, user_id: userId });
      setReactions(reactions.filter((r) => r.user_id !== userId));
    } else {
      onReact(type);
      socket.emit("add_reaction", { message_id: messageId, user_id: userId, reaction_type: type });
  
      setReactions((prev) => {
        const filtered = prev.filter((r) => r.user_id !== userId);
        return [...filtered, { user_id: userId, reaction_type: type }];
      });
    }
  };

  // Socketで受け取ったリアクション更新を反映
  useEffect(() => {
    socket.on("reaction_added", (data) => {
      if (data.message_id === messageId && data.user_id !== userId) {
        // 他ユーザーによる更新 → fetchReactionsを使う前提なので無処理
      }
    });

    socket.on("reaction_removed", (data) => {
      if (data.message_id === messageId && data.user_id !== userId) {
        // 他ユーザーによる更新 → fetchReactionsを使う前提なので無処理
      }
    });

    return () => {
      socket.off("reaction_added");
      socket.off("reaction_removed");
    };
  }, [messageId]);

  return (
    <div className="flex gap-2 mt-1 ml-10 z-10 bg-white p-1 rounded shadow max-w-fit">
      {EMOJIS.map((emoji) => {
        const type = emojiToType(emoji);
        const count = reactions.filter((r) => r.reaction_type === type).length;
        const reacted = reactions.some(
          (r) => r.user_id === userId && r.reaction_type === type
        );

        // 通常時は count があるものだけ表示、showAll が true の時は全表示
        if (!showAll && count === 0) return null;

        return (
          <button
          key={emoji}
          onClick={() => handleReaction(type)}
          className={`text-xs px-1 py-0.5 rounded-full border ${reacted ? "bg-blue-100" : ""}`}
        >
          {emoji} {count > 0 && count}
        </button>
        );
      })}
    </div>
  );
}

function emojiToType(emoji: string): string {
  switch (emoji) {
    case "👍":
      return "like";
    case "❤️":
      return "heart";
    case "😄":
      return "smile";
    case "😢":
      return "sad";
    case "👌":
      return "agree";
    default:
      return "";
  }
}
