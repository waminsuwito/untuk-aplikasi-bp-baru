

'use client';

import { useAuth } from '@/context/auth-provider';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { UserCircle, LogOut, Fingerprint, Settings, Lock, Droplets, Printer, Database, ChevronDown, Building, Scale, Map, Factory } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChangePasswordDialog } from '@/components/dashboard/change-password-dialog';
import { useState } from 'react';

export function Header() {
  const { user, logout } = useAuth();
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 flex h-20 items-center justify-between gap-4 border-b border-primary/20 bg-background px-6 z-10 no-print">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="PT. FARIKA RIAU PERKASA Logo"
            width={45}
            height={45}
            className="rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-primary">PT. FARIKA RIAU PERKASA</h1>
            <p className="text-sm text-muted-foreground">One Stop Concrete Solution</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-primary" />
                {user.username}
              </p>
              <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
                <span>{user.jabatan}</span>
                {user.location && (
                  <>
                    <span className="h-3 w-px bg-border"></span>
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {user.location}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Menu
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user?.jabatan === 'OPRATOR BP' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/karyawan/absensi-harian">
                        <Fingerprint className="mr-2 h-4 w-4" />
                        Absen & Kegiatan
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <Factory className="mr-2 h-4 w-4" />
                        Produksi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/tombol-manual">Tombol Manual</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/moisture-control">
                        <Droplets className="mr-2 h-4 w-4" />
                        Moisture Control
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/dashboard/berat-jenis-material">
                        <Scale className="mr-2 h-4 w-4" />
                        Berat Jenis Material
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/job-mix-formula">Job Mix Formula</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/mixing-settings">Pengaturan Lanjutan</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/mixer-timer-settings">Timer Pintu Mixer</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/relay-settings">Setting Relay</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/printer-settings">
                        <Printer className="mr-2 h-4 w-4" />
                        Pengaturan Printer
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/database-produksi">
                        <Database className="mr-2 h-4 w-4" />
                        Database Produksi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                 {user?.jabatan === 'TRANSPORTER' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/transporter/peta-kendaraan">
                        <Map className="mr-2 h-4 w-4" />
                        Peta Kendaraan
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onSelect={() => setPasswordDialogOpen(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Ubah Password</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </header>
       {user && (
        <ChangePasswordDialog
          isOpen={isPasswordDialogOpen}
          onOpenChange={setPasswordDialogOpen}
          userId={user.id}
        />
      )}
    </>
  );
}
