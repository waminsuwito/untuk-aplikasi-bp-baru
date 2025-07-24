
import { type User } from '@/lib/types';

export const getDefaultRouteForUser = (user: Omit<User, 'password'>): string => {
    const jabatan = user.jabatan;
    
    switch (jabatan) {
      case 'OWNER': return '/admin/owner-dashboard';
      case 'SUPER ADMIN': return '/admin/manajemen-karyawan';
      case 'ADMIN BP': return '/admin-bp/schedule-cor-hari-ini';
      case 'ADMIN LOGISTIK': return '/admin/absensi-karyawan-hari-ini';
      case 'LOGISTIK MATERIAL': return '/admin/pemasukan-material';
      case 'HSE/K3': return '/admin/absensi-karyawan-hari-ini';
      case 'OPRATOR BP': return '/dashboard';
      case 'SOPIR TM': return '/karyawan/checklist-harian-tm';
      case 'KEPALA MEKANIK': return '/karyawan/work-order';
      case 'KEPALA WORKSHOP': return '/karyawan/work-order';
      case 'TRANSPORTER': return '/transporter/peta-kendaraan';
      default: return '/karyawan/absensi-harian';
    }
};
