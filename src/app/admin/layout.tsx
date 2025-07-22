

'use client';

import { useAuth } from '@/context/auth-provider';
import { Header } from '@/components/dashboard/header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

const ALLOWED_ROLES = ['SUPER ADMIN', 'ADMIN LOGISTIK', 'LOGISTIK MATERIAL', 'HSE/K3', 'OWNER'];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // The AuthProvider now handles redirection for unauthenticated users.
  // We just need to make sure the role is correct. 
  // If an unauthorized role gets here, they will see a blank page.
  const isAuthorized = user && user.jabatan && ALLOWED_ROLES.includes(user.jabatan);

  if (!isAuthorized) {
    // This can be a simple null or a more descriptive "Access Denied" component.
    // AuthProvider will redirect if user is null, so this mainly catches wrong roles.
    return null;
  }
  
  const isOwner = user.jabatan === 'OWNER';

  // If authorized, render the admin layout
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        {!isOwner && <AdminSidebar />}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
