
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-provider';
import { AlertTriangle, Send, Paperclip, Loader2 } from 'lucide-react';
import type { AccidentReport } from '@/lib/types';
import { format } from 'date-fns';

const ACCIDENT_REPORTS_KEY = 'app-accident-reports';

export default function LaporkanAccidentPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [description, setDescription] = useState('');
  const [accidentLocation, setAccidentLocation] = useState('');
  // Set initial date and time to now, formatted for datetime-local input
  const [accidentTimestamp, setAccidentTimestamp] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File Terlalu Besar',
          description: 'Ukuran foto tidak boleh melebihi 5MB.',
        });
        e.target.value = '';
        return;
      }
      setPhotoFile(file);
    } else {
      setPhotoFile(null);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !accidentLocation.trim() || !accidentTimestamp) {
      toast({
        variant: 'destructive',
        title: 'Form Tidak Lengkap',
        description: 'Mohon isi semua kolom yang wajib diisi.',
      });
      return;
    }
    if (!user || !user.nik || !user.location) {
        toast({ variant: 'destructive', title: 'Error', description: 'Data pengguna tidak ditemukan.' });
        return;
    }

    setIsLoading(true);

    try {
      let photoDataUri: string | null = null;
      if (photoFile) {
        photoDataUri = await fileToDataUri(photoFile);
      }

      const newReport: AccidentReport = {
        id: new Date().toISOString() + Math.random(),
        reporterId: user.id,
        reporterName: user.username,
        reporterNik: user.nik,
        location: user.location,
        accidentLocation,
        accidentTimestamp: new Date(accidentTimestamp).toISOString(),
        description,
        photoDataUri,
        timestamp: new Date().toISOString(),
        status: 'new',
      };

      const storedReports = localStorage.getItem(ACCIDENT_REPORTS_KEY);
      const reports: AccidentReport[] = storedReports ? JSON.parse(storedReports) : [];
      reports.push(newReport);
      localStorage.setItem(ACCIDENT_REPORTS_KEY, JSON.stringify(reports));

      toast({
        title: 'Laporan Terkirim',
        description: 'Terima kasih. Laporan insiden Anda telah dikirim.',
      });

      // Reset form
      setDescription('');
      setAccidentLocation('');
      setPhotoFile(null);
      const fileInput = document.getElementById('photo') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Failed to submit accident report:", error);
      toast({
        variant: 'destructive',
        title: 'Gagal Mengirim',
        description: 'Terjadi kesalahan saat mengirim laporan. Silakan coba lagi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Laporkan Insiden/Kecelakaan Kerja
          </CardTitle>
          <CardDescription>
            Gunakan formulir ini untuk melaporkan setiap insiden atau kecelakaan yang terjadi di area kerja. Keselamatan adalah prioritas utama.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accidentLocation">Lokasi Kejadian</Label>
                <Input
                  id="accidentLocation"
                  value={accidentLocation}
                  onChange={(e) => setAccidentLocation(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase' }}
                  placeholder="Contoh: Area dekat mixer, gudang semen"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accidentTimestamp">Waktu Kejadian</Label>
                <Input
                  id="accidentTimestamp"
                  type="datetime-local"
                  value={accidentTimestamp}
                  onChange={(e) => setAccidentTimestamp(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Kejadian</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase' }}
              placeholder="Jelaskan kronologi kejadian secara rinci..."
              rows={8}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo">Lampirkan Foto (Opsional)</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isLoading}
            />
             {photoFile && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Paperclip className="h-3 w-3" />
                File terpilih: {photoFile.name}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
            Kirim Laporan
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
