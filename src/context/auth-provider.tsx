
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { type User } from '@/lib/types';
import { getDefaultRouteForUser } from '@/lib/auth-guard-helper';


interface AuthContextType {
  user: Omit<User, 'password'> | null;
  logout: () => void;
  login: (user: Omit<User, 'password'>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    setUser(null);
    router.replace('/');
  };
  
  const login = (userData: Omit<User, 'password'>) => {
    setUser(userData);
    const defaultRoute = getDefaultRouteForUser(userData);
    router.replace(defaultRoute);
  };

  // If we were using a real auth system with tokens, we'd check validity here.
  // For now, we just show the login page if no user is set.
  useEffect(() => {
    if (!user && pathname !== '/') {
      router.replace('/');
    }
  }, [user, pathname, router]);

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
