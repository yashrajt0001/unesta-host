'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  setAuthToken,
  setRefreshToken,
  clearTokens,
  getAuthToken,
  getRefreshToken,
} from '@/lib/api-client';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, otp: string) => Promise<{ isNewUser: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      auth
        .getCurrentUser()
        .then((data) => setUser(data.data))
        .catch(() => {
          clearTokens();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (phone: string, otp: string) => {
    const data = await auth.verifyOtp(phone, otp);
    setAuthToken(data.data.accessToken);
    setRefreshToken(data.data.refreshToken);
    setUser(data.data.user);
    return { isNewUser: data.data.isNewUser };
  };

  const logout = () => {
    const rt = getRefreshToken();
    if (rt) {
      auth.logout(rt).catch(() => {});
    }
    clearTokens();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
