

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { auth, firestore } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const { password, ...userToSet } = userData;
            setUser(userToSet);
          } else {
            // This case might happen if Firestore doc is deleted but Auth user is not
            await signOut(auth);
            setUser(null);
          }
        } catch(e) {
            console.error("Error fetching user document", e);
            await signOut(auth);
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname === '/';
    
    // If there is a user, they should NOT be on the login page.
    // Redirect them to their default route.
    if (user && isAuthPage) {
      const defaultRoute = getDefaultRouteForUser(user);
      router.replace(defaultRoute);
      return;
    }
    
    // If there is no user, they should ONLY be on the login page.
    // If they are on any other page, redirect them.
    if (!user && !isAuthPage) {
      router.replace('/');
      return;
    }
  }, [user, pathname, isLoading, router]);
  

  const login = useCallback(async (identifier: string, passwordFromInput: string): Promise<void> => {
    await loginWithIdentifier(identifier, passwordFromInput);
  }, []);
  
  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);


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
