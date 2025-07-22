
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import type { Complaint } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MessageSquareWarning, Send, Loader2, History, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const COMPLAINTS_KEY = 'app-complaints';

export default function KomplainSayaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaintText, setComplaintText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Complaint[]>([]);

  useEffect(() => {
    if (user) {
      try {
        const storedData = localStorage.getItem(COMPLAINTS_KEY);
        if (storedData) {
          const allComplaints: Complaint[] = JSON.parse(storedData);
          const userHistory = allComplaints
            .filter(s => s.reporterId === user.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setHistory(userHistory);
        }
      } catch (error) {
        console.error("Failed to load complaint history:", error);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) {
      toast({ variant: 'destructive', title: 'Komplain Kosong', description: 'Mohon tuliskan komplain Anda.' });
      return;
    }
    if (!user || !user.nik || !user.location) {
      toast({ variant: 'destructive', title: 'Error', description: 'Data pengguna tidak valid.' });
      return;
    }

    setIsLoading(true);

    const newComplaint: Complaint = {
      id: new Date().toISOString() + Math.random(),
      reporterId: user.id,
      reporterName: user.username,
      reporterNik: user.nik,
      location: user.location,
      text: complaintText,
      timestamp: new Date().toISOString(),
      status: 'new',
    };

    try {
      const storedData = localStorage.getItem(COMPLAINTS_KEY);
      const allComplaints: Complaint[] = storedData ? JSON.parse(storedData) : [];
      allComplaints.push(newComplaint);
      localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(allComplaints));

      setHistory(prev => [newComplaint, ...prev]);
      setComplaintText('');
      toast({ title: 'Komplain Terkirim', description: 'Terima kasih, komplain Anda telah kami terima.' });
    } catch (error) {
      console.error("Failed to save complaint:", error);
      toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan komplain.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-6 w-6 text-destructive" />
              Kirim Komplain
            </CardTitle>
            <CardDescription>
              Sampaikan keluhan atau komplain Anda di sini. Identitas Anda akan dicantumkan dalam laporan untuk tindak lanjut.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="complaintText">Isi Komplain Anda</Label>
              <Textarea
                id="complaintText"
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
                placeholder="Tuliskan keluhan atau komplain Anda secara detail..."
                rows={8}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" variant="destructive" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
              Kirim Komplain
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Komplain Saya
          </CardTitle>
          <CardDescription>
            Daftar komplain yang pernah Anda kirimkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <ul className="space-y-4">
              {history.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 p-4 border rounded-lg bg-muted/30">
                  <div>
                    <p className="whitespace-pre-wrap">{item.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Dikirim pada: {format(new Date(item.timestamp), "d MMMM yyyy, HH:mm", { locale: id })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <Inbox className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">Belum Ada Riwayat</h3>
              <p className="mt-1 text-sm">Anda belum pernah mengirimkan komplain.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
