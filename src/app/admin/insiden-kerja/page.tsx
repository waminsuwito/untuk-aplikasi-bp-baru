

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Trash2, Inbox, Image as ImageIcon, User, MapPin, Clock } from 'lucide-react';
import type { AccidentReport } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
import { useAuth } from '@/context/auth-provider';
import { playSound } from '@/lib/utils';

const ACCIDENT_REPORTS_KEY = 'app-accident-reports';
const reportsUpdatedEvent = new Event('accidentReportsUpdated'); // Can be used for notifications

// Custom hook to get the previous value of a prop or state
function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


export default function InsidenKerjaPage() {
  const [reports, setReports] = useState<AccidentReport[]>([]);
  const prevReports = usePrevious(reports);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadReports = () => {
        if (!user) return;
        try {
          const storedData = localStorage.getItem(ACCIDENT_REPORTS_KEY);
          if (storedData) {
            let parsedReports: AccidentReport[] = JSON.parse(storedData);
            
            if (user.role !== 'super_admin') {
                parsedReports = parsedReports.filter(report => report.location === user.location);
            }
            
            parsedReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setReports(parsedReports);
          }
        } catch (error) {
          console.error("Failed to load accident reports:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat laporan insiden.' });
        }
    };
    loadReports();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === ACCIDENT_REPORTS_KEY) {
            loadReports();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('accidentReportsUpdated', loadReports);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('accidentReportsUpdated', loadReports);
    }

  }, [toast, user]);
  
  useEffect(() => {
    if (prevReports && reports.length > prevReports.length) {
      const newReportExists = reports.some(report => 
        !prevReports.find(prev => prev.id === report.id) && report.status === 'new'
      );
      if (newReportExists) {
        playSound('/sounds/accident-notification.mp3');
      }
    }
  }, [reports, prevReports]);


  const handleMarkAsReviewed = (id: string) => {
    try {
        const storedData = localStorage.getItem(ACCIDENT_REPORTS_KEY);
        const allReports: AccidentReport[] = storedData ? JSON.parse(storedData) : [];
        const updatedReports = allReports.map(r => r.id === id ? { ...r, status: 'reviewed' as const } : r);
        localStorage.setItem(ACCIDENT_REPORTS_KEY, JSON.stringify(updatedReports));
        window.dispatchEvent(reportsUpdatedEvent);
        toast({ title: 'Ditandai', description: 'Laporan telah ditandai sebagai sudah ditinjau.' });
    } catch (error) {
        console.error("Failed to mark report as reviewed", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status laporan.' });
    }
  };

  const handleDelete = (id: string) => {
    try {
        const storedData = localStorage.getItem(ACCIDENT_REPORTS_KEY);
        const allReports: AccidentReport[] = storedData ? JSON.parse(storedData) : [];
        const updatedReports = allReports.filter(r => r.id !== id);
        localStorage.setItem(ACCIDENT_REPORTS_KEY, JSON.stringify(updatedReports));
        window.dispatchEvent(reportsUpdatedEvent);
        toast({ variant: 'destructive', title: 'Dihapus', description: 'Laporan insiden telah dihapus.' });
    } catch (error) {
        console.error("Failed to delete report", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus laporan.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-primary" />
          Laporan Insiden Kerja
        </CardTitle>
        <CardDescription>
          Tinjau laporan insiden atau kecelakaan kerja yang dikirimkan oleh karyawan.
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
                      handleMarkAsReviewed(report.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={report.status === 'new' ? 'destructive' : 'secondary'}>
                        {report.status === 'new' ? 'Baru' : 'Ditinjau'}
                      </Badge>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{report.accidentLocation}</p>
                        <p className="text-xs font-normal text-muted-foreground">
                            {format(new Date(report.accidentTimestamp), "d MMM yyyy, HH:mm", { locale: id })}
                        </p>
                      </div>
                    </div>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {report.photoDataUri && <ImageIcon className="h-4 w-4" />}
                        <span>Oleh: {report.reporterName}</span>
                     </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm bg-muted/30 p-3 rounded-md border">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground"/> 
                        <strong>Pelapor:</strong> {report.reporterName} (NIK: {report.reporterNik})
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground"/> 
                        <strong>Lokasi BP:</strong> {report.location}
                    </div>
                     <div className="flex items-center gap-2 col-span-full">
                        <Clock className="h-4 w-4 text-muted-foreground"/> 
                        <strong>Waktu Dilaporkan:</strong> {format(new Date(report.timestamp), "d MMMM yyyy 'pukul' HH:mm", { locale: id })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Deskripsi Kejadian:</h4>
                    <p className="whitespace-pre-wrap text-base bg-muted/50 p-4 rounded-md border">
                        {report.description}
                    </p>
                  </div>
                  {report.photoDataUri && (
                    <div>
                      <h4 className="font-semibold mb-2">Lampiran Foto:</h4>
                      <div className="relative w-full max-w-md border rounded-md overflow-hidden">
                        <Image
                          src={report.photoDataUri}
                          alt="Lampiran laporan insiden"
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
            <h3 className="mt-4 text-lg font-semibold">Tidak Ada Laporan</h3>
            <p className="mt-1 text-sm">Belum ada laporan insiden kerja yang diterima di lokasi Anda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
