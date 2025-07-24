
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
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          const { password, ...userToSet } = userData;
          setUser(userToSet);

          const defaultRoute = getDefaultRouteForUser(userData);
          // Jika pengguna sudah login dan masih di halaman login,
          // arahkan mereka ke halaman default mereka.
          if (pathname === '/') {
            router.replace(defaultRoute);
          }
        } else {
          // Kasus anomali: pengguna ada di Auth tapi tidak di Firestore. Logout paksa.
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  // Efek terpisah untuk menangani pengalihan halaman yang dilindungi
  useEffect(() => {
    // Jangan lakukan apa-apa jika masih loading
    if (isLoading) return;

    const isAuthPage = pathname === '/';
    
    // Jika pengguna tidak ada (null) dan tidak berada di halaman login,
    // paksa mereka ke halaman login.
    if (!user && !isAuthPage) {
      router.replace('/');
    }

    // Jika pengguna sudah ada dan mencoba mengakses halaman login,
    // arahkan mereka ke halaman default mereka.
    if (user && isAuthPage) {
      const defaultRoute = getDefaultRouteForUser(user);
      router.replace(defaultRoute);
    }
  }, [user, pathname, isLoading, router]);
  

  const login = useCallback(async (identifier: string, passwordFromInput: string): Promise<void> => {
    // Fungsi onAuthStateChanged di atas akan menangani redirect setelah login berhasil
    await loginWithIdentifier(identifier, passwordFromInput);
  }, []);
  
  const logout = useCallback(async () => {
    await signOut(auth);
    // onAuthStateChanged akan menangani state user, dan efek kedua akan redirect
  }, []);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Mencegah "flicker" halaman yang dilindungi sebelum redirect
  const isAuthPage = pathname === '/';
  if (!isLoading && !user && !isAuthPage) {
      return null;
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
