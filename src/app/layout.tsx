// src/app/layout.tsx
import '../app/globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import { CameraProvider } from './context/CameraContext'
import Layout from './_common/layout'

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
        <AuthProvider>
          <CameraProvider>
            <Layout>
              {children}
            </Layout>
          </CameraProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
