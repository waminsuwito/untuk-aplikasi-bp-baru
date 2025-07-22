

'use client';

import { Header } from '@/components/dashboard/header';
import { useAuth } from '@/context/auth-provider';

export default function TransporterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  
  // AuthProvider handles redirection, we just need to render the layout
  if (!user) {
    return null;
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
