// src/components/Chat/ContextMenu.tsx
"use client";
import React from "react";
import { Message } from "../../types/chat"

type Props = {
  contextMenu: { x: number; y: number } | null;
  selectedMessage: Message | null;
  onClose: () => void;
  onReply: () => void;
  onDelete: () => void;
};

const ContextMenu = ({ contextMenu, selectedMessage, onClose, onReply, onDelete }: Props) => {
  if (!contextMenu || !selectedMessage) return null;

  return (
    <div
      className="fixed bg-white border rounded shadow-lg z-50 context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={onClose}
    >
      <ul className="text-sm">
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            onReply();
            onClose();
          }}
        >
          リプライ
        </li>
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          削除
        </li>
      </ul>
    </div>
  );
};

export default ContextMenu;
