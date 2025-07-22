
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Trash2, Inbox, User, MapPin, Clock } from 'lucide-react';
import type { Suggestion } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/context/auth-provider';

const SUGGESTIONS_KEY = 'app-suggestions';
const suggestionsUpdatedEvent = new Event('suggestionsUpdated');

export default function UsulanKaryawanPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadSuggestions = () => {
        if (!user) return;
        try {
          const storedData = localStorage.getItem(SUGGESTIONS_KEY);
          if (storedData) {
            let parsed: Suggestion[] = JSON.parse(storedData);

            if (user.role !== 'super_admin') {
                parsed = parsed.filter(item => item.location === user.location);
            }

            parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setSuggestions(parsed);
          }
        } catch (error) {
          console.error("Failed to load suggestions:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat usulan.' });
        }
    };
    loadSuggestions();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SUGGESTIONS_KEY) loadSuggestions();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('suggestionsUpdated', loadSuggestions);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('suggestionsUpdated', loadSuggestions);
    }

  }, [toast, user]);

  const handleMarkAsRead = (id: string) => {
    try {
        const storedData = localStorage.getItem(SUGGESTIONS_KEY);
        const allItems: Suggestion[] = storedData ? JSON.parse(storedData) : [];
        const updated = allItems.map(r => r.id === id ? { ...r, status: 'read' as const } : r);
        localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(updated));
        window.dispatchEvent(suggestionsUpdatedEvent);
    } catch (error) {
        console.error("Failed to update suggestion status", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status usulan.' });
    }
  };

  const handleDelete = (id: string) => {
    try {
        const storedData = localStorage.getItem(SUGGESTIONS_KEY);
        const allItems: Suggestion[] = storedData ? JSON.parse(storedData) : [];
        const updated = allItems.filter(r => r.id !== id);
        localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(updated));
        window.dispatchEvent(suggestionsUpdatedEvent);
        toast({ variant: 'destructive', title: 'Dihapus', description: 'Usulan telah dihapus.' });
    } catch (error) {
        console.error("Failed to delete suggestion", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus usulan.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          Usulan dari Karyawan
        </CardTitle>
        <CardDescription>
          Tinjau usulan dan ide perbaikan yang dikirimkan oleh karyawan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suggestions.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {suggestions.map((item) => (
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
                    <h4 className="font-semibold mb-1">Isi Usulan:</h4>
                    <p className="whitespace-pre-wrap text-base bg-muted/50 p-4 rounded-md border">
                        {item.text}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus Usulan
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <Inbox className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Tidak Ada Usulan</h3>
            <p className="mt-1 text-sm">Belum ada usulan yang diterima dari karyawan di lokasi Anda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
