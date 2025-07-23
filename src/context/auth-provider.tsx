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
      // Keep loading until we have user details and have performed the redirect check
      setIsLoading(true);
      if (firebaseUser) {
        const userDetails = await getCurrentUserDetails(firebaseUser.uid);
        setUser(userDetails);
        
        if (pathname === '/' && userDetails) {
            const targetRoute = getDefaultRouteForUser(userDetails);
            router.replace(targetRoute);
        }
      } else {
        setUser(null);
        if (pathname !== '/') {
            router.replace('/');
        }
      }
      // Only stop loading after all checks and potential redirects are done
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
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

  // If loading is done, and we're not on the login page, but have no user, don't render children.
  // This prevents children from rendering prematurely and accessing protected resources.
  if (!user && pathname !== '/') {
    return null; 
  }
  
  // If loading is done, and we are on the login page but have a user, don't render children.
  // The redirect in useEffect will handle navigation.
  if (user && pathname === '/') {
    return null;
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
