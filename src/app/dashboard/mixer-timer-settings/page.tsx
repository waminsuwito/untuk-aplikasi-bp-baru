
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Timer, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MIXER_TIMER_CONFIG_KEY, defaultMixerTimerConfig, type MixerTimerConfig } from '@/lib/config';

export default function MixerTimerSettingsPage() {
  const [timerConfig, setTimerConfig] = useState<MixerTimerConfig>(defaultMixerTimerConfig);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedConfig = localStorage.getItem(MIXER_TIMER_CONFIG_KEY);
      if (storedConfig) {
        setTimerConfig(JSON.parse(storedConfig));
      }
    } catch (error) {
      console.error("Failed to load mixer timer settings:", error);
    }
  }, []);

  const handleConfigChange = (field: keyof MixerTimerConfig, value: number) => {
    if (value < 0) return;
    setTimerConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(MIXER_TIMER_CONFIG_KEY, JSON.stringify(timerConfig));
      toast({ title: 'Berhasil', description: 'Pengaturan timer pintu mixer telah disimpan.' });
    } catch (error) {
      console.error("Failed to save mixer timer settings:", error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat menyimpan pengaturan.' });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-6 w-6 text-primary" />
              Timer Pintu Mixer
            </CardTitle>
            <CardDescription>
              Atur durasi (dalam detik) untuk setiap tahapan proses buka/tutup pintu mixer.
            </CardDescription>
          </div>
           <Button asChild variant="outline">
              <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali
              </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(timerConfig).map(([key, value]) => {
          const formattedKey = key.replace('_s', '').replace(/(\d)/, ' $1').replace('open', 'Buka').replace('pause', 'Jeda').replace('close', 'Pintu Tutup');
          return (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="text-base capitalize">{formattedKey}</Label>
              <Input
                id={key}
                type="number"
                value={value}
                onChange={(e) => handleConfigChange(key as keyof MixerTimerConfig, Number(e.target.value))}
                className="w-24 text-center"
                min="0"
              />
            </div>
          );
        })}
        <Button onClick={handleSave} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Simpan Pengaturan
        </Button>
      </CardContent>
    </Card>
  );
}
