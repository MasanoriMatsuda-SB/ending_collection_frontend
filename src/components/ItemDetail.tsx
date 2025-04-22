"use client";
import { useEffect, useState, useRef } from "react";
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
    category_name: string;
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

// フロント内でmarket priceをランダムに作成してヒストグラムへ start //
const randn_bm = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// const generateNormalPrices = (mean: number, std: number, count: number): number[] => {
//     const round100 = (n: number) => Math.round(n / 100) * 100;
//     return Array.from({ length: count }, () =>
//         Math.max(round100(mean + std * randn_bm()), 100)
//     );
// };
// フロント内でmarket priceをランダムに作成してヒストグラムへ end //

export default function ItemDetail({ itemId }: Props) {
    const [item, setItem] = useState<ItemData | null>(null);
    const [_, setReferenceItem] = useState<ReferenceItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showEstimate, setShowEstimate] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [conditionFilter, setConditionFilter] = useState<string>("全て");
    const [marketPrices, setMarketPrices] = useState<number[]>([]);
    const router = useRouter();

    const [medianPrice, setMedianPrice] = useState<number | null>(null);
    const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
    const [histogramData, setHistogramData] = useState<HistogramBin[]>([]);
    const [conditionPriceData, setConditionPriceData] = useState<Record<string, number[]>>({});  // フロント内でmarket priceをランダムに作成してヒストグラムへ

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
                // フロント内でmarket priceをランダムに作成してヒストグラムへ start //
                const round100 = (n: number) => Math.round(n / 100) * 100;
                const generatePrices = (base: number, shape: string): number[] => {
                    const sigma = base * 0.2;
                    let mu = base;
                    if (shape === "left") mu *= 0.9;
                    else if (shape === "right") mu *= 1.1;
                    return Array.from({ length: 48 }, () =>
                        Math.max(round100(mu + sigma * (Math.random() * 2 - 1)), 100)
                    );
                };
                const baseRaw = Math.floor(Math.random() * (1000000 - 1000 + 1)) + 1000;
                const base = Math.floor(baseRaw / 100) * 100;
                const baseMap = {
                    S: round100(base * 1.0),
                    A: round100(base * 0.7),
                    B: round100(base * 0.4),
                    C: round100(base * 0.3),
                    D: round100(base * 0.1),
                };
                const shapeTypes = ["center", "left", "right"] as const;
                const shapeMap = {
                    S: shapeTypes[Math.floor(Math.random() * 3)],
                    A: shapeTypes[Math.floor(Math.random() * 3)],
                    B: shapeTypes[Math.floor(Math.random() * 3)],
                    C: shapeTypes[Math.floor(Math.random() * 3)],
                    D: shapeTypes[Math.floor(Math.random() * 3)],
                };
                const newData: Record<string, number[]> = {};
                for (const key of ["S", "A", "B", "C", "D"] as const) {
                    newData[key] = generatePrices(baseMap[key], shapeMap[key]);
                }
                setConditionPriceData(newData);
                // フロント内でmarket priceをランダムに作成してヒストグラムへ end //
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

    // DBからmarket priceを取得してヒストグラムへ start//
    // useEffect(() => {
    //     if (!item?.ref_item_id || !showEstimate) return;

    //     const fetchMarketPrices = async () => {
    //         const url = `${process.env.NEXT_PUBLIC_API_URL}/reference-market-items?ref_item_id=${item.ref_item_id}&condition_rank=${conditionFilter}`;
    //         const res = await fetch(url);
    //         const data = await res.json();
    //         const prices = data.market_prices;

    //         if (prices.length === 0) {
    //             setMarketPrices([]);
    //             setMedianPrice(null);
    //             setPriceRange(null);
    //             setHistogramData([]);
    //             return;
    //         }

    //         // 外れ値除去（上下3%カット）
    //         const sorted = [...prices].sort((a, b) => a - b);
    //         const cut = Math.floor(prices.length * 0.03);
    //         const trimmed = sorted.slice(cut, prices.length - cut);

    //         const mid = Math.floor(trimmed.length / 2);
    //         const median = trimmed.length % 2 === 0
    //             ? Math.round((trimmed[mid - 1] + trimmed[mid]) / 2)
    //             : trimmed[mid];

    //         const range: [number, number] = [Math.min(...trimmed), Math.max(...trimmed)];

    //         // ヒストグラム作成
    //         const bins: Record<string, number> = {};
    //         const binSize = 500;
    //         for (const price of trimmed) {
    //             const bin = Math.floor(price / binSize) * binSize;
    //             bins[bin] = (bins[bin] || 0) + 1;
    //         }
    //         const hist = Object.entries(bins).map(([k, v]) => ({
    //             price: Number(k),
    //             count: v,
    //         })).sort((a, b) => a.price - b.price);

    //         setMarketPrices(prices);
    //         setMedianPrice(median);
    //         setPriceRange(range);
    //         setHistogramData(hist);
    //     };

    //     fetchMarketPrices();
    // }, [item?.ref_item_id, showEstimate, conditionFilter]);
    // DBからmarket priceを取得してヒストグラムへ end//

    // フロント内でmarket priceをランダムに作成してヒストグラムへ start //
    useEffect(() => {
        if (!showEstimate || Object.keys(conditionPriceData).length === 0) return;

        const prices = conditionFilter === "全て"
            ? Object.values(conditionPriceData).flat()
            : conditionPriceData[conditionFilter] ?? [];

        const sorted = [...prices].sort((a, b) => a - b);
        const trimmed = sorted;

        const mid = Math.floor(trimmed.length / 2);
        const median = trimmed.length % 2 === 0
            ? Math.round((trimmed[mid - 1] + trimmed[mid]) / 2)
            : trimmed[mid];

        const range: [number, number] = [
            Math.round(Math.min(...trimmed) / 100) * 100,
            Math.round(Math.max(...trimmed) / 100) * 100,
        ];

        const bins: Record<number, number> = {};
        const binSize = 500;
        for (const price of trimmed) {
            const bin = Math.floor(price / binSize) * binSize;
            bins[bin] = (bins[bin] || 0) + 1;
        }

        const hist = Object.entries(bins).map(([k, v]) => ({
            price: Number(k),
            count: v,
        })).sort((a, b) => a.price - b.price);

        setMarketPrices(trimmed);
        setMedianPrice(median);
        setPriceRange(range);
        setHistogramData(hist);
    }, [showEstimate, conditionFilter, conditionPriceData]);
    // フロント内でmarket priceをランダムに作成してヒストグラムへ end //

    const toggleMenu = () => setMenuOpen(!menuOpen);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuOpen]);

    const handleEdit = () => router.push(`/item/${itemId}/edit`);
    const handleToggleEstimate = () => {
        setShowEstimate(!showEstimate);
        setMenuOpen(false);
    };

    if (error) return <div className="text-red-500">エラー: {error}</div>;
    if (!item) return <div>読み込み中...</div>;

    return (
        <div className="pt-8 px-2 md:px-16 relative">
            <div className="flex justify-between items-center mb-8">
                <div
                    className="flex items-center justify-center text-[22px] font-bold"
                    style={{
                        width: "118px",
                        height: "46px",
                        borderRadius: "10px",
                        backgroundColor:
                            item.status === "active" ? "#c2ebeb" :
                                item.status === "archived" ? "#ffebeb" :
                                    "#bdbdbd",
                    }}
                >
                    {item.status === "active" ? "売却前" :
                        item.status === "archived" ? "売却済" :
                            "ステータス情報なし"}
                </div>
                <div className="relative">
                    <button onClick={toggleMenu} className="text-2xl font-bold px-2">⋮</button>
                    {menuOpen && (
                        <div ref={menuRef} className="absolute right-0 mt-2 bg-white border rounded shadow p-1 z-10 w-40">
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


            <div className="grid grid-cols-[140px_1fr] gap-y-1">
                <p className="font-bold text-[18px] mb-2">アイテム名</p>
                <p className="text-[18px]">{item.item_name}</p>

                <p className="font-bold text-[18px] mb-2">カテゴリ</p>
                <p className="text-[18px]">{item.category_name || "不明"}</p>

                <p className="font-bold text-[18px] mb-2">コンディション</p>
                <p className="text-[18px]">{item.condition_rank}</p>

                <p className="font-bold text-[18px] mb-6">メモ</p>
                <p className="text-[18px]">{item.description}</p>

                <p className="text-[14px] text-[#757575]">{item.username}</p>
                <p className="text-[14px] text-[#757575]">{new Date(item.updated_at).toLocaleDateString("ja-JP", {
                    year: "numeric", month: "long", day: "numeric"
                })}</p>
            </div>



            {showEstimate && (
                <div className="mt-8 pt-8 border-t-[2px] border-[#F5F5F5]">
                    {/* メルカリ推定価格ラベル */}
                    <div className="flex items-center mb-2">
                        <img src="/mercari.svg" alt="メルカリロゴ" className="h-15 w-15 mr-2" />
                        <span className="text-[22px] font-bold">メルカリ推定価格</span>
                    </div>

                    {/* コンディション選択 */}
                    <div className="mt-4 mb-6">
                        <label className="mr-2 font-semibold">コンディション:</label>
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
                                    <YAxis allowDecimals={false} />
                                    <Tooltip formatter={(v: number) => `${v} 件`} />
                                    <Bar dataKey="count" fill="#636efa" />
                                    {medianPrice && histogramData.some(h => h.price === Math.floor(medianPrice / 500) * 500) && (
                                        <ReferenceLine
                                            x={Math.floor(medianPrice / 500) * 500}
                                            stroke="red"
                                            strokeWidth={2}
                                        />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-6 grid grid-cols-[160px_1fr] gap-y-1">
                                    <p className="text-[18px] mb-2">メルカリ推定価格</p>
                                    <p className="font-bold text-[18px]">¥{medianPrice?.toLocaleString()}</p>

                                    <p className="text-[18px] mb-2">価格帯</p>
                                    <p className="font-bold text-[18px]">¥{priceRange?.[0].toLocaleString()}〜¥{priceRange?.[1].toLocaleString()}</p>
                            </div>
                            <div className="flex justify-center mt-6 mb-6">
                                <button
                                        className="w-full max-w-[600px] mt-6 mb-6 py-3 px-4 rounded-full text-white font-bold transition bg-[#7B6224] hover:bg-[#A8956F]"
                                >
                                    メルカリで出品する
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
