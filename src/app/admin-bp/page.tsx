
// This root page is not strictly necessary as the layout guard will redirect,
// but it's good practice to have it.
import { redirect } from 'next/navigation';

export default function AdminBpRootPage() {
  // Redirect to the default page for this section
  redirect('/admin-bp/schedule-cor-hari-ini');
}
