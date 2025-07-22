
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Printer } from 'lucide-react';

const PRINTER_SETTINGS_KEY = 'app-printer-settings';
type PrintMode = 'preview' | 'direct' | 'save';

export default function PrinterSettingsPage() {
  const [printMode, setPrintMode] = useState<PrintMode>('preview');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(PRINTER_SETTINGS_KEY) as PrintMode | null;
      if (savedMode) {
        setPrintMode(savedMode);
      }
    } catch (error) {
      console.error("Failed to load printer settings:", error);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(PRINTER_SETTINGS_KEY, printMode);
      toast({ title: 'Berhasil', description: 'Pengaturan printer telah disimpan.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan pengaturan printer.' });
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Printer className="h-6 w-6 text-primary" />
                    Pengaturan Printer
                </CardTitle>
                <CardDescription>
                    Pilih bagaimana sistem akan menangani proses pencetakan dokumen.
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
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="print-mode">PILIH MODE CETAK YANG ANDA INGINKAN</Label>
          <Select value={printMode} onValueChange={(value: PrintMode) => setPrintMode(value)}>
            <SelectTrigger id="print-mode">
              <SelectValue placeholder="Pilih mode cetak..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preview">PREVIEW</SelectItem>
              <SelectItem value="direct">CETAK LANGSUNG</SelectItem>
              <SelectItem value="save">SIMPAN DATA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Simpan
        </Button>
      </CardFooter>
    </Card>
  );
}
