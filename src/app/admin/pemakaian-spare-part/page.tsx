
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function PemakaianSparePartPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          Pemakaian Spare Part
        </CardTitle>
        <CardDescription>
          Catat dan kelola pemakaian spare part untuk peralatan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Halaman untuk manajemen pemakaian spare part akan ditampilkan di sini.</p>
        </div>
      </CardContent>
    </Card>
  );
}
