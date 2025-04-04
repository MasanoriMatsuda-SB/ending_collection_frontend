// src/app/post/page.tsx
'use client';

import { useState, useEffect, JSX } from 'react';
import { useRouter } from 'next/navigation';
import CameraModal from './components/CameraModal';
import { jwtDecode } from 'jwt-decode';

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

export default function PostPage() {
  const router = useRouter();
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

  // ログインユーザーの情報をトークンから取得
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserId(decoded.user_id);
      } catch (error) {
        console.error('JWT decode error:', error);
      }
    }
  }, []);

  // バックエンドからカテゴリー情報を取得
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        if (!res.ok) throw new Error('カテゴリ情報の取得に失敗しました');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // カテゴリーの階層構造を再帰的に表示する関数
  const renderCategoryOptions = (parentId: number | null = null, level: number = 0): JSX.Element[] => {
    const result: JSX.Element[] = [];
    categories.forEach((cat) => {
      if (cat.parent_category_id === parentId) {
        result.push(
          <option key={cat.category_id} value={cat.category_id}>
            {`${'　'.repeat(level)}${cat.category_name}`}
          </option>
        );
        result.push(...renderCategoryOptions(cat.category_id, level + 1));
      }
    });
    return result;
  };

  const handleImageSelect = async (file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));

    // 画像解析
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('画像解析に失敗しました');

      const data = await res.json();
      setItemName(data.detected_name);
    } catch (err) {
      console.error('Image analysis error:', err);
      setError('画像の解析中にエラーが発生しました');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageSelect(file);
    }
  };

  const handleCameraCapture = async (file: File) => {
    await handleImageSelect(file);
    setIsCameraOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!userId) {
      setError('ログインユーザー情報が取得できません');
      setIsLoading(false);
      return;
    }

    try {
      if (!selectedImage) {
        setError('画像を選択してください');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('item_name', itemName);
      formData.append('category_id', category);
      formData.append('condition_rank', condition);
      formData.append('description', memo);
      formData.append('group_id', '1'); // 仮の値。必要に応じてユーザーのグループIDに変更してください。
      formData.append('user_id', String(userId));  // ログインユーザーのIDを設定

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || '投稿に失敗しました');
      }

      const data = await res.json();
      router.push(`/post/finish?id=${data.item_id}`);
    } catch (err: unknown) {
      console.error('Post error:', err);
      setError(err instanceof Error ? err.message : '投稿中にエラーが発生しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl p-8 bg-white rounded shadow">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">アイテムを追加</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 画像選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">画像</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                カメラで撮影
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-50 file:text-green-700
                  hover:file:bg-green-100"
              />
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
              onChange={(e) => setItemName(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* カテゴリー */}
          <div>
            <label className="block text-sm font-medium text-gray-900">カテゴリー</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">選択してください</option>
              {renderCategoryOptions()}
            </select>
          </div>

          {/* コンディション */}
          <div>
            <label className="block text-sm font-medium text-gray-900">状態</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
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
              onChange={(e) => setMemo(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
              rows={4}
              placeholder="アイテムについての説明や思い出を入力してください"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded transition ${
              isLoading
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isLoading ? '投稿中...' : '追加する'}
          </button>
        </form>

        {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
