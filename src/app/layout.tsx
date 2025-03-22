// src/app/layout.tsx
import Link from 'next/link';
import '../app/globals.css';

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
        <nav className="p-4 bg-gray-200 text-black">
          <Link href="/">Home</Link> |{' '}
          <Link href="/login">Login</Link> |{' '}
          <Link href="/signup">Signup</Link> |{' '}
          <Link href="/signup/finish">SignupFinish</Link> |{' '}
          <Link href="/grouping">Grouping</Link> |{' '}
          <Link href="/grouping/finish">GroupingFinish</Link> |{' '}
          <Link href="/invite">Invite</Link> |{' '}
          <Link href="/invitation">Invitation</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
