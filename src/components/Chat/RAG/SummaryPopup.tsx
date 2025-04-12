"use client";

import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
  itemId: string;
}

export default function SummaryPopup({ onClose, itemId }: Props) {
    const [summary, setSummary] = useState("要約を取得中...");
  
    useEffect(() => {
      const fetchSummary = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rag/summary/${itemId}`);
          const data = await res.json();
          setSummary(data.summary);
        } catch (err) {
          console.error("要約取得失敗:", err);
          setSummary("要約の取得に失敗しました。");
        }
      };
  
      fetchSummary();
    }, [itemId]);
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-md max-w-lg w-full">
          <h2 className="text-xl font-semibold mb-4">要約</h2>
          <p className="mb-4">{summary}</p>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }
