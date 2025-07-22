
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-provider';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { verifyLogin } from '@/lib/auth';
import { getDefaultRouteForUser } from '@/lib/auth-guard-helper';
import Image from 'next/image';

export default function LoginPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace(getDefaultRouteForUser(user));
    }
  }, [user, isAuthLoading, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    setTimeout(() => {
        const loggedInUser = verifyLogin(nik, password);
        
        if (loggedInUser) {
            localStorage.setItem('app-user', JSON.stringify(loggedInUser));
            toast({
                title: 'Login Berhasil',
                description: `Selamat datang, ${loggedInUser.username}!`,
            });
            window.location.href = getDefaultRouteForUser(loggedInUser);
        } else {
            toast({
                variant: 'destructive',
                title: 'Login Gagal',
                description: 'NIK atau password yang Anda masukkan salah.',
            });
            setIsLoggingIn(false);
        }
    }, 500); // Simulate network delay
  };
  
  // If auth is still loading or user is found, show a spinner to avoid content flash
  if (isAuthLoading || user) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <Image src="/logo.png" alt="Logo Perusahaan" width={80} height={80} className="mx-auto mb-4 rounded-full" />
          <CardTitle className="text-2xl">PT. FARIKA RIAU PERKASA</CardTitle>
          <CardDescription>Silakan login untuk melanjutkan</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="nik">NIK / Username</Label>
                <Input
                id="nik"
                type="text"
                placeholder="Masukkan NIK atau username Anda"
                required
                value={nik}
                onChange={(e) => setNik(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
                disabled={isLoggingIn}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                id="password"
                type="password"
                placeholder="Masukkan password Anda"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
                />
            </div>
            </CardContent>
            <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <LogIn className="mr-2 h-4 w-4" />
                )}
                Login
            </Button>
            </CardFooter>
        </form>
      </Card>
    </main>
  );
}
