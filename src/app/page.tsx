
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
import Image from 'next/image';
import type { User } from '@/lib/types';

const dummyUsers: Omit<User, 'password'>[] = [
    { id: '1', username: 'SUPERADMIN', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'SA001' },
    { id: '2', username: 'ADMINBP', jabatan: 'ADMIN BP', location: 'BP PEKANBARU', nik: 'ADMINBP-001' },
    { id: '3', username: 'OWNER', jabatan: 'OWNER', location: 'BP PEKANBARU', nik: 'OWN001' },
    { id: '4', username: 'MIRUL', jabatan: 'OPRATOR BP', location: 'BP PEKANBARU', nik: 'OP-001' },
    { id: '5', username: 'KARYAWAN_TM', jabatan: 'SOPIR TM', location: 'BP PEKANBARU', nik: 'TM001' },
    { id: '6', username: 'KEPALA_MEKANIK', jabatan: 'KEPALA MEKANIK', location: 'BP PEKANBARU', nik: 'MEK001' },
];

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
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const userToLogin = dummyUsers.find(
        u => (u.nik?.toUpperCase() === nikOrUsername.toUpperCase() || u.username.toUpperCase() === nikOrUsername.toUpperCase())
    );

    // For this disconnected version, any password is valid for a found user.
    if (userToLogin) {
        toast({
            title: 'Login Berhasil',
            description: `Selamat datang, ${userToLogin.username}!`,
        });
        login(userToLogin);
    } else {
        toast({
            variant: 'destructive',
            title: 'Login Gagal',
            description: 'Pengguna tidak ditemukan. Silakan gunakan salah satu data dummy yang ada.',
        });
    }

    setIsLoggingIn(false);
  };
  
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
          <CardDescription>Silakan login untuk melanjutkan (Firebase terputus)</CardDescription>
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
            <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <LogIn className="mr-2 h-4 w-4" />
                )}
                Login
            </Button>
             <p className="text-xs text-muted-foreground text-center pt-2">Gunakan NIK: SA001, ADMINBP-001, OP-001, dll.</p>
            </CardFooter>
        </form>
      </Card>
    </main>
  );
}
