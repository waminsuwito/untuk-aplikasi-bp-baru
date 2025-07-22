
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GitCompareArrows } from 'lucide-react';

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
          <p>Konten untuk laporan sinkronisasi akan ditampilkan di sini.</p>
        </div>
      </CardContent>
    </Card>
  );
}
