
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, 
  FileText, 
  CalendarCheck, 
  PackagePlus, 
  Truck, 
  Anchor, 
  ClipboardCheck,
  ClipboardList,
  BarChart3,
  AreaChart,
  AlertTriangle,
  Megaphone,
  MapPin,
  MailQuestion,
  Lightbulb,
  MessageSquareWarning,
  Users,
  Wrench,
  Construction
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

const adminLogistikNav = [
  { href: '/admin/pemakaian-spare-part', label: 'Pemakaian Spare Part', icon: Wrench },
  { href: '/admin/list-kerusakan-alat', label: 'List Kerusakan Alat', icon: Construction },
];

const logistikMaterialNav = [
  { href: '/admin/pemasukan-material', label: 'Pemasukan Material', icon: PackagePlus },
  { href: '/admin/pengiriman-material', label: 'Pengiriman Material', icon: Truck },
  { href: '/admin/bongkar-material', label: 'Bongkar Material', icon: Anchor },
];

const hseHrdNav = [
  { href: '/admin/absensi-karyawan-hari-ini', label: 'Absensi Hari Ini', icon: ClipboardCheck },
  { href: '/admin/kegiatan-karyawan-hari-ini', label: 'Kegiatan Hari Ini', icon: ClipboardList },
  { href: '/admin/rangkuman-absensi-karyawan', label: 'Rangkuman Absensi', icon: BarChart3 },
  { href: '/admin/rangkuman-kegiatan-karyawan', label: 'Rangkuman Kegiatan', icon: AreaChart },
  { href: '/admin/insiden-kerja', label: 'Insiden Kerja', icon: AlertTriangle },
  { href: '/admin/set-lokasi-absensi', label: 'Set Lokasi Absensi', icon: MapPin },
];

const ANONYMOUS_REPORTS_KEY = 'app-anonymous-reports';
const ACCIDENT_REPORTS_KEY = 'app-accident-reports';
const SUGGESTIONS_KEY = 'app-suggestions';
const COMPLAINTS_KEY = 'app-complaints';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [hasUnreadAnonymous, setHasUnreadAnonymous] = useState(false);
  const [hasUnreadAccidents, setHasUnreadAccidents] = useState(false);
  const [hasUnreadSuggestions, setHasUnreadSuggestions] = useState(false);
  const [hasUnreadComplaints, setHasUnreadComplaints] = useState(false);

  useEffect(() => {
    const checkUnread = () => {
      if (!user) return;
      try {
        const isSuperAdmin = user.jabatan === 'SUPER ADMIN' || user.jabatan === 'OWNER';

        const anonData = localStorage.getItem(ANONYMOUS_REPORTS_KEY);
        const anonReports: AnonymousReport[] = anonData ? JSON.parse(anonData) : [];
        setHasUnreadAnonymous(anonReports.some(r => r.status === 'new'));

        const suggestionData = localStorage.getItem(SUGGESTIONS_KEY);
        const suggestions: Suggestion[] = suggestionData ? JSON.parse(suggestionData) : [];
        setHasUnreadSuggestions(suggestions.some(r => r.status === 'new' && (isSuperAdmin || r.location === user.location)));

        const complaintData = localStorage.getItem(COMPLAINTS_KEY);
        const complaints: Complaint[] = complaintData ? JSON.parse(complaintData) : [];
        setHasUnreadComplaints(complaints.some(r => r.status === 'new' && (isSuperAdmin || r.location === user.location)));
        
        const accidentData = localStorage.getItem(ACCIDENT_REPORTS_KEY);
        const accidentReports: AccidentReport[] = accidentData ? JSON.parse(accidentData) : [];
        setHasUnreadAccidents(accidentReports.some(r => r.status === 'new' && (isSuperAdmin || r.location === user.location)));

      } catch (e) {
        console.error("Failed to check unread reports", e);
      }
    };

    checkUnread();

    const handleStorageChange = (event: StorageEvent) => {
      if ([ANONYMOUS_REPORTS_KEY, ACCIDENT_REPORTS_KEY, SUGGESTIONS_KEY, COMPLAINTS_KEY].includes(event.key || '')) {
        checkUnread();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('reportsUpdated', checkUnread);
    window.addEventListener('accidentReportsUpdated', checkUnread);
    window.addEventListener('suggestionsUpdated', checkUnread);
    window.addEventListener('complaintsUpdated', checkUnread);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('reportsUpdated', checkUnread);
      window.removeEventListener('accidentReportsUpdated', checkUnread);
      window.removeEventListener('suggestionsUpdated', checkUnread);
      window.removeEventListener('complaintsUpdated', checkUnread);
    };
  }, [user]);

  let navItems = [];
  if (user?.jabatan === 'SUPER ADMIN' || user?.jabatan === 'OWNER') {
    navItems = superAdminNav;
  } else if (user?.jabatan === 'ADMIN LOGISTIK') {
    navItems = adminLogistikNav;
  } else if (user?.jabatan === 'LOGISTIK MATERIAL') {
    navItems = logistikMaterialNav;
  } else if (user?.jabatan === 'HSE/K3') {
    navItems = hseHrdNav;
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex no-print">
      <nav className="flex flex-col gap-2">
        <h2 className="mb-2 text-lg font-semibold tracking-tight">Admin Menu</h2>
        {navItems.map((item) => {
          const showAnonymousDot = (item.href === '/admin/pesan-anonim') && hasUnreadAnonymous;
          const showAccidentDot = item.href === '/admin/insiden-kerja' && hasUnreadAccidents;
          const showSuggestionDot = item.href === '/admin/usulan-karyawan' && hasUnreadSuggestions;
          const showComplaintDot = item.href === '/admin/komplain-karyawan' && hasUnreadComplaints;
          const showNotification = showAnonymousDot || showAccidentDot || showSuggestionDot || showComplaintDot;

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
