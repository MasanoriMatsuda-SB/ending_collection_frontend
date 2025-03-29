"use client";

import { useState } from "react";

interface DevUserSwitcherProps {
  currentUserId: number;
  setCurrentUserId: (id: number) => void;
}

const users = [
  { id: 14, name: "Oyaji" },
  { id: 15, name: "Taro" },
  { id: 16, name: "Hanako" },
];

export default function DevUserSwitcher({ currentUserId, setCurrentUserId }: DevUserSwitcherProps) {
  return (
    <div className="flex items-center justify-center mt-4 space-x-2 text-sm bg-gray-100 p-2 rounded">
      <label htmlFor="user-switcher" className="text-gray-600">開発テスト用機能：ユーザー切り替え:</label>
      <select
        id="user-switcher"
        value={currentUserId}
        onChange={(e) => setCurrentUserId(Number(e.target.value))}
        className="border rounded px-2 py-1 text-sm"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}（ID: {user.id}）
          </option>
        ))}
      </select>
    </div>
  );
}
