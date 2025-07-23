'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { type User } from '@/lib/types';
import { getDefaultRouteForUser } from '@/lib/auth-guard-helper';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getCurrentUserDetails, firebaseLogout } from '@/lib/auth';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDetails = await getCurrentUserDetails(firebaseUser.uid);
        setUser(userDetails);
        
        // Logic to redirect if on the login page or to the default route
        const targetRoute = getDefaultRouteForUser(userDetails!);
        if (pathname === '/') {
          router.replace(targetRoute);
        }
      } else {
        setUser(null);
        // Logic to redirect to login if not already there
        if (pathname !== '/') {
          router.replace('/');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    setIsLoading(true);
    await firebaseLogout();
    setUser(null);
    router.replace('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading and no user, and not on login page, let useEffect handle redirect
  // This avoids rendering children and then redirecting.
  if (!isLoading && !user && pathname !== '/') {
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
