
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
import { seedUsersToFirestore, createEmailFromNik } from '@/lib/auth';
import Image from 'next/image';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [nikOrUsername, setNikOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nikOrUsername.trim() || !password.trim()) {
        toast({
            variant: 'destructive',
            title: 'Login Gagal',
            description: 'NIK dan Password harus diisi.',
        });
        return;
    }
    setIsLoggingIn(true);
    
    try {
        // The most direct approach: Assume the input is a NIK and try to log in.
        // This avoids all database lookups and potential data mismatches.
        const email = createEmailFromNik(nikOrUsername);
        
        await signInWithEmailAndPassword(auth, email, password);
        
        // If we reach here, login was successful. The AuthProvider will handle redirection.
        // We can show a generic success message.
        toast({
            title: 'Login Berhasil',
            description: `Selamat datang kembali.`,
        });

    } catch (error: any) {
        console.error("Login process error:", error);
        
        let errorMessage = 'NIK atau password yang Anda masukkan salah.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
             errorMessage = 'Kredensial tidak valid. Pastikan NIK dan password benar.';
        }
        
        toast({
            variant: 'destructive',
            title: 'Login Gagal',
            description: errorMessage,
        });
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    toast({ title: 'Proses Inisialisasi', description: 'Menyiapkan data pengguna awal ke database...' });
    try {
      const result = await seedUsersToFirestore();
      toast({ title: 'Selesai', description: result.message });
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: `Gagal melakukan inisialisasi: ${e.message}` });
    } finally {
      setIsSeeding(false);
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
          <CardDescription>Silakan login untuk melanjutkan</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input
                id="nik"
                type="text"
                placeholder="Masukkan NIK Anda"
                required
                value={nikOrUsername}
                onChange={(e) => setNikOrUsername(e.target.value)}
                disabled={isLoggingIn || isSeeding}
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
                disabled={isLoggingIn || isSeeding}
                />
            </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoggingIn || isSeeding}>
                {isLoggingIn ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <LogIn className="mr-2 h-4 w-4" />
                )}
                Login
            </Button>
            <Button type="button" variant="link" className="text-xs text-muted-foreground" onClick={handleSeed} disabled={isLoggingIn || isSeeding}>
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              (Jika login gagal, klik di sini untuk inisialisasi database)
            </Button>
            </CardFooter>
        </form>
      </Card>
    </main>
  );
}
