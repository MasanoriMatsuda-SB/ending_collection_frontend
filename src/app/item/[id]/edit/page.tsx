// src/app/item/[id]/edit/page.tsx
"use client";

import { useParams } from "next/navigation";

export default function ItemDetailEdit() {
    const params = useParams();
    const itemId = params.id;

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">アイテム編集ページ</h1>
            <p>アイテムID: {itemId}</p>
            <p>ここに編集フォームを追加していきます。</p>
        </div>
    );
}
