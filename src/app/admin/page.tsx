// This page is replaced by a route handler to ensure proper redirection.
import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // This component will likely not be rendered directly,
  // but as a fallback, we redirect to a default admin page.
  redirect('/admin/manajemen-karyawan');
}
