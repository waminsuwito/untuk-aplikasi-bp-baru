'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { type User } from '@/lib/types';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch their profile from Firestore
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as Omit<User, 'password'>;
          setUser(userData);
          // Redirect if they are on the login page
          if (pathname === '/') {
            const defaultRoute = getDefaultRouteForUser(userData);
            router.replace(defaultRoute);
          }
        } else {
          // Profile doesn't exist, something is wrong, sign them out.
          await signOut(auth);
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
        if (pathname !== '/') {
           router.replace('/');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const login = async (identifier: string, password: string) => {
    let emailToLogin: string | null = null;
    
    // Check if identifier is a NIK
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('nik', '==', identifier.toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Found user by NIK
        emailToLogin = `${identifier.toUpperCase()}@farika.co.id`;
    } else {
        // Assume it's a username, which we'll use for the email domain
        emailToLogin = `${identifier.toLowerCase()}@farika.co.id`;
    }

    try {
        await signInWithEmailAndPassword(auth, emailToLogin, password);
        // onAuthStateChanged will handle setting the user and redirecting
    } catch (error: any) {
        console.error("Firebase login error:", error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            throw new Error('Kombinasi NIK/Username dan Password salah.');
        }
        throw new Error('Terjadi kesalahan saat login.');
    }
  };
  
  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will handle setting user to null and redirecting
  };


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
