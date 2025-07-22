import { redirect } from 'next/navigation';

// This page is deprecated. We redirect any traffic to it
// to the main user management page.
export async function GET() {
  redirect('/admin/manajemen-karyawan');
}
