
'use client';

import { Header } from '@/components/dashboard/header';
import { useAuth } from '@/context/auth-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // AuthProvider handles the main redirection logic.
  // We just render the content if a user exists.
  if (!user) {
    return null; // Or a loading spinner, but AuthProvider already shows one.
  }

  return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
  );
}
