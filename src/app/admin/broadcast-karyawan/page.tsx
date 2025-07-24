
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Megaphone, Inbox } from 'lucide-react';

export default function BroadcastKaryawanPage() {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Broadcast Pesan ke Karyawan
        </CardTitle>
        <CardDescription>
          Kirim pengumuman atau pesan penting ke semua karyawan.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="text-center py-12 text-muted-foreground">
          <Inbox className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Fitur Dinonaktifkan</h3>
            <p className="mt-1 text-sm">Fungsionalitas broadcast tidak tersedia saat ini.</p>
        </div>
      </CardContent>
    </Card>
  );
}
