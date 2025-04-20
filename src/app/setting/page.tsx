// src/app/setting/page.tsx
'use client'

import { useAuth } from '@/lib/AuthContext'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function SettingPage() {
  const { user, refreshUser } = useAuth()

  const [editingField, setEditingField] =
    useState<'photo' | 'username' | 'email' | 'password' | null>(null)
  const [newValue, setNewValue] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')

  const handleUpdate = async () => {
    if (!editingField) return
    setIsUpdating(true)
    setError('')
    try {
      const formData = new FormData()
      if (editingField === 'photo' && uploadFile) {
        formData.append('photo', uploadFile)
      } else if (editingField === 'username') {
        formData.append('username', newValue)
      } else if (editingField === 'email') {
        formData.append('email', newValue)
      } else if (editingField === 'password') {
        formData.append('password', newValue)
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/users/me`, {
        method: 'PATCH',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: formData
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data.detail as string) || '更新に失敗しました')
      }

      // 成功したら新しいトークンを受け取り、localStorage に上書き
      const data = (await res.json()) as { access_token: string }
      localStorage.setItem('token', data.access_token)
      await refreshUser()
      setEditingField(null)
      setNewValue('')
      setUploadFile(null)
    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : String(error)
      setError(message || '更新に失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-gray-900">ログインが必要です</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-8">アカウント情報</h1>

      {/* アバター */}
      <div className="flex flex-col items-center mb-8">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover mb-2"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-200 rounded-full mb-2" />
        )}
        <button
          onClick={() => {
            setEditingField('photo')
            setError('')
          }}
          className="text-sm text-[#17B5B5] hover:underline mb-2"
        >
          変更する
        </button>

        {editingField === 'photo' && (
          <div className="flex flex-col items-center gap-2">
            {/* ファイル選択ボタン＋ファイル名表示 */}
            <div className="flex items-center gap-2">
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setUploadFile(e.target.files ? e.target.files[0] : null)
                }
              />
              <label
                htmlFor="photo-input"
                className={`px-4 py-2 border border-[#7B6224] text-[#7B6224] bg-white rounded-full transition cursor-pointer
                  ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#7B6224] hover:text-white'}`}
              >
                ファイルを選択する
              </label>
              {uploadFile && (
                <span className="text-sm text-gray-700 truncate max-w-xs">
                  {uploadFile.name}
                </span>
              )}
            </div>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`px-4 py-2 border border-[#7B6224] text-[#7B6224] bg-white rounded-full transition
                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#7B6224] hover:text-white'}`}
            >
              {isUpdating ? '保存中…' : '保存'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )}
      </div>

      {/* お名前 */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-1">お名前</p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">{user.sub}</p>
          <button
            onClick={() => {
              setEditingField('username')
              setNewValue(user.sub)
              setError('')
            }}
            className="text-sm text-[#17B5B5] hover:underline"
          >
            変更する
          </button>
        </div>
        {editingField === 'username' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              className="flex-1 border px-2 py-1 rounded"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`px-4 py-2 border border-[#7B6224] text-[#7B6224] bg-white rounded-full transition
                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#7B6224] hover:text-white'}`}
            >
              {isUpdating ? '保存中…' : '保存'}
            </button>
          </div>
        )}
        {error && editingField === 'username' && (
          <p className="mt-1 text-red-500 text-sm">{error}</p>
        )}
      </div>

      {/* メールアドレス */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-1">メールアドレス</p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">{user.email}</p>
          <button
            onClick={() => {
              setEditingField('email')
              setNewValue(user.email!)
              setError('')
            }}
            className="text-sm text-[#17B5B5] hover:underline"
          >
            変更する
          </button>
        </div>
        {editingField === 'email' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="email"
              className="flex-1 border px-2 py-1 rounded"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`px-4 py-2 border border-[#7B6224] text-[#7B6224] bg-white rounded-full transition
                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#7B6224] hover:text-white'}`}
            >
              {isUpdating ? '保存中…' : '保存'}
            </button>
          </div>
        )}
        {error && editingField === 'email' && (
          <p className="mt-1 text-red-500 text-sm">{error}</p>
        )}
      </div>

      {/* パスワード */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-1">パスワード</p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">********</p>
          <button
            onClick={() => {
              setEditingField('password')
              setNewValue('')  
              setError('')
            }}
            className="text-sm text-[#17B5B5] hover:underline"
          >
            変更する
          </button>
        </div>
        {editingField === 'password' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="password"
              placeholder="新しいパスワード"
              className="flex-1 border px-2 py-1 rounded"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`px-4 py-2 border border-[#7B6224] text-[#7B6224] bg-white rounded-full transition
                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#7B6224] hover:text-white'}`}
            >
              {isUpdating ? '保存中…' : '保存'}
            </button>
          </div>
        )}
        {error && editingField === 'password' && (
          <p className="mt-1 text-red-500 text-sm">{error}</p>
        )}
      </div>
    </div>
  )
}
