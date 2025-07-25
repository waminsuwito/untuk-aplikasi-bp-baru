'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-provider';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function LoginPage() {
  const { user, login, isLoading: isAuthLoading } = useAuth();
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
    
    try {
      await login(nikOrUsername, password);
      // The redirect is handled by the AuthProvider, no need for success toast here.
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: error.message || 'Kombinasi NIK/Username dan Password salah.',
      });
    } finally {
      setIsLoggingIn(false);
    }
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
              {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isLoggingIn && <LogIn className="mr-2 h-4 w-4" />}
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
