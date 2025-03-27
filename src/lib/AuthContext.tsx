'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  email?: string;
  photoURL?: string;
  exp: number;
  iat: number;
}

interface AuthContextType {
  user: JwtPayload | null;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  refreshUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<JwtPayload | null>(null);

  const refreshUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUser(decoded);
      } catch (err) {
        console.error('JWT decode failed', err);
        setUser(null);
      }
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);