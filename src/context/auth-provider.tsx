
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { type User } from '@/lib/types';
import { getDefaultRouteForUser } from '@/lib/auth-guard-helper';
import { loginWithIdentifier, logout as logoutUser, getLoggedInUser } from '@/lib/auth';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  logout: () => void;
  login: (identifier: string, password: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check for logged-in user in localStorage on initial load
    const loggedInUser = getLoggedInUser();
    setUser(loggedInUser);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname === '/';
    
    if (user && isAuthPage) {
      const defaultRoute = getDefaultRouteForUser(user);
      router.replace(defaultRoute);
      return;
    }
    
    if (!user && !isAuthPage) {
      router.replace('/');
      return;
    }
  }, [user, pathname, isLoading, router]);
  

  const login = useCallback(async (identifier: string, passwordFromInput: string): Promise<void> => {
    const loggedInUser = await loginWithIdentifier(identifier, passwordFromInput);
    setUser(loggedInUser);
  }, []);
  
  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    router.replace('/');
  }, [router]);


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
