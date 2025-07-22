import { redirect } from 'next/navigation';

// This route handler permanently redirects the base /karyawan path
// to a default page within the karyawan section. This is more reliable
// for static exports than relying on client-side logic.
export async function GET() {
  redirect('/karyawan/absensi-harian');
}
