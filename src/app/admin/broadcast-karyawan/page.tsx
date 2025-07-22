
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Send, Loader2, Trash2, BellRing, Inbox } from 'lucide-react';
import type { BroadcastMessage } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


const BROADCAST_MESSAGES_KEY = 'app-broadcast-messages';

export default function BroadcastKaryawanPage() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<BroadcastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(BROADCAST_MESSAGES_KEY);
      if (storedData) {
        const parsedMessages: BroadcastMessage[] = JSON.parse(storedData);
        parsedMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setHistory(parsedMessages);
      }
    } catch (error) {
      console.error("Failed to load broadcast history:", error);
    }
  }, []);

  const saveHistory = (updatedHistory: BroadcastMessage[]) => {
    localStorage.setItem(BROADCAST_MESSAGES_KEY, JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Pesan Kosong',
        description: 'Mohon tuliskan isi pesan broadcast Anda.',
      });
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newBroadcast: BroadcastMessage = {
      id: new Date().toISOString(),
      messageText: message,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [newBroadcast, ...history];
    saveHistory(updatedHistory);

    toast({
      title: 'Broadcast Terkirim',
      description: 'Pesan telah berhasil dikirim ke semua karyawan.',
    });

    setMessage('');
    setIsLoading(false);
  };

  const handleDelete = (id: string) => {
    const updatedHistory = history.filter(msg => msg.id !== id);
    saveHistory(updatedHistory);
    toast({
      variant: 'destructive',
      title: 'Pesan Dihapus',
      description: 'Pesan broadcast telah dihapus dari riwayat.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handlePublish}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              Buat Broadcast Baru
            </CardTitle>
            <CardDescription>
              Kirim pesan penting ke semua karyawan. Pesan akan muncul di aplikasi mereka.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="message">Isi Pesan</Label>
              <Textarea
                placeholder="Tulis pesan Anda di sini..."
                id="message"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Kirim Broadcast
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Riwayat Broadcast
          </CardTitle>
          <CardDescription>
            Daftar pesan yang telah Anda kirim sebelumnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <ul className="space-y-4">
              {history.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 p-4 border rounded-lg bg-muted/30">
                  <div>
                    <p className="whitespace-pre-wrap">{item.messageText}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Dikirim pada: {format(new Date(item.timestamp), "d MMMM yyyy, HH:mm", { locale: id })}
                    </p>
                  </div>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Hapus</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus pesan broadcast ini? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(item.id)}>
                                Ya, Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <Inbox className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">Belum Ada Riwayat</h3>
              <p className="mt-1 text-sm">Anda belum pernah mengirim broadcast.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
