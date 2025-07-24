
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/context/auth-provider';

const navItems = [
  { href: '/admin/manajemen-karyawan', label: 'User Management', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  let displayNavItems = [];
  if (user?.jabatan === 'SUPER ADMIN' || user?.jabatan === 'OWNER') {
    displayNavItems = navItems;
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex no-print">
      <nav className="flex flex-col gap-2">
        <h2 className="mb-2 text-lg font-semibold tracking-tight">Admin Menu</h2>
        {displayNavItems.map((item) => {
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
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
