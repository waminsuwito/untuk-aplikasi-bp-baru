
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
        // User is logged in according to Firebase Auth.
        // Fetch details from Firestore.
        const userDetails = await getCurrentUserDetails(firebaseUser.uid);
        setUser(userDetails);
        
        // If user is on login page, redirect them to their default page.
        if (pathname === '/' && userDetails) {
            const targetRoute = getDefaultRouteForUser(userDetails);
            router.replace(targetRoute);
        }
      } else {
        // User is not logged in.
        setUser(null);
        // If user is not on login page, redirect them to login.
        if (pathname !== '/') {
            router.replace('/');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
    router.replace('/');
  };

  // If still loading, show a global spinner.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading and there's no user, and we are not on the login page,
  // this prevents rendering children that might depend on the user object.
  if (!user && pathname !== '/') {
    return null; // or return the loader again
  }
  
  // If we are on the login page, but the user object is now available,
  // this prevents a flash of the login page before redirection.
  if (user && pathname === '/') {
    return null; // or return the loader again
  }

  return (
    <AuthContext.Provider value={{ user, logout, isLoading: false }}>
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
