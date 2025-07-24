
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { type User } from '@/lib/types';
import { getDefaultRouteForUser } from '@/lib/auth-guard-helper';

const SESSION_STORAGE_KEY = 'app-user-session';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  logout: () => void;
  login: (user: Omit<User, 'password'>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
        console.error("Failed to load user from session storage", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/') {
      router.replace('/');
    }
  }, [user, isLoading, pathname, router]);

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    router.replace('/');
  };
  
  const login = (userData: Omit<User, 'password'>) => {
    setUser(userData);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
    const defaultRoute = getDefaultRouteForUser(userData);
    router.replace(defaultRoute);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout, login, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
