"use client";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

type JwtPayload = {
    user_id: number;
};

export default function HomePage() {
    const [itemIds, setItemIds] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const decoded = token ? jwtDecode<JwtPayload>(token) : null;
        const userId = decoded?.user_id;

        if (!userId) return;

        const fetchItemIds = async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/item-ids`);
            const data = await res.json();
            setItemIds(data.map(String));
        };

        fetchItemIds();
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">あなたのアイテム一覧</h1>
            <div className="space-y-2">
                {itemIds.map((id) => (
                    <button
                        key={id}
                        onClick={() => router.push(`/item/${id}`)}
                        className="block w-full text-left px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                    >
                        item_id: {id}
                    </button>
                ))}
            </div>
        </div>
    );
}
