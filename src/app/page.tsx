// src/app/page.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState, useMemo, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import Button from '@/components/Button'

type JwtPayload = { user_id: number }
type Item = {
  item_id: number
  item_name: string
  updated_at: string
  images: { image_url: string }[]
  latest_message_time?: string
  latest_message_text?: string
  status?: string | null
  description?: string
}
type SortKey = 'updated_desc' | 'updated_asc' | 'message_desc'
type FilterKey = 'all' | 'active' | 'archived' | 'none'
type Group = { group_id: number; group_name: string }

export default function HomePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // ── 認証状態取得 ──
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const { user_id } = jwtDecode<JwtPayload>(token)
        setUserId(user_id)
      } catch {
        // invalid
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  if (userId === null) {
    // ゲスト向けUI
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-4xl font-bold text-gray-900">meme mori</h1>
        <p className="text-xl mb-8 text-gray-900">終活アルバムアプリ</p>
        <Image
          src="/cover.png"
          alt="Cover Icon"
          width={300}
          height={300}
          className="mb-6 cursor-pointer"
          onClick={() => router.push('/')}
        />
        <div className="space-y-4">
          <Button title="新規アカウント作成" href="/signup" variant="main" />
          <Button title="ログイン" href="/login" variant="sub" />
        </div>
      </div>
    )
  }

  // ログアウト：token と selectedGroupId を削除し、ゲストUIに戻る
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('selectedGroupId')
    setUserId(null)
  }

  return <AuthenticatedHome userId={userId} onLogout={handleLogout} />
}

