
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-provider';
import { Loader2, LogIn, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import type { User } from '@/lib/types';
import { getUsers, seedUsersToLocalStorage } from '@/lib/auth';

export default function LoginPage() {
  const { user, login, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [nikOrUsername, setNikOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nikOrUsername.trim() || !password.trim()) {
        toast({
            variant: 'destructive',
            title: 'Login Gagal',
            description: 'NIK/Username dan Password harus diisi.',
        });
        return;
    }
    setIsLoggingIn(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    const users = getUsers();
    const userToLogin = users.find(
        u => (u.nik?.toUpperCase() === nikOrUsername.toUpperCase() || u.username.toUpperCase() === nikOrUsername.toUpperCase())
    );

    if (userToLogin && userToLogin.password === password) {
        toast({
            title: 'Login Berhasil',
            description: `Selamat datang, ${userToLogin.username}!`,
        });
        const { password, ...userToLog } = userToLogin;
        login(userToLog);
    } else {
        toast({
            variant: 'destructive',
            title: 'Login Gagal',
            description: 'Kombinasi NIK/Username dan Password salah.',
        });
    }

    setIsLoggingIn(false);
  };
  
  const handleSeed = () => {
    seedUsersToLocalStorage();
    toast({
        title: 'Database Diinisialisasi',
        description: 'Data pengguna awal telah dimuat. Silakan coba login.'
    });
  }

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
          <CardDescription>Silakan login untuk melanjutkan.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="nik">NIK atau Username</Label>
                <Input
                id="nik"
                type="text"
                placeholder="Masukkan NIK atau Username Anda"
                required
                value={nikOrUsername}
                onChange={(e) => setNikOrUsername(e.target.value)}
                disabled={isLoggingIn}
                autoComplete="username"
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
                autoComplete="current-password"
                />
            </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <LogIn className="mr-2 h-4 w-4" />
                )}
                Login
            </Button>
            <Button type="button" variant="link" className="text-xs text-muted-foreground" onClick={handleSeed}>
                <Database className="mr-2 h-3 w-3" />
                (Jika login gagal, klik di sini untuk inisialisasi database)
            </Button>
            </CardFooter>
        </form>
      </Card>
    </main>
  );
}
