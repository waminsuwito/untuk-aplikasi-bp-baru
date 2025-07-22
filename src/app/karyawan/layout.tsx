
'use client';

import { Header } from '@/components/dashboard/header';
import { KaryawanSidebar } from '@/components/karyawan/karyawan-sidebar';
import { useAuth } from '@/context/auth-provider';

export default function KaryawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // AuthProvider handles the main redirection logic.
  // We just render the content if a user exists.
  if (!user) {
    return null;
  }
  
  return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <div className="flex flex-1">
          <KaryawanSidebar />
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
  );
}
