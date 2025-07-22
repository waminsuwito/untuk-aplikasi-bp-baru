
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageSquareWarning, Trash2, Inbox, User, MapPin } from 'lucide-react';
import type { Complaint } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/context/auth-provider';

const COMPLAINTS_KEY = 'app-complaints';
const complaintsUpdatedEvent = new Event('complaintsUpdated');

export default function KomplainKaryawanPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadComplaints = () => {
        if (!user) return;
        try {
          const storedData = localStorage.getItem(COMPLAINTS_KEY);
          if (storedData) {
            let parsed: Complaint[] = JSON.parse(storedData);

            if (user.role !== 'super_admin') {
                parsed = parsed.filter(item => item.location === user.location);
            }

            parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setComplaints(parsed);
          }
        } catch (error) {
          console.error("Failed to load complaints:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat komplain.' });
        }
    };
    loadComplaints();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COMPLAINTS_KEY) loadComplaints();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('complaintsUpdated', loadComplaints);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('complaintsUpdated', loadComplaints);
    }

  }, [toast, user]);

  const handleMarkAsRead = (id: string) => {
    try {
        const storedData = localStorage.getItem(COMPLAINTS_KEY);
        const allItems: Complaint[] = storedData ? JSON.parse(storedData) : [];
        const updated = allItems.map(r => r.id === id ? { ...r, status: 'read' as const } : r);
        localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(updated));
        window.dispatchEvent(complaintsUpdatedEvent);
    } catch (error) {
        console.error("Failed to update complaint status", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status komplain.' });
    }
  };

  const handleDelete = (id: string) => {
    try {
        const storedData = localStorage.getItem(COMPLAINTS_KEY);
        const allItems: Complaint[] = storedData ? JSON.parse(storedData) : [];
        const updated = allItems.filter(r => r.id !== id);
        localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(updated));
        window.dispatchEvent(complaintsUpdatedEvent);
        toast({ variant: 'destructive', title: 'Dihapus', description: 'Komplain telah dihapus.' });
    } catch (error) {
        console.error("Failed to delete complaint", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus komplain.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareWarning className="h-6 w-6 text-destructive" />
          Komplain dari Karyawan
        </CardTitle>
        <CardDescription>
          Tinjau keluhan atau komplain yang dikirimkan oleh karyawan untuk ditindaklanjuti.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {complaints.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {complaints.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger
                  onClick={() => {
                    if (item.status === 'new') handleMarkAsRead(item.id);
                  }}
                >
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={item.status === 'new' ? 'destructive' : 'secondary'}>
                        {item.status === 'new' ? 'Baru' : 'Dibaca'}
                      </Badge>
                      <div className="text-left">
                        <p className="font-semibold text-sm">Oleh: {item.reporterName}</p>
                        <p className="text-xs font-normal text-muted-foreground">
                            {format(new Date(item.timestamp), "d MMM yyyy, HH:mm", { locale: id })}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm bg-muted/30 p-3 rounded-md border">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground"/> 
                        <strong>Pelapor:</strong> {item.reporterName} (NIK: {item.reporterNik})
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground"/> 
                        <strong>Lokasi:</strong> {item.location}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Isi Komplain:</h4>
                    <p className="whitespace-pre-wrap text-base bg-muted/50 p-4 rounded-md border">
                        {item.text}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus Komplain
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <Inbox className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Tidak Ada Komplain</h3>
            <p className="mt-1 text-sm">Belum ada komplain yang diterima dari karyawan di lokasi Anda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
