"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  itemId: string;
}

export default function SearchPopup({ onClose, itemId }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    try {
      //Index作成
      const indexRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rag/index/${itemId}`, {
        method: "POST",
      });
      if (!indexRes.ok) throw new Error("インデックス作成に失敗しました");

      //検索API実行
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rag/vector_search/${itemId}?query=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("検索APIエラー");

      const data = await res.json();

      console.log("APIレスポンス:", data);  //検証用（後で削除する）

      setResults(data.results.map((m: { content: string }) => m.content));
      setError(null);
    } catch (err) {
      console.error("検索失敗:", err);
      setError("検索中にエラーが発生しました");
      setResults([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">検索</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>

        {/* 検索ボックス */}
        <div className="flex mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索ワードを入力"
            className="flex-1 px-3 py-1 border border-gray-300 rounded-l"
          />
          <button
            onClick={handleSearch}
            // className="px-4 py-1 bg-blue-500 text-white rounded-r hover:bg-blue-600"
            className="px-4 py-1 bg-stone-500 text-white rounded-r hover:bg-stone-600"
          >
            検索
          </button>
        </div>

        {/* エラーメッセージ */}
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        {/* 検索結果 */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.length === 0 && !error ? (
            <p className="text-sm text-gray-500">検索結果はここに表示されます</p>
          ) : (
            results.map((r, idx) => (
              <div key={idx} className="text-sm p-2 bg-gray-100 rounded">{r}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
