

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { type User } from '@/lib/types';
import { getDefaultRouteForUser } from '@/lib/auth-guard-helper';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get details from Firestore
        const userDetails = await getCurrentUserDetails(firebaseUser.uid);
        if (userDetails) {
          setUser(userDetails);
        } else {
          // User exists in Auth but not in Firestore, something is wrong. Log them out.
          await firebaseLogout();
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (isLoading) {
      return; // Don't do anything until the auth state is resolved
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

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
    // Use window.location to force a reload and clear all state
    window.location.href = '/';
  };

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
