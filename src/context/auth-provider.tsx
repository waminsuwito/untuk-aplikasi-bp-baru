
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
        // Firebase has confirmed a user is logged in.
        // NOW it's safe to read from Firestore.
        try {
          const userDetails = await getCurrentUserDetails(firebaseUser.uid);
          setUser(userDetails);

          if (userDetails) {
            const defaultRoute = getDefaultRouteForUser(userDetails);
            // If user is on the login page, redirect them to their dashboard
            if (pathname === '/') {
              router.replace(defaultRoute);
            }
          } else {
             // This case is unlikely but handles if user exists in Auth but not Firestore
             await firebaseLogout();
             setUser(null);
             router.replace('/');
          }
        } catch (error) {
           console.error("Failed to fetch user details from Firestore:", error);
           await firebaseLogout();
           setUser(null);
           router.replace('/');
        } finally {
            setIsLoading(false);
        }

      } else {
        // Firebase confirmed no user is logged in.
        setUser(null);
        if (pathname !== '/') {
          router.replace('/');
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    await firebaseLogout();
    setUser(null); // State will be finally set by onAuthStateChanged
    router.replace('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent rendering children on the server or during the initial loading phase if not on the login page
  if (!user && pathname !== '/') {
      return null;
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
