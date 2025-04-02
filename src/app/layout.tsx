import Link from 'next/link';
import '../app/globals.css';
import { AuthProvider } from '@/lib/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <title>meme mori</title>
      </head>
      <body>
        <AuthProvider>
          <nav className="p-4 bg-gray-100 text-black">
            <Link href="/">Home</Link> |{' '}
            <Link href="/login">Login</Link> |{' '}
            <Link href="/signup">Signup</Link> |{' '}
            <Link href="/signup/finish">SignupFinish</Link> |{' '}
            <Link href="/grouping">Grouping</Link> |{' '}
            <Link href="/grouping/finish">GroupingFinish</Link> |{' '}
            <Link href="/invite">Invite</Link> |{' '}
            <Link href="/invitation">Invitation</Link>
          </nav>
          <div className="bg-white lg:bg-yellow-50 text-[#212121]">
            <div className="max-w-[744px] mx-auto px-4">
              <main>{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
