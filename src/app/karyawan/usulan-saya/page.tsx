
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import type { Suggestion } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lightbulb, Send, Loader2, History, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const SUGGESTIONS_KEY = 'app-suggestions';

export default function UsulanSayaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestionText, setSuggestionText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (user) {
      try {
        const storedData = localStorage.getItem(SUGGESTIONS_KEY);
        if (storedData) {
          const allSuggestions: Suggestion[] = JSON.parse(storedData);
          const userHistory = allSuggestions
            .filter(s => s.reporterId === user.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setHistory(userHistory);
        }
      } catch (error) {
        console.error("Failed to load suggestion history:", error);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) {
      toast({ variant: 'destructive', title: 'Usulan Kosong', description: 'Mohon tuliskan usulan Anda.' });
      return;
    }
    if (!user || !user.nik || !user.location) {
      toast({ variant: 'destructive', title: 'Error', description: 'Data pengguna tidak valid.' });
      return;
    }

    setIsLoading(true);

    const newSuggestion: Suggestion = {
      id: new Date().toISOString() + Math.random(),
      reporterId: user.id,
      reporterName: user.username,
      reporterNik: user.nik,
      location: user.location,
      text: suggestionText,
      timestamp: new Date().toISOString(),
      status: 'new',
    };

    try {
      const storedData = localStorage.getItem(SUGGESTIONS_KEY);
      const allSuggestions: Suggestion[] = storedData ? JSON.parse(storedData) : [];
      allSuggestions.push(newSuggestion);
      localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(allSuggestions));

      setHistory(prev => [newSuggestion, ...prev]);
      setSuggestionText('');
      toast({ title: 'Usulan Terkirim', description: 'Terima kasih atas masukan Anda.' });
    } catch (error) {
      console.error("Failed to save suggestion:", error);
      toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan usulan.' });
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
              <Lightbulb className="h-6 w-6 text-primary" />
              Kirim Usulan
            </CardTitle>
            <CardDescription>
              Punya ide atau usulan untuk perbaikan? Sampaikan di sini. Identitas Anda akan dicantumkan dalam laporan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="suggestionText">Isi Usulan Anda</Label>
              <Textarea
                id="suggestionText"
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
                placeholder="Tuliskan ide atau usulan Anda secara detail..."
                rows={8}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
              Kirim Usulan
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Usulan Saya
          </CardTitle>
          <CardDescription>
            Daftar usulan yang pernah Anda kirimkan.
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
              <p className="mt-1 text-sm">Anda belum pernah mengirimkan usulan.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
