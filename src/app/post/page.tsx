// src/app/post/page.tsx
'use client';

import { useState, useEffect, JSX } from 'react';
import { useRouter } from 'next/navigation';
import CameraModal from './components/CameraModal';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';

interface Category {
  category_id: number;
  category_name: string;
  parent_category_id: number | null;
}

interface JwtPayload {
  sub: string;
  user_id: number;
  photoURL?: string | null;
  exp: number;
  iat: number;
}

interface BatchItem {
  id: number;
  cropImageUrl: string;
  itemName: string;
  category: string;
  condition: string;
  memo: string;
  selected: boolean;
}

// バッチ検出結果の型
interface YoloDetectResult {
  id: number;
  crop_image_url: string;
}

// 画像解析結果の型
interface AnalyzeResult {
  detected_name: string;
}

export default function PostPage() {
  return <PostPageContent />;
}

function PostPageContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [groupId, setGroupId] = useState<number>(1);

  // JWTからユーザーID取得
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const { user_id } = jwtDecode<JwtPayload>(token);
        setUserId(user_id);
      } catch {
        // ignore
      }
    }
    // ローカルストレージから現在の group_id を取得
    const stored = localStorage.getItem('selectedGroupId');
    if (stored && !isNaN(Number(stored))) {
      setGroupId(Number(stored));
    }
  }, []);

  // カテゴリ取得
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        if (!res.ok) throw new Error();
        setCategories(await res.json());
      } catch {
        // ignore
      }
    }
    fetchCategories();
  }, []);

  const renderCategoryOptions = (parentId: number | null = null, level = 0): JSX.Element[] => {
    return categories.flatMap(cat =>
      cat.parent_category_id === parentId
        ? [
            <option key={cat.category_id} value={cat.category_id}>
              {`${'　'.repeat(level)}${cat.category_name}`}
            </option>,
            ...renderCategoryOptions(cat.category_id, level + 1),
          ]
        : []
    );
  };

  // 画像解析（共通）
  const handleImageSelect = async (file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setItemName('アイテム名推測中…');
    try {
      const fm = new FormData();
      fm.append('image', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/openai_analyze`, {
        method: 'POST',
        body: fm,
      });
      if (!res.ok) throw new Error();
      const result = (await res.json()) as AnalyzeResult;
      setItemName(result.detected_name);
    } catch {
      setError('画像の解析中にエラーが発生しました');
    }
  };

  // 一つずつタブ用
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };
  const handleCameraCapture = (file: File) => {
    handleImageSelect(file);
    setIsCameraOpen(false);
  };

  // シングル送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!userId) {
      setError('ログインユーザー情報が取得できません');
      setIsLoading(false);
      return;
    }
    if (!selectedImage) {
      setError('画像を選択してください');
      setIsLoading(false);
      return;
    }
    try {
      const fm = new FormData();
      fm.append('image', selectedImage);
      fm.append('item_name', itemName);
      fm.append('category_id', category);
      fm.append('condition_rank', condition);
      fm.append('description', memo);
      fm.append('group_id', String(groupId));
      fm.append('user_id', String(userId));
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items`, { method: 'POST', body: fm });
      if (!res.ok) throw new Error();
      const data = await res.json();
      router.push(`/post/finish?id=${data.item_id}`);
    } catch {
      setError('投稿中にエラーが発生しました');
      setIsLoading(false);
    }
  };

  // バッチタブ用
  const handleBatchImageSelect = async (file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const fm = new FormData();
      fm.append('image', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/yolo_detect`, {
        method: 'POST',
        body: fm,
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as YoloDetectResult[];
      const items: BatchItem[] = data.map(det => ({
        id: det.id,
        cropImageUrl: det.crop_image_url,
        itemName: '',
        category: '',
        condition: '',
        memo: '',
        selected: false,
      }));
      setBatchItems(items);
      items.forEach((it, i) => analyzeBatchItemName(i, it.cropImageUrl));
    } catch {
      setError('まとめて追加用の画像検出処理中にエラーが発生しました');
    }
  };
  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleBatchImageSelect(file);
  };
  const handleBatchCameraCapture = (file: File) => {
    handleBatchImageSelect(file);
    setIsCameraOpen(false);
  };

  // バッチアイテム更新
  const updateBatchItemField = (idx: number, field: keyof BatchItem, val: string | boolean) => {
    setBatchItems(bs => bs.map((b, i) => (i === idx ? { ...b, [field]: val } : b)));
  };

  // バッチ用解析
  const analyzeBatchItemName = async (idx: number, url: string) => {
    updateBatchItemField(idx, 'itemName', 'アイテム名推測中…');
    try {
      const proxy = `${process.env.NEXT_PUBLIC_API_URL}/proxy_image?url=${encodeURIComponent(url)}`;
      const blob = await (await fetch(proxy)).blob();
      const file = new File([blob], 'crop.jpg', { type: blob.type });
      const fm = new FormData();
      fm.append('image', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/openai_analyze`, {
        method: 'POST',
        body: fm,
      });
      if (!res.ok) throw new Error();
      const result = (await res.json()) as AnalyzeResult;
      updateBatchItemField(idx, 'itemName', result.detected_name);
    } catch {
      // ignore
    }
  };

  // バッチ送信
  const handleBatchSubmit = async () => {
    setError('');
    setIsLoading(true);
    if (!userId) {
      setError('ログインユーザー情報が取得できません');
      setIsLoading(false);
      return;
    }
    const toSend = batchItems.filter(b => b.selected);
    if (toSend.length === 0) {
      setError('1件以上選択してください');
      setIsLoading(false);
      return;
    }
    try {
      for (const b of toSend) {
        const proxy = `${process.env.NEXT_PUBLIC_API_URL}/proxy_image?url=${encodeURIComponent(
          b.cropImageUrl
        )}`;
        const blob = await (await fetch(proxy)).blob();
        const file = new File([blob], 'batch_item.jpg', { type: blob.type });
        const fm = new FormData();
        fm.append('image', file);
        fm.append('item_name', b.itemName);
        fm.append('category_id', b.category);
        fm.append('condition_rank', b.condition);
        fm.append('description', b.memo);
        fm.append('group_id', String(groupId));
        fm.append('user_id', String(userId));
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
          method: 'POST',
          body: fm,
        });
        if (!res.ok) throw new Error();
      }
      router.push(`/post/finish?count=${encodeURIComponent(String(toSend.length))}`);
    } catch {
      setError('まとめて追加中にエラーが発生しました');
      setIsLoading(false);
    }
  };

  const canSubmit = !!selectedImage && itemName && category && condition;
  const isBatchItemSelectable = (b: BatchItem) => b.itemName && b.category && b.condition;
  const canBatchSubmit = batchItems.some(b => b.selected);

  // タブ切替時にリセット
  const switchTab = (tab: 'single' | 'batch') => {
    setActiveTab(tab);
    setSelectedImage(null);
    setPreviewUrl(null);
    setError('');
    setBatchItems([]);
    setItemName('');
    setCategory('');
    setCondition('');
    setMemo('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl p-8 bg-white rounded shadow mb-8">
        {/* タブ切替 */}
        <div className="flex mb-4 border-b border-gray-300">
          <button
            onClick={() => switchTab('single')}
            className={`px-4 py-2 focus:outline-none ${
              activeTab === 'single'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600'
            }`}
          >
            一つずつ追加
          </button>
          <button
            onClick={() => switchTab('batch')}
            className={`px-4 py-2 focus:outline-none ${
              activeTab === 'batch'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600'
            }`}
          >
            まとめて追加
          </button>
        </div>

        <div className="min-h-[660px]">
          {activeTab === 'single' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 画像 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">画像</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-4 py-2 border border-[#7B6224] text-[#7B6224] bg-white rounded-full hover:bg-[#7B6224] hover:text-white transition"
                  >
                    カメラで撮影
                  </button>
                  <div>
                    <label
                      htmlFor="single-file-input"
                      className="inline-block px-4 py-2 border border-[#7B6224] text-[#7B6224] bg-white rounded-full cursor-pointer hover:bg-[#7B6224] hover:text-white transition"
                    >
                      ファイルを開く
                    </label>
                    <input
                      id="single-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      {selectedImage ? selectedImage.name : '選択されていません'}
                    </p>
                  </div>
                </div>
                {previewUrl && (
                  <div className="mt-4">
                    <img src={previewUrl} alt="Preview" className="max-h-64 rounded" />
                  </div>
                )}
              </div>

              {/* アイテム名 */}
              <div>
                <label className="block text-sm font-medium text-gray-900">アイテム名</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* カテゴリー */}
              <div>
                <label className="block text-sm font-medium text-gray-900">カテゴリー</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">選択してください</option>
                  {renderCategoryOptions()}
                </select>
              </div>

              {/* 状態 */}
              <div>
                <label className="block text-sm font-medium text-gray-900">状態</label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">選択してください</option>
                  <option value="S">S：新品、未使用</option>
                  <option value="A">A：未使用に近い</option>
                  <option value="B">B：目立った傷や汚れなし</option>
                  <option value="C">C：やや傷や汚れあり</option>
                  <option value="D">D：傷や汚れあり</option>
                </select>
              </div>

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-900">メモ</label>
                <textarea
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-green-500 focus:border-green-500"
                  rows={4}
                  placeholder="アイテムについての説明や思い出を入力してください"
                />
              </div>

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={isLoading || !canSubmit}
                className={`w-full py-3 px-4 rounded-full text-white font-bold transition ${
                  isLoading || !canSubmit ? 'bg-[#A8956F] cursor-not-allowed opacity-50' : 'bg-[#7B6224] hover:bg-[#A8956F]'
                }`}
              >
                {isLoading ? '投稿中...' : '追加する'}
              </button>

              {/* ホームに戻る */}
              <div className="mt-4 text-center">
                <Link href="/" className="text-[#7B6224] font-semibold hover:text-[#A8956F]">
                  追加しないでホーム画面に戻る
                </Link>
              </div>
            </form>
          )}

          {activeTab === 'batch' && (
            <div className="space-y-6">
              {/* まとめて追加タブ：画像 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">画像</label>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-4 py-2 border border-[#7B6224] text-[#7B6224] bg-white rounded-full hover:bg-[#7B6224] hover:text-white transition"
                  >
                    カメラで撮影
                  </button>
                  <div>
                    <label
                      htmlFor="batch-file-input"
                      className="inline-block px-4 py-2 border border-[#7B6224] text-[#7B6224] bg-white rounded-full cursor-pointer hover:bg-[#7B6224] hover:text-white transition"
                    >
                      ファイルを開く
                    </label>
                    <input
                      id="batch-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleBatchFileSelect}
                      className="hidden"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      {selectedImage ? selectedImage.name : '選択されていません'}
                    </p>
                  </div>
                </div>
                {previewUrl && (
                  <div className="mt-4">
                    <img src={previewUrl} alt="Batch Preview" className="max-h-64 rounded" />
                  </div>
                )}
              </div>

              {batchItems.length > 0 && (
                <div className="space-y-4">
                  {batchItems.map((item, index) => (
                    <div key={item.id} className="border p-4 rounded-md relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">検出結果 #{item.id}</span>
                        <input
                          type="checkbox"
                          disabled={!isBatchItemSelectable(item)}
                          checked={item.selected}
                          onChange={e => updateBatchItemField(index, 'selected', e.target.checked)}
                          className="form-checkbox h-6 w-6 text-green-600"
                        />
                      </div>
                      <div className="mb-2">
                        <img
                          src={item.cropImageUrl}
                          alt={`Object ${item.id}`}
                          className="max-h-48 rounded"
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-900">アイテム名</label>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={e => updateBatchItemField(index, 'itemName', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-900">カテゴリー</label>
                        <select
                          value={item.category}
                          onChange={e => updateBatchItemField(index, 'category', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border	border-gray-300 rounded focus:outline-none focus:ring-green-500 focus;border-green-500"
                        >
                          <option value="">選択してください</option>
                          {renderCategoryOptions()}
                        </select>
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-900">状態</label>
                        <select
                          value={item.condition}
                          onChange={e => updateBatchItemField(index, 'condition', e.target.value)}
                          className="w-full mt-1 px-3 py-2	border	border-gray-300 rounded focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">選択してください</option>
                          <option value="S">S：新品、未使用</option>
                          <option value="A">A：未使用に近い</option>
                          <option value="B">B：目立った傷や汚れなし</option>
                          <option value="C">C：やや傷や汚れあり</option>
                          <option value="D">D：傷や汚れあり</option>
                        </select>
                      </div>
                      <div className="mb-2">
                        <label className="block	text-sm font-medium text-gray-900">メモ</label>
                        <textarea
                          value={item.memo}
                          onChange={e => updateBatchItemField(index, 'memo', e.target.value)}
                          className="w-full mt-1 px-3 py-2	border	border-gray-300 rounded focus:outline-none focus:ring-green-500 focus;border-green-500"
                          rows={3}
                          placeholder="説明を入力してください"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleBatchSubmit}
                    disabled={isLoading || !canBatchSubmit}
                    className={`w-full py-3 px-4 rounded-full text-white font-bold transition ${
                      isLoading || !canBatchSubmit
                        ? 'bg-[#A8956F] cursor-not-allowed opacity-50'
                        : 'bg-[#7B6224] hover:bg-[#A8956F]'
                    }`}
                  >
                    {isLoading ? '追加中...' : 'チェックしたものを追加する'}
                  </button>
                </div>
              )}
              <div className="mt-4 text-center">
                <Link href="/" className="text-[#7B6224] font-semibold hover:text-[#A8956F]">
                  追加しないでホーム画面に戻る
                </Link>
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={activeTab === 'single' ? handleCameraCapture : handleBatchCameraCapture}
      />
    </div>
  );
}
