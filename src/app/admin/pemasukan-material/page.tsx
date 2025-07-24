
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PackagePlus, Calendar as CalendarIcon, Printer } from 'lucide-react';
import type { BongkarMaterial } from '@/lib/types';
import { format } from 'date-fns';
import { cn, printElement } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const BONGKAR_MATERIAL_STORAGE_KEY = 'app-bongkar-material';
const materialOptions = ["Pasir", "Batu", "Semen", "Obat Beton"];

export default function PemasukanMaterialPage() {
  const [completedUnloads, setCompletedUnloads] = useState<BongkarMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(BONGKAR_MATERIAL_STORAGE_KEY);
      if (storedData) {
        const allUnloads: BongkarMaterial[] = JSON.parse(storedData);
        const finished = allUnloads.filter(item => item.status === 'Selesai');
        setCompletedUnloads(finished);
      }
    } catch (error)      {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const filteredUnloads = useMemo(() => {
    return completedUnloads.filter(item => {
      const isMaterialMatch = selectedMaterial === 'all' ? true : item.namaMaterial === selectedMaterial;
      let isDateMatch = true;
      if (selectedDate && item.waktuSelesai) {
        try {
          const itemDate = new Date(item.waktuSelesai);
          isDateMatch = format(itemDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
        } catch (e) {
          isDateMatch = false; // Invalid date in data
        }
      }
      return isMaterialMatch && isDateMatch;
    });
  }, [completedUnloads, selectedMaterial, selectedDate]);
  
  const materialTotals = useMemo(() => {
    const totals: { [key: string]: { total: number; unit: string } } = {};

    filteredUnloads.forEach(item => {
      if (!item.volume) return;
      const parts = item.volume.split(' ');
      const value = parseFloat(parts[0]);
      const unit = parts.slice(1).join(' ');

      if (!isNaN(value) && unit) {
        if (totals[item.namaMaterial]) {
          totals[item.namaMaterial].total += value;
        } else {
          totals[item.namaMaterial] = { total: value, unit: unit };
        }
      }
    });

    return totals;
  }, [filteredUnloads]);


  const handleResetFilters = () => {
    setSelectedMaterial('all');
    setSelectedDate(undefined);
  };
  
  return (
    <div className="space-y-6">
      <Card id="print-content">
        <CardHeader>
          <div className="flex justify-between items-start no-print">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PackagePlus className="h-6 w-6 text-primary" />
                Laporan Pemasukan Material
              </CardTitle>
              <CardDescription>
                Menampilkan laporan material yang telah selesai dibongkar. Gunakan filter untuk menyortir data.
              </CardDescription>
            </div>
            <button
              onClick={() => printElement('print-content')}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium"
            >
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </button>
          </div>
          <div className="print-only mb-4 text-center">
              <h2 className="text-xl font-bold mb-2">Laporan Pemasukan Material</h2>
              <p><span className="font-semibold">Jenis Material:</span> {selectedMaterial === 'all' ? 'Semua' : selectedMaterial}</p>
              <p><span className="font-semibold">Tanggal Masuk:</span> {selectedDate ? format(selectedDate, 'd MMMM yyyy') : 'Semua'}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card-foreground/5 no-print">
            <div className="flex-1 space-y-2">
              <Label htmlFor="material-filter">Jenis Material</Label>
              <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                <SelectTrigger id="material-filter">
                  <SelectValue placeholder="Semua Material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Material</SelectItem>
                  {materialOptions.map(material => (
                    <SelectItem key={material} value={material}>{material}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="date-filter">Tanggal Masuk</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    id="date-filter"
                    className={cn(
                      'w-full justify-start text-left font-normal border border-input bg-background h-10 px-3 py-2 text-sm rounded-md flex items-center',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pilih tanggal</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end">
              <button onClick={handleResetFilters} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">Reset Filter</button>
            </div>
          </div>
          
          {filteredUnloads.length > 0 ? (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Waktu Selesai Bongkar</TableHead>
                            <TableHead>Nama Material</TableHead>
                            <TableHead>Kapal/Kendaraan</TableHead>
                            <TableHead>Nama Kapten/Sopir</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Keterangan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUnloads.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.waktuSelesai ? new Date(item.waktuSelesai).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</TableCell>
                                <TableCell>{item.namaMaterial}</TableCell>
                                <TableCell>{item.kapalKendaraan}</TableCell>
                                <TableCell>{item.namaKaptenSopir}</TableCell>
                                <TableCell>{item.volume}</TableCell>
                                <TableCell>{item.keterangan}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>Tidak ada data pemasukan material yang cocok dengan filter Anda.</p>
              <p>Coba reset filter atau selesaikan proses bongkar di menu "Bongkar Material".</p>
            </div>
          )}
          
          {filteredUnloads.length > 0 && (
            <div className="print-only mt-8 text-sm">
                <h3 className="text-md font-bold mb-2">Total Material Masuk</h3>
                <div className="border-t-2 border-black pt-2 space-y-1">
                    {Object.entries(materialTotals).length > 0 ? (
                        Object.entries(materialTotals).map(([material, data]) => (
                            <div key={material} className="flex justify-between">
                                <span className="font-semibold">{material}:</span>
                                <span className="font-mono">{data.total.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} {data.unit}</span>
                            </div>
                        ))
                    ) : (
                        <p>Tidak ada data untuk dihitung.</p>
                    )}
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
