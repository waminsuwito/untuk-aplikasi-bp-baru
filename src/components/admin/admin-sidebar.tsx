
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users,
  Megaphone,
  MailQuestion,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/context/auth-provider';
import { useState, useEffect } from 'react';
import type { AnonymousReport, AccidentReport, Suggestion, Complaint } from '@/lib/types';

const superAdminNav = [
  { href: '/admin/manajemen-karyawan', label: 'User Management', icon: Users },
  { href: '/admin/pesan-anonim', label: 'Pesan dari Anonim', icon: MailQuestion },
  { href: '/admin/broadcast-karyawan', label: 'Broadcast Karyawan', icon: Megaphone },
];

const ANONYMOUS_REPORTS_KEY = 'app-anonymous-reports';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [hasUnreadAnonymous, setHasUnreadAnonymous] = useState(false);

  useEffect(() => {
    const checkUnread = () => {
      if (!user) return;
      try {
        const anonData = localStorage.getItem(ANONYMOUS_REPORTS_KEY);
        const anonReports: AnonymousReport[] = anonData ? JSON.parse(anonData) : [];
        setHasUnreadAnonymous(anonReports.some(r => r.status === 'new'));

      } catch (e) {
        console.error("Failed to check unread reports", e);
      }
    };

    checkUnread();

    const handleStorageChange = (event: StorageEvent) => {
      if ([ANONYMOUS_REPORTS_KEY].includes(event.key || '')) {
        checkUnread();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('reportsUpdated', checkUnread);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('reportsUpdated', checkUnread);
    };
  }, [user]);

  let navItems = [];
  if (user?.jabatan === 'SUPER ADMIN' || user?.jabatan === 'OWNER') {
    navItems = superAdminNav;
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex no-print">
      <nav className="flex flex-col gap-2">
        <h2 className="mb-2 text-lg font-semibold tracking-tight">Admin Menu</h2>
        {navItems.map((item) => {
          const showAnonymousDot = (item.href === '/admin/pesan-anonim') && hasUnreadAnonymous;
          const showNotification = showAnonymousDot;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({
                  variant: pathname.startsWith(item.href) ? 'default' : 'ghost',
                }),
                'justify-start relative'
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {showNotification && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
