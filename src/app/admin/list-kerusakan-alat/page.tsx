
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function ListKerusakanAlatPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-6 w-6 text-primary" />
          List Kerusakan Alat
        </CardTitle>
        <CardDescription>
          Tinjau dan kelola daftar kerusakan alat yang dilaporkan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Halaman untuk daftar kerusakan alat akan ditampilkan di sini.</p>
        </div>
      </CardContent>
    </Card>
  );
}
