
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { type User } from '@/lib/types';
import { getDefaultRouteForUser } from '@/lib/auth-guard-helper';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  logout: () => void;
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
      const storedUser = localStorage.getItem('app-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      return; // Don't do anything until the user state is resolved
    }

    const isLoginPage = pathname === '/';

    if (!user && !isLoginPage) {
      // If not logged in and not on the login page, redirect to login
      router.replace('/');
    } else if (user && isLoginPage) {
      // If logged in and on the login page, redirect to the default dashboard
      router.replace(getDefaultRouteForUser(user));
    }
  }, [user, isLoading, pathname, router]);

  const logout = () => {
    localStorage.removeItem('app-user');
    setUser(null);
    window.location.href = '/'; // Force a full reload to the login page
  };

  // Show a loader while the initial auth check and redirection logic is running
  const isAuthCheckRunning = isLoading || (!user && pathname !== '/') || (user && pathname === '/');
  
  if (isAuthCheckRunning) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout, isLoading }}>
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
