'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'

type JwtPayload = { user_id: number }

type Item = {
    item_id: number;
    item_name: string;
    updated_at: string;
    images: { image_url: string }[];
    latest_message_time?: string;
    latest_message_text?: string;
    status?: string | null;
    description?: string;
}

type SortKey = 'updated_desc' | 'updated_asc' | 'message_desc'
type FilterKey = 'all' | 'active' | 'archived' | 'none'

type Group = {
    group_id: number;
    group_name: string;
}

export default function HomePage() {
    const handleLogout = () => {
        localStorage.removeItem('token')
        router.push('/login')
    }
    const [items, setItems] = useState<Item[]>([])
    const [, setIsWide] = useState(false)
    const [userId, setUserId] = useState<number | null>(null)
    const [groupList, setGroupList] = useState<{ group_id: number; group_name: string }[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
    const [showSelector, setShowSelector] = useState(false)
    const [showGroupList, setShowGroupList] = useState(false)
    const [filterKey, setFilterKey] = useState<FilterKey>('all')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [sortKey, setSortKey] = useState<SortKey>('updated_desc')
    const router = useRouter()
    const pathname = usePathname()

    const tabs = [
        { key: 'home', label: 'ホーム', on: '/status=on_home.svg', off: '/status=off_home.svg', path: '/' },
        { key: 'oshirase', label: 'お知らせ', on: '/status=on_oshirase.svg', off: '/status=off_oshirase.svg', path: '/notice' },
        { key: 'add', label: '追加', on: '/status=on_add.svg', off: '/status=off_add.svg', path: '/post' },
        { key: 'setting', label: '設定', on: '/status=on_setting.svg', off: '/status=off_setting.svg', path: '/setting' },
    ] as const
    const activeTab = tabs.find(tab => tab.path === pathname)?.key

    useEffect(() => {
        const token = localStorage.getItem('token')
        const decoded = token ? jwtDecode<JwtPayload>(token) : null
        const uid = decoded?.user_id
        if (!uid) return
        setUserId(uid)

        const fetchGroups = async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${uid}/groups`)
            const data: Group[] = await res.json()
            setGroupList(data)
            const maxId = data.reduce((max: number, g: Group) => Math.max(max, g.group_id), 0)
            setSelectedGroupId(maxId)
        }
        fetchGroups()
    }, [])

    useEffect(() => {
        const handleResize = () => setIsWide(window.innerWidth > 744)
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (!selectedGroupId) return
        const fetchItems = async () => {
            const url =
                sortKey === 'message_desc'
                    ? `${process.env.NEXT_PUBLIC_API_URL}/items/group/${selectedGroupId}/with-latest-message`
                    : `${process.env.NEXT_PUBLIC_API_URL}/items/group/${selectedGroupId}`
            const res = await fetch(url)
            const data = await res.json()
            setItems(data)
        }
        fetchItems()
    }, [selectedGroupId, sortKey])

    const formatElapsedTime = (isoTime: string) => {
        const now = new Date()
        const updated = new Date(isoTime)
        const diff = now.getTime() - updated.getTime()
        const mins = Math.floor(diff / (1000 * 60))
        const hours = Math.floor(mins / 60)
        const days = Math.floor(hours / 24)
        const months = Math.floor(days / 30)
        const years = Math.floor(months / 12)
        if (years > 0) return `${years}年前`
        if (months > 0) return `${months}ヶ月前`
        if (days > 0) return `${days}日前`
        if (hours > 0) return `${hours}時間前`
        if (mins > 0) return `${mins}分前`
        return 'たった今'
    }

    const sortedItems = useMemo(() => {
        const statusFiltered = items.filter(item => {
            const status = item.status ?? null
            if (filterKey === 'active') return status === 'active'
            if (filterKey === 'archived') return status === 'archived'
            if (filterKey === 'none') return status === null
            return true
        })
        const normalize = (text: string) => text.normalize('NFKC').toLowerCase()
        const searchFiltered = statusFiltered.filter(item => {
            const q = normalize(searchQuery)
            return [item.item_name, item.description ?? '', item.latest_message_text ?? '']
                .map(normalize)
                .some(val => val.includes(q))
        })
        return [...searchFiltered].sort((a, b) => {
            if (sortKey === 'updated_desc') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            if (sortKey === 'updated_asc') return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
            if (sortKey === 'message_desc') return new Date(b.latest_message_time ?? '').getTime() - new Date(a.latest_message_time ?? '').getTime()
            return 0
        })
    }, [items, sortKey, filterKey, searchQuery])

    const MenuComponent = () => {
        const menuRef = useRef(null)
        useEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
                if (menuRef.current && !(menuRef.current as HTMLElement).contains(e.target as Node)) {
                    setShowSelector(false)
                    setShowGroupList(false)
                }
            }
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }, [])

        return (
            <div className="relative flex justify-end" ref={menuRef}>
                <button onClick={() => setShowSelector(!showSelector)} className="text-2xl font-bold px-2">⋮</button>
                {showSelector && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-[6px] shadow z-50">
                        <div onClick={() => { setShowSelector(false); router.push('/invite') }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            メンバーを招待する
                        </div>
                        {groupList.length > 1 && (
                            <div onClick={() => setShowGroupList(!showGroupList)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-t">
                                グループを変更する
                            </div>
                        )}
                        {showGroupList && groupList.length > 1 && (
                            <div className="border-t">
                                {groupList.map(group => (
                                    <div key={group.group_id} onClick={() => {
                                        setSelectedGroupId(group.group_id)
                                        setShowSelector(false)
                                        setShowGroupList(false)
                                    }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                        {group.group_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )

    }

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* ヘッダー */}
            <header className="sticky top-0 w-full h-16 bg-white border-b-[4px] border-[#F5F5F5] z-50">
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Image src="/header.svg" alt="header" width={180} height={60} />
                </div>
                <button
                    onClick={handleLogout}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                >
                    <Image src="/logout.svg" alt="logout" width={22} height={22} />
                </button>
            </header>

            {/* サブヘッダー（スクロール固定） */}
            <div className="sticky top-16 z-40 bg-white border-b border-[#F2F2F2] px-4 py-2">
                <div className="flex justify-between items-center">
                    <p className="text-[22px] text-black">
                        {groupList.find(g => g.group_id === selectedGroupId)?.group_name || '未選択'}のリスト
                    </p>
                    <MenuComponent />
                </div>

                <div className="flex gap-2 items-center flex-wrap text-[16px] mt-6">
                    <div>
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
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍検索"
                        className="border rounded-[6px] w-[175px] h-[38px] px-2"
                    />
                    <div>
                        <select
                            value={sortKey}
                            onChange={e => setSortKey(e.target.value as SortKey)}
                            className="border rounded-[6px] px-2 w-[100px] h-[38px]"
                        >
                            <option value="updated_desc">新しい順</option>
                            <option value="updated_asc">古い順</option>
                            {/* <option value="message_desc">メッセージが新しい順</option> */}
                        </select>
                    </div>
                </div>
            </div>



            {/* スクロールされるメイン */}
            <main className="flex-1 overflow-y-auto bg-white px-2 py-4 space-y-4">
                {/* メインの内容（アイテム一覧など）をここに配置 */}
                {/* 例: */}
                <div className="grid gap-2"
                    style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        justifyItems: 'start',
                        maxWidth: '100%',
                    }}
                >
                    {sortedItems.map(item => (
                        <div
                            key={item.item_id}
                            className="w-[120px] h-[160px] flex flex-col items-start justify-start cursor-pointer"
                            onClick={() => {
                                if (userId && selectedGroupId) {
                                    router.push(`/item/${item.item_id}?user_id=${userId}&group_id=${selectedGroupId}`)
                                }
                            }}
                        >
                            <img
                                src={item.images?.[0]?.image_url || '/no-image.svg'}
                                alt="item image"
                                className="w-[120px] h-[120px] object-cover rounded-[16px]"
                            />
                            <p className="text-[14px] text-black w-[120px] truncate" style={{ lineHeight: '20px' }}>
                                {item.item_name}
                            </p>
                            <p className="text-[12px] text-black w-[120px] truncate" style={{ lineHeight: '16px' }}>
                                {formatElapsedTime(item.updated_at)}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* フッター */}
            <footer className="sticky bottom-0 w-full h-[106px] bg-white border-t border-[#F2F2F2] z-50">
                <div className="absolute top-1.5 left-0 w-full flex justify-around px-0">
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