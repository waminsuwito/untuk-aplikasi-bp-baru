
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CalendarCheck,
  Database,
  GitCompareArrows,
  ClipboardList,
  Boxes,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const navItems = [
  { href: '/admin-bp/schedule-cor-hari-ini', label: 'Schedule Cor Hari Ini', icon: CalendarCheck },
  { href: '/admin-bp/database-produksi', label: 'Database Produksi', icon: Database },
  { href: '/admin-bp/pemakaian-material', label: 'Pemakaian Material', icon: ClipboardList },
  { href: '/admin-bp/stok-material', label: 'Stok Material', icon: Boxes },
  { href: '/admin-bp/laporan-sinkronisasi', label: 'Laporan Sinkronisasi', icon: GitCompareArrows },
];

export function AdminBpSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex no-print">
      <nav className="flex flex-col gap-2">
        <h2 className="mb-2 text-lg font-semibold tracking-tight">Menu Admin BP</h2>
        {navItems.map((item) => (
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
          )
        )}
      </nav>
    </aside>
  );
}
