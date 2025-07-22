
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Send, Paperclip, Loader2 } from 'lucide-react';
import type { AnonymousReport } from '@/lib/types';

const ANONYMOUS_REPORTS_KEY = 'app-anonymous-reports';

export default function LaporanAnonimPage() {
  const [reportText, setReportText] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Terlalu Besar',
          description: 'Ukuran foto tidak boleh melebihi 5MB.',
        });
        e.target.value = ''; // Clear the input
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
    if (!reportText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Laporan Kosong',
        description: 'Mohon tuliskan isi laporan Anda.',
      });
      return;
    }

    setIsLoading(true);

    try {
      let photoDataUri: string | null = null;
      if (photoFile) {
        photoDataUri = await fileToDataUri(photoFile);
      }

      const newReport: AnonymousReport = {
        id: new Date().toISOString() + Math.random(),
        reportText,
        photoDataUri,
        timestamp: new Date().toISOString(),
        status: 'new',
      };

      const storedReports = localStorage.getItem(ANONYMOUS_REPORTS_KEY);
      const reports: AnonymousReport[] = storedReports ? JSON.parse(storedReports) : [];
      reports.push(newReport);
      localStorage.setItem(ANONYMOUS_REPORTS_KEY, JSON.stringify(reports));

      toast({
        title: 'Laporan Terkirim',
        description: 'Terima kasih atas laporan Anda. Laporan telah dikirim secara anonim.',
      });

      // Reset form
      setReportText('');
      setPhotoFile(null);
      // This is a bit of a hack to clear the file input visually
      const fileInput = document.getElementById('photo') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Failed to submit report:", error);
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
            <ShieldAlert className="h-6 w-6 text-primary" />
            Laporan Anonim
          </CardTitle>
          <CardDescription className="text-sm p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg">
            Anda bisa melaporkan tindakan apapun yang berpotensi merugikan perusahaan, misalnya pencurian, asusila di lokasi perusahaan, judi, narkoba dan tindakan kriminal lainnya. Silakan anda tuliskan apa yang ingin anda laporkan dan sertakan dokumentasi pendukung. <span className="font-bold">Kami tidak akan membuka identitas pelapor karena anda berada pada status anonim, yang kami tidak dapat mengetahui siapa Anda.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportText">Isi Laporan</Label>
            <Textarea
              id="reportText"
              value={reportText}
              onChange={(e) => setReportText(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase' }}
              placeholder="Tuliskan laporan Anda secara detail di sini..."
              rows={10}
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
