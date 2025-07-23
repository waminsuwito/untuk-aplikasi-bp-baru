
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
        
        // Redirect logic for logged-in users
        if (userDetails) {
          const defaultRoute = getDefaultRouteForUser(userDetails);
          // If user is on the login page, redirect them to their dashboard
          if (pathname === '/') {
            router.replace(defaultRoute);
          }
          // Optional: Add logic here to redirect if they are on a wrong path for their role
        }
      } else {
        setUser(null);
        // If user is not logged in and not on the login page, redirect to login
        if (pathname !== '/') {
          router.replace('/');
        }
      }
      // Finished checking, stop loading
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    setIsLoading(true);
    await firebaseLogout();
    setUser(null);
    router.replace('/');
    // No need to set isLoading to false, as the onAuthStateChanged will handle it
  };

  if (isLoading) {
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
