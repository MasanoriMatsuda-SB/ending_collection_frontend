"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

type Props = {
    itemId: string;
};

type ItemData = {
    item_id: number;
    user_id: number;
    item_name: string;
    description: string;
    ref_item_id: number;
    category_id: number;
    condition_rank: string;
    status: string;
    updated_at: string;
    username: string;
};

type ReferenceItem = {
    ref_item_id: number;
    category_id: number;
    item_name: string;
    brand_name: string | null;
    created_at: string;
};

type HistogramBin = {
    price: number;
    count: number;
};

export default function ItemDetail({ itemId }: Props) {
    const [item, setItem] = useState<ItemData | null>(null);
    const [referenceItem, setReferenceItem] = useState<ReferenceItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showEstimate, setShowEstimate] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [conditionFilter, setConditionFilter] = useState<string>("全て");
    const [marketPrices, setMarketPrices] = useState<number[]>([]);
    const router = useRouter();

    const [medianPrice, setMedianPrice] = useState<number | null>(null);
    const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
    const [histogramData, setHistogramData] = useState<HistogramBin[]>([]);

    useEffect(() => {
        const fetchItemAndRef = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/detail/${itemId}`);
                if (!res.ok) throw new Error("Item not found");
                const itemData = await res.json();
                setItem(itemData);

                if (itemData.ref_item_id) {
                    const refRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reference-items/${itemData.ref_item_id}`);
                    const refData = refRes.ok ? await refRes.json() : null;
                    setReferenceItem(refData);
                }
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("不明なエラーが発生しました");
                }
            }
        };
        fetchItemAndRef();
    }, [itemId]);

    useEffect(() => {
        setShowEstimate(false);
        setMenuOpen(false);
        setConditionFilter("全て");
        setMarketPrices([]);
        setMedianPrice(null);
        setPriceRange(null);
        setHistogramData([]);
    }, [itemId]);

    useEffect(() => {
        if (!item?.ref_item_id || !showEstimate) return;

        const fetchMarketPrices = async () => {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/reference-market-items?ref_item_id=${item.ref_item_id}&condition_rank=${conditionFilter}`;
            const res = await fetch(url);
            const data = await res.json();
            const prices = data.market_prices;

            if (prices.length === 0) {
                setMarketPrices([]);
                setMedianPrice(null);
                setPriceRange(null);
                setHistogramData([]);
                return;
            }

            // 外れ値除去（上下3%カット）
            const sorted = [...prices].sort((a, b) => a - b);
            const cut = Math.floor(prices.length * 0.03);
            const trimmed = sorted.slice(cut, prices.length - cut);

            const mid = Math.floor(trimmed.length / 2);
            const median = trimmed.length % 2 === 0
                ? Math.round((trimmed[mid - 1] + trimmed[mid]) / 2)
                : trimmed[mid];

            const range: [number, number] = [Math.min(...trimmed), Math.max(...trimmed)];

            // ヒストグラム作成
            const bins: Record<string, number> = {};
            const binSize = 500;
            for (const price of trimmed) {
                const bin = Math.floor(price / binSize) * binSize;
                bins[bin] = (bins[bin] || 0) + 1;
            }
            const hist = Object.entries(bins).map(([k, v]) => ({
                price: Number(k),
                count: v,
            })).sort((a, b) => a.price - b.price);

            setMarketPrices(prices);
            setMedianPrice(median);
            setPriceRange(range);
            setHistogramData(hist);
        };

        fetchMarketPrices();
    }, [item?.ref_item_id, showEstimate, conditionFilter]);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const handleEdit = () => router.push(`/item/${itemId}/edit`);
    const handleToggleEstimate = () => {
        setShowEstimate(!showEstimate);
        setMenuOpen(false);
    };

    if (error) return <div className="text-red-500">エラー: {error}</div>;
    if (!item) return <div>読み込み中...</div>;

    return (
        <div className="p-4 relative">
            <div className="flex justify-between items-start">
                <h1 className="text-xl font-bold mb-4">アイテム詳細</h1>
                <div className="relative">
                    <button onClick={toggleMenu} className="text-2xl font-bold px-2">⋮</button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 bg-white border rounded shadow p-1 z-10 w-40">
                            <button onClick={handleEdit} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                                詳細を編集する
                            </button>
                            <button onClick={handleToggleEstimate} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                                {showEstimate ? "価格推定を非表示" : "価格推定を表示"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <p><strong>ID:</strong> {item.item_id}</p>
            <p><strong>ユーザーID:</strong> {item.user_id}</p>
            <p><strong>名前:</strong> {item.item_name}</p>
            <p><strong>説明:</strong> {item.description}</p>
            <p><strong>カテゴリID:</strong> {item.category_id}</p>
            <p><strong>状態ランク:</strong> {item.condition_rank}</p>
            <p><strong>ステータス:</strong> {item.status}</p>
            <p><strong>ユーザー名:</strong> {item.username}</p>
            <p><strong>更新日時:</strong> {new Date(item.updated_at).toLocaleString()}</p>

            {showEstimate && (
                <div className="mt-4 border-t pt-4">
                    <div className="mb-2">
                        <label className="mr-2 font-semibold">状態ランク:</label>
                        <select
                            value={conditionFilter}
                            onChange={(e) => setConditionFilter(e.target.value)}
                            className="border p-1 rounded"
                        >
                            {["全て", "S", "A", "B", "C", "D"].map(rank => (
                                <option key={rank} value={rank}>{rank}</option>
                            ))}
                        </select>
                    </div>

                    {marketPrices.length === 0 ? (
                        <p>参考データがありません</p>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={histogramData}>
                                    <XAxis dataKey="price" tickFormatter={(p) => `¥${p}`} />
                                    <YAxis />
                                    <Tooltip formatter={(v: number) => `${v} 件`} />
                                    <Bar dataKey="count" fill="#8884d8" />
                                    {medianPrice && (
                                        <ReferenceLine x={Math.floor(medianPrice / 500) * 500} stroke="red" strokeWidth={2} />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>

                            <p className="mt-2"><strong>メルカリ推定価格:</strong> ¥{medianPrice?.toLocaleString()}</p>
                            <p><strong>推定価格帯:</strong> ¥{priceRange?.[0].toLocaleString()}〜¥{priceRange?.[1].toLocaleString()}</p>
                            <button className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                                メルカリで出品する
                            </button>
                            <p><strong>ref_item_id:</strong> {item.ref_item_id}</p>
                            <p><strong>参考アイテム名:</strong> {referenceItem?.item_name}</p>
                            <p><strong>ブランド:</strong> {referenceItem?.brand_name ?? "なし"}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
