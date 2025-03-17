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
        <title>Ending Collection Frontend</title>
      </head>
      <body>
        <nav>
          <Link href="/">Home</Link> |{' '}
          <Link href="/register">Register</Link> |{' '}
          <Link href="/login">Login</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
