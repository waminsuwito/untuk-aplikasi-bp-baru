
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MailQuestion, Trash2, CheckCircle, Inbox, Image as ImageIcon } from 'lucide-react';
import type { AnonymousReport } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';

const ANONYMOUS_REPORTS_KEY = 'app-anonymous-reports';

// Custom event to notify other components (like the sidebar) of changes
const reportsUpdatedEvent = new Event('reportsUpdated');

export default function PesanAnonimPage() {
  const [reports, setReports] = useState<AnonymousReport[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(ANONYMOUS_REPORTS_KEY);
      if (storedData) {
        const parsedReports: AnonymousReport[] = JSON.parse(storedData);
        // Sort by newest first
        parsedReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setReports(parsedReports);
      }
    } catch (error) {
      console.error("Failed to load anonymous reports:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat laporan.' });
    }
  }, [toast]);

  const updateReports = (updatedReports: AnonymousReport[]) => {
    setReports(updatedReports);
    localStorage.setItem(ANONYMOUS_REPORTS_KEY, JSON.stringify(updatedReports));
    window.dispatchEvent(reportsUpdatedEvent);
  };

  const handleMarkAsRead = (id: string) => {
    const updatedReports = reports.map(r => r.id === id ? { ...r, status: 'read' as const } : r);
    updateReports(updatedReports);
    toast({ title: 'Ditandai', description: 'Laporan telah ditandai sebagai sudah dibaca.' });
  };

  const handleDelete = (id: string) => {
    const updatedReports = reports.filter(r => r.id !== id);
    updateReports(updatedReports);
    toast({ variant: 'destructive', title: 'Dihapus', description: 'Laporan telah dihapus.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailQuestion className="h-6 w-6 text-primary" />
          Pesan dari Anonim
        </CardTitle>
        <CardDescription>
          Tinjau laporan yang dikirimkan secara anonim. Identitas pelapor dirahasiakan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {reports.map((report) => (
              <AccordionItem key={report.id} value={report.id}>
                <AccordionTrigger
                  onClick={() => {
                    if (report.status === 'new') {
                      handleMarkAsRead(report.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={report.status === 'new' ? 'destructive' : 'secondary'}>
                        {report.status === 'new' ? 'Baru' : 'Dibaca'}
                      </Badge>
                      <span className="text-sm font-normal text-muted-foreground">
                        {format(new Date(report.timestamp), "d MMMM yyyy, HH:mm", { locale: id })}
                      </span>
                    </div>
                     {report.photoDataUri && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p className="whitespace-pre-wrap text-base bg-muted/50 p-4 rounded-md">
                    {report.reportText}
                  </p>
                  {report.photoDataUri && (
                    <div>
                      <h4 className="font-semibold mb-2">Lampiran Foto:</h4>
                      <div className="relative w-full max-w-md border rounded-md overflow-hidden">
                        <Image
                          src={report.photoDataUri}
                          alt="Lampiran laporan anonim"
                          width={600}
                          height={400}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(report.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus Laporan
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <Inbox className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Kotak Masuk Kosong</h3>
            <p className="mt-1 text-sm">Belum ada laporan anonim yang diterima.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
