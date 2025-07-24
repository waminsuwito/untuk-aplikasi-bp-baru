
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GitCompareArrows, Inbox } from 'lucide-react';

export default function LaporanSinkronisasiPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompareArrows className="h-6 w-6 text-primary" />
          Laporan Sinkronisasi
        </CardTitle>
        <CardDescription>
          Tinjau laporan sinkronisasi data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <Inbox className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">Fitur Dinonaktifkan</h3>
          <p className="mt-1 text-sm">Fungsionalitas laporan sinkronisasi tidak tersedia saat ini.</p>
        </div>
      </CardContent>
    </Card>
  );
}