function AuthenticatedHome({
  userId,
  onLogout,
}: {
  userId: number
  onLogout: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [items, setItems] = useState<Item[]>([])
  const [isWide, setIsWide] = useState(false)
  const [groupList, setGroupList] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [showSelector, setShowSelector] = useState(false)
  const [showGroupList, setShowGroupList] = useState(false)
  const [filterKey, setFilterKey] = useState<FilterKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updated_desc')

  const tabs = [
    { key: 'home', label: 'ホーム', on: '/status=on_home.svg', off: '/status=off_home.svg', path: '/' },
    { key: 'oshirase', label: 'お知らせ', on: '/status=on_oshirase.svg', off: '/status=off_oshirase.svg', path: '/notice' },
    { key: 'add', label: '追加', on: '/status=on_add.svg', off: '/status=off_add.svg', path: '/post' },
    { key: 'setting', label: '設定', on: '/status=on_setting.svg', off: '/status=off_setting.svg', path: '/setting' },
  ] as const
  const activeTab = tabs.find(tab => tab.path === pathname)?.key

  // ── グループ一覧取得と初期選択 ──
  useEffect(() => {
    const fetchGroups = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/groups`)
      const data: Group[] = await res.json()
      setGroupList(data)

      const stored = localStorage.getItem('selectedGroupId')
      const storedId = stored ? Number(stored) : null
      const minId = data.reduce((m, g) => Math.min(m, g.group_id), data[0]?.group_id ?? 0)
      const initial = data.some(g => g.group_id === storedId) ? storedId : minId
      setSelectedGroupId(initial)
      localStorage.setItem('selectedGroupId', String(initial))
    }
    fetchGroups()
  }, [userId])

  // ── 幅検知 ──
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth > 744)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // isWideが変わったときにもログ
  useEffect(() => {
    console.log('isWide →', isWide)
  }, [isWide])

  // ── アイテム取得 ──
  useEffect(() => {
    if (!selectedGroupId) return
    const fetchItems = async () => {
      const url =
        sortKey === 'message_desc'
          ? `${process.env.NEXT_PUBLIC_API_URL}/items/group/${selectedGroupId}/with-latest-message`
          : `${process.env.NEXT_PUBLIC_API_URL}/items/group/${selectedGroupId}`
      const res = await fetch(url)
      const data: Item[] = await res.json()
      setItems(data)
    }
    fetchItems()
  }, [selectedGroupId, sortKey])

  const formatElapsedTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(months / 12)
    if (years) return `${years}年前`
    if (months) return `${months}ヶ月前`
    if (days) return `${days}日前`
    if (hours) return `${hours}時間前`
    if (mins) return `${mins}分前`
    return 'たった今'
  }

  const sortedItems = useMemo(() => {
    const filtered = items.filter(item => {
      if (filterKey === 'active') return item.status === 'active'
      if (filterKey === 'archived') return item.status === 'archived'
      if (filterKey === 'none') return item.status == null
      return true
    })
    const norm = (s: string) => s.normalize('NFKC').toLowerCase()
    const searched = filtered.filter(item =>
      [item.item_name, item.description ?? '', item.latest_message_text ?? '']
        .map(norm)
        .some(val => val.includes(norm(searchQuery)))
    )
    return [...searched].sort((a, b) => {
      if (sortKey === 'updated_desc')
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      if (sortKey === 'updated_asc')
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      if (sortKey === 'message_desc')
        return (
          new Date(b.latest_message_time ?? '').getTime() -
          new Date(a.latest_message_time ?? '').getTime()
        )
      return 0
    })
  }, [items, filterKey, searchQuery, sortKey])

  const MenuComponent = () => {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
      const outside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setShowSelector(false)
          setShowGroupList(false)
        }
      }
      document.addEventListener('mousedown', outside)
      return () => document.removeEventListener('mousedown', outside)
    }, [])
    return (
      <div className="relative flex justify-end" ref={ref}>
        <button onClick={() => setShowSelector(v => !v)} className="text-2xl font-bold px-2">
          ⋮
        </button>
        {showSelector && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow z-50">
            <div
              onClick={() => {
                setShowSelector(false)
                router.push('/invite')
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              メンバーを招待する
            </div>
            {groupList.length > 1 && (
              <div
                onClick={() => setShowGroupList(v => !v)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-t"
              >
                グループを変更する
              </div>
            )}
            {showGroupList &&
              groupList.map(g => (
                <div
                  key={g.group_id}
                  onClick={() => {
                    setSelectedGroupId(g.group_id)
                    localStorage.setItem('selectedGroupId', String(g.group_id))
                    setShowSelector(false)
                    setShowGroupList(false)
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-t"
                >
                  {g.group_name}
                </div>
              ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ヘッダー */}
      <header className="sticky top-0 w-full h-16 bg-white border-b-[4px] border-[#F5F5F5] z-50">
        {/* ロゴを押すとホームへ */}
        <button
          onClick={() => router.push('/')}
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <Image src="/header.svg" alt="header" width={180} height={60} />
        </button>
        {/* ログアウトボタン */}
        <button
          onClick={onLogout}
          className="absolute right-4 top-1/2 transform -translate-y-1/2"
        >
          <Image src="/logout.svg" alt="logout" width={22} height={22} />
        </button>
      </header>

      {/* サブヘッダー */}
      <div className="sticky top-16 z-40 bg-white border-b border-[#F2F2F2] px-4 py-2">
        <div className="flex justify-between items-center">
          <p className="text-[22px] text-black">
            {groupList.find(g => g.group_id === selectedGroupId)?.group_name || '未選択'}のリスト
          </p>
          <MenuComponent />
        </div>
        <div className="flex gap-2 items-center flex-wrap text-[16px] mt-6">
          <select
            value={filterKey}
            onChange={e => setFilterKey(e.target.value as FilterKey)}
            className="border rounded-[6px] w-[70px] h-[38px] px-2"
          >
            <option value="all">全て</option>
            <option value="active">売却前</option>
            <option value="archived">売却済</option>
            <option value="none">ステータスなし</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍検索"
            className="border rounded-[6px] w-[175px] h-[38px] px-2"
          />
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            className="border rounded-[6px] px-2 w-[100px] h-[38px]"
          >
            <option value="updated_desc">新しい順</option>
            <option value="updated_asc">古い順</option>
          </select>
        </div>
      </div>

      {/* メイン */}
      <main
        className={`flex-1 overflow-y-auto bg-white py-4 space-y-4 ${
          isWide ? 'px-4' : 'px-2'
        }`}
      >
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            justifyItems: 'start',
          }}
        >
          {sortedItems.map(item => (
            <div
              key={item.item_id}
              className="w-[120px] h-[160px] flex flex-col items-start cursor-pointer"
              onClick={() =>
                router.push(
                  `/item/${item.item_id}?user_id=${userId}&group_id=${selectedGroupId}`
                )
              }
            >
              <img
                src={item.images?.[0]?.image_url || '/no-image.svg'}
                alt="item image"
                className="w-[120px] h-[120px] object-cover rounded-[16px]"
              />
              <p className="text-[14px] text-black w-[120px] truncate">
                {item.item_name}
              </p>
              <p className="text-[12px] text-black w-[120px] truncate">
                {formatElapsedTime(item.updated_at)}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* フッター */}
      <footer className="sticky bottom-0 w-full h-[106px] bg-white border-t border-[#F2F2F2] z-50">
        <div className="absolute top-1.5 left-0 w-full flex justify-around">
          {tabs.map(({ key, label, on, off, path }) => (
            <div
              key={key}
              className="flex flex-col items-center w-[72px] h-[72px] justify-center cursor-pointer"
              onClick={() => router.push(path)}
            >
              <Image src={activeTab === key ? on : off} alt={label} width={60} height={60} />
            </div>
          ))}
        </div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[134px] h-[5px] bg-black rounded-full" />
      </footer>
    </div>
  )
}
