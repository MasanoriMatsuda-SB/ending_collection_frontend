'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  user_id: number;
  email?: string;
  photoURL?: string;
  exp: number;
  iat: number;
}

interface AuthContextType {
  user: JwtPayload | null;
  refreshUser: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  refreshUser: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); 

  const refreshUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          // 期限切れ → 自動ログアウト
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
          router.replace('/login')    // ← ここでログインへ飛ばす。ホームでもいいけどログインのほうが意図が伝わってバグと勘違いされなそう
          return;
        }
        setUser(decoded);
      } catch (err) {
        console.error('JWT decode failed', err);
        setUser(null);
      }
      setLoading(false); // トークンがあるときだけ、読み込み完了
    } else {
      // トークンがない
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);