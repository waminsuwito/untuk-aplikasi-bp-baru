
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { auth, firestore } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { type User } from '@/lib/types';
import { getDefaultRouteForUser } from '@/lib/auth-guard-helper';
import { loginWithIdentifier } from '@/lib/auth';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          const { password, ...userToSet } = userData;
          setUser(userToSet);

          const defaultRoute = getDefaultRouteForUser(userData);
          // Redirect if on login page, otherwise let them stay.
          if (pathname === '/') {
              router.replace(defaultRoute);
          }
          
        } else {
          // User exists in Auth but not in Firestore, log them out
          await signOut(auth);
          setUser(null);
           // Only redirect if not already on the login page
           if (pathname !== '/') {
             router.replace('/');
           }
        }
      } else {
        setUser(null);
        // If logged out, redirect to login page, unless they are already there.
        if (pathname !== '/') {
          router.replace('/');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const login = useCallback(async (identifier: string, passwordFromInput: string): Promise<void> => {
    try {
        await loginWithIdentifier(identifier, passwordFromInput);
        // The onAuthStateChanged listener will handle the rest (setting user and redirecting)
    } catch (error: any) {
        console.error("Login error in provider:", error);
        throw error; // Re-throw the error to be caught by the login page
    }
  }, []);
  
  const logout = useCallback(async () => {
    await signOut(auth);
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
