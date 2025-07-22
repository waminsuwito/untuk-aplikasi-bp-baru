
'use client';

import { Header } from '@/components/dashboard/header';
import { AdminBpSidebar } from '@/components/admin-bp/admin-bp-sidebar';
import { useAuth } from '@/context/auth-provider';
import { PrintJobListener } from '@/components/admin-bp/print-job-listener';

export default function AdminBpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }

  return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <div className="flex flex-1">
          <AdminBpSidebar />
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
        {user.jabatan === 'ADMIN BP' && <PrintJobListener />}
      </div>
  );
}
