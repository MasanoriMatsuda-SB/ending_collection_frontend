// src/app/layout.tsx
import '../app/globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import { CameraProvider } from './context/CameraContext'  // ← 追加

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <title>meme mori</title>
      </head>
      <body>
        {/* カメラコンテキストを全体に提供 */}
        <CameraProvider>
          {/* 認証コンテキスト */}
          <AuthProvider>
            <div className="bg-white lg:bg-yellow-50 text-[#212121]">
              <div className="max-w-[744px] mx-auto px-4">
                <main>{children}</main>
              </div>
            </div>
          </AuthProvider>
        </CameraProvider>
      </body>
    </html>
  )
}
