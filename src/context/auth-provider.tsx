'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { type User } from '@/lib/types';
import { getUsers } from '@/lib/auth';
import { getDefaultRouteForUser } from '@/lib/auth-guard-helper';

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
    try {
        const storedUser = localStorage.getItem('active-user');
        if (storedUser) {
            const activeUser: User = JSON.parse(storedUser);
            // Omit password before setting to state
            const { password, ...userToSet } = activeUser;
            setUser(userToSet);

            const defaultRoute = getDefaultRouteForUser(activeUser);
            if (pathname === '/' || pathname !== defaultRoute) {
                // Redirect if they are on the login page or not on their default page
                // This can be adjusted based on desired behavior
            }
        } else if (pathname !== '/') {
            router.replace('/');
        }
    } catch (error) {
        console.error("Failed to load user from localStorage", error);
        if (pathname !== '/') {
          router.replace('/');
        }
    }
    setIsLoading(false);
  }, [pathname, router]);

  const login = useCallback(async (identifier: string, passwordFromInput: string): Promise<void> => {
    const allUsers = getUsers();
    const matchedUser = allUsers.find(
      u => (u.nik?.toUpperCase() === identifier.toUpperCase() || u.username.toUpperCase() === identifier.toUpperCase())
    );

    if (matchedUser && matchedUser.password === passwordFromInput) {
        const { password, ...userToSet } = matchedUser;
        localStorage.setItem('active-user', JSON.stringify(matchedUser));
        setUser(userToSet);
        const defaultRoute = getDefaultRouteForUser(matchedUser);
        router.replace(defaultRoute);
    } else {
        throw new Error('Kombinasi NIK/Username dan Password salah.');
    }
  }, [router]);
  
  const logout = useCallback(() => {
    localStorage.removeItem('active-user');
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
