import { redirect } from 'next/navigation';

// This page is no longer needed. The AuthProvider handles redirection.
// This route handler ensures any stray traffic is redirected correctly.
export default function KaryawanRootPage() {
  redirect('/karyawan/absensi-harian');
}
