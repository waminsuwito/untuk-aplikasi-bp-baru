
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MIXING_PROCESS_STORAGE_KEY, defaultMixingProcess, type MixingProcessStep, type MixingProcessConfig } from '@/lib/config';

export default function MixingSettingsPage() {
  const [mixingConfig, setMixingConfig] = useState<MixingProcessConfig>(defaultMixingProcess);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedConfig = localStorage.getItem(MIXING_PROCESS_STORAGE_KEY);
      if (storedConfig) {
        setMixingConfig(JSON.parse(storedConfig));
      }
    } catch (error) {
      console.error("Failed to load mixing settings:", error);
    }
  }, []);

  const handleConfigChange = (id: MixingProcessStep['id'], field: 'order' | 'delay', value: number) => {
    if (value < 0) return;
    const newSteps = mixingConfig.steps.map(step =>
      step.id === id ? { ...step, [field]: value } : step
    );
    setMixingConfig({ steps: newSteps });
  };
  
  const sortedSteps = [...mixingConfig.steps].sort((a, b) => a.order - b.order);

  const handleSave = () => {
    try {
      localStorage.setItem(MIXING_PROCESS_STORAGE_KEY, JSON.stringify(mixingConfig));
      toast({ title: 'Berhasil', description: 'Pengaturan urutan mixing telah disimpan.' });
    } catch (error) {
      console.error("Failed to save mixing settings:", error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat menyimpan pengaturan.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-6 w-6 text-primary" />
              Pengaturan Lanjutan (Urutan Mixing)
            </CardTitle>
            <CardDescription>
              Atur urutan dan jeda waktu untuk proses pencampuran material dalam mode AUTO.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Link>
            </Button>
            <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Simpan
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg max-w-2xl mx-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Nama Material</TableHead>
                <TableHead className="text-center">Urutan Mixing</TableHead>
                <TableHead className="text-center">Jeda Waktu (detik)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSteps.map((step) => (
                <TableRow key={step.id}>
                  <TableCell className="font-medium text-base">{step.name}</TableCell>
                  <TableCell>
                     <Select
                        value={String(step.order)}
                        onValueChange={(value) => handleConfigChange(step.id, 'order', Number(value))}
                     >
                        <SelectTrigger className="w-28 mx-auto">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[...Array(mixingConfig.steps.length).keys()].map(i => (
                                <SelectItem key={i+1} value={String(i+1)}>{i+1}</SelectItem>
                            ))}
                        </SelectContent>
                     </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={step.delay}
                      onChange={(e) => handleConfigChange(step.id, 'delay', Number(e.target.value))}
                      className="w-28 text-center mx-auto"
                      min="0"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-center text-muted-foreground text-sm mt-4 max-w-2xl mx-auto">
            <p><span className="font-bold">Urutan Mixing:</span> Tentukan grup material mana yang akan dituang lebih dulu. Urutan 1 akan dieksekusi pertama kali.</p>
            <p><span className="font-bold">Jeda Waktu:</span> Waktu tunggu (dalam detik) setelah grup sebelumnya mulai dituang. Jeda 0 berarti dituang bersamaan dengan item lain dalam grup yang sama.</p>
        </div>
      </CardContent>
    </Card>
  );
}
