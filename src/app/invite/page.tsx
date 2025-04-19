// src/app/invite/page.tsx
'use client'
export const dynamic = 'force-dynamic'

import { useAuth } from '@/lib/AuthContext'
import Button from '@/components/Button'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function InvitePage() {
  const { user, refreshUser, loading } = useAuth()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  // ── フォーム・状態管理フック ──
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [acceptStatus, setAcceptStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const [inviteLink, setInviteLink] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // ── 招待承認用エフェクト（必ず同じ位置で呼び出す） ──
  useEffect(() => {
    if (!user || !token || acceptStatus !== 'idle') return
    setAcceptStatus('loading')
    ;(async () => {
      try {
        const jwt = localStorage.getItem('token')
        const res = await fetch(`${API}/invite/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({ token })
        })
        if (!res.ok) throw new Error()
        setAcceptStatus('success')
        setTimeout(() => router.push('/'), 2000)
      } catch {
        setAcceptStatus('error')
      }
    })()
  }, [user, token, acceptStatus, router])

  // ① 認証中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p>読み込み中…</p>
      </div>
    )
  }

  // ② 未ログイン → ログインフォーム
  if (!user) {
    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('正しいメールアドレスの形式で入力してください')
        return
      }
      setError('')
      setIsLoading(true)
      try {
        const res = await fetch(`${API}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (!res.ok) {
          const detail = data.detail
          setError(typeof detail === 'string' ? detail : 'ログインに失敗しました')
          setIsLoading(false)
          return
        }
        localStorage.setItem('token', data.access_token)
        refreshUser()
        // 招待URL経由なら同じパラメータ付きでリロードして承認フェーズに
        if (token) {
          router.replace(`/invite?token=${encodeURIComponent(token)}`)
        } else {
          router.replace('/invite')
        }
      } catch (err) {
        console.error(err)
        setError('エラーが発生しました')
        setIsLoading(false)
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8 bg-gray-50 rounded shadow">
          <h2 className="text-xl font-semibold text-center mb-6 leading-snug">
            グループに追加したいアカウントで<br/>
            ログインしてください
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-[#17B5B5] focus:border-[#17B5B5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-[#17B5B5] focus:border-[#17B5B5]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-full text-white font-bold transition ${
                isLoading
                  ? 'bg-[#A8956F] cursor-not-allowed'
                  : 'bg-[#7B6224] hover:bg-[#A8956F]'
              }`}
            >
              {isLoading ? 'ログイン中…' : 'ログイン'}
            </button>
          </form>
          {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    )
  }

  // ③ 招待承認モード
  if (token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        {acceptStatus === 'loading' && <p>招待を承認中…</p>}
        {acceptStatus === 'success' && (
          <>
            <p className="text-green-600 mb-4">招待を承認しました！ グループに参加しました。</p>
            <Button title="ホームへ戻る" href="/" variant="main" />
          </>
        )}
        {acceptStatus === 'error' && (
          <>
            <p className="text-red-600 mb-4">リンクが無効か期限切れです</p>
            <Button title="ホームへ戻る" href="/" variant="sub" />
          </>
        )}
      </div>
    )
  }

  // ④ 招待作成モード
  const handleCreate = async () => {
    const gid = Number(localStorage.getItem('selectedGroupId'))
    if (!gid) {
      alert('グループが選択されていません。ホーム画面で選択してください。')
      return
    }
    setCreateError(null)
    setCreating(true)
    try {
      const jwt = localStorage.getItem('token')
      const res = await fetch(`${API}/invite/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ group_id: gid })
      })
      if (!res.ok) {
        if (res.status === 401) {
          setCreateError('トークンの有効期限が切れています\nログアウトしてください')
        } else {
          setCreateError('招待リンクの作成に失敗しました')
        }
        return
      }
      const { token: newToken } = await res.json()
      setInviteLink(`${window.location.origin}/invite?token=${newToken}`)
    } catch {
      setCreateError('招待リンクの作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .catch(() => alert('コピーに失敗しました。手動でコピーしてください。'))
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      alert('コピーしました')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-2xl font-bold mb-4">メンバー招待</h1>
      <p className="mb-6 text-center text-gray-700">
        グループに追加したいメンバーに<br/>
        招待リンクを送りましょう
      </p>

      {!inviteLink && (
        <>
          <button
            onClick={handleCreate}
            disabled={creating}
            className={`flex items-center justify-center w-full max-w-md py-3 px-4 rounded-full text-white font-bold transition 
              ${creating ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#7B6224] hover:bg-[#A8956F]'}`}
          >
            {creating ? '作成中…' : '招待リンクを発行する'}
          </button>
          {createError && (
            <p className="mt-4 whitespace-pre-line text-center text-red-500">
              {createError}
            </p>
          )}
        </>
      )}

      {inviteLink && (
        <div className="mt-6 w-full max-w-md space-y-4">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="w-full px-3 py-2 border rounded"
          />
          <button
            onClick={() => copyToClipboard(inviteLink)}
            className="flex items-center justify-center w-full max-w-md py-3 px-4 rounded-full text-white font-bold bg-[#7B6224] hover:bg-[#A8956F] transition"
          >
            リンクをコピー
          </button>
          <p className="text-center text-gray-700">またはSNSで招待リンクを送る</p>
          <div className="flex justify-center">
            <button
              onClick={() => {
                const message = `このリンクから参加してね: ${inviteLink}`
                const ua = navigator.userAgent.toLowerCase()
                const isMobile = /iphone|android/.test(ua)
                if (isMobile) {
                  window.location.href = `line://msg/text/${encodeURIComponent(message)}`
                } else {
                  window.open(
                    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(inviteLink)}`, 
                    '_blank'
                  )
                }
              }}
              className="mt-2"
            >
              <img
                src="/line-icon.png"
                alt="LINE"
                className="w-16 h-16 transition duration-150 ease-in-out hover:opacity-80 active:scale-105"
              />
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 w-full flex justify-center">
        <Button title="ホームへ戻る" href="/" variant="sub" />
      </div>
    </div>
  )
}
