import { redirect } from 'next/navigation';

// This route handler permanently redirects the base /admin path
// to a default page within the admin section. This is more reliable
// for static exports than relying on client-side logic.
export async function GET() {
  redirect('/admin/manajemen-karyawan');
}
