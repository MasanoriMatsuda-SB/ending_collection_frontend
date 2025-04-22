// src/app/_common/layout.tsx
'use client'

import { ReactNode } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useCamera } from '../context/CameraContext'

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isCameraOpen } = useCamera()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('selectedGroupId')
    router.push('/')
  }

  const tabs = [
    { key: 'home',     label: 'ホーム',    on: '/status=on_home.svg',      off: '/status=off_home.svg',      path: '/'       },
    { key: 'oshirase', label: 'お知らせ',  on: '/status=on_oshirase.svg', off: '/status=off_oshirase.svg', path: '/notice' },
    { key: 'add',      label: '追加',      on: '/status=on_add.svg',       off: '/status=off_add.svg',       path: '/post'   },
    { key: 'setting',  label: '設定',      on: '/status=on_setting.svg',   off: '/status=off_setting.svg',   path: '/setting'},
  ] as const

  const activeTab = tabs.find(tab => tab.path === pathname)?.key

  return (
    <div className="min-h-screen max-w-[744px] flex justify-center">
      <div className="w-full flex flex-col relative z-10">

        {/* ヘッダー */}
        <header className="sticky top-0 w-full h-16 bg-white border-b-[4px] border-[#F5F5F5] z-50">
          <button
            onClick={() => router.push('/')}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <Image src="/header.svg" alt="header" width={180} height={60} />
          </button>
          <button
            onClick={handleLogout}
            className="absolute right-4 top-1/2 transform -translate-y-1/2"
          >
            <Image src="/logout.svg" alt="logout" width={22} height={22} />
          </button>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 bg-white">
          {children}
        </main>

        {/* カメラ起動中はフッター非表示 */}
        {!isCameraOpen && (
          <footer className="sticky bottom-0 w-full h-[106px] bg-white border-t border-[#F2F2F2] z-50">
            <div className="absolute top-1.5 left-0 w-full flex justify-around px-0">
              {tabs.map(({ key, label, on, off, path }) => (
                <div
                  key={key}
                  className="flex flex-col items-center w-[72px] h-[72px] justify-center cursor-pointer"
                  onClick={() => router.push(path)}
                >
                  <Image
                    src={ activeTab === key ? on : off }
                    alt={label}
                    width={60}
                    height={60}
                    className="w-[48px] h-[48px] sm:w-[60px] sm:h-[60px]"
                  />
                </div>
              ))}
            </div>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[134px] h-[5px] bg-black rounded-full" />
          </footer>
        )}
      </div>
    </div>
  )
}
