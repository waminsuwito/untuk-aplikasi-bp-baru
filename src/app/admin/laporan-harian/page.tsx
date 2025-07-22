
// This page is now unlinked for the ADMIN LOGISTIK role.
// The content is kept to avoid breaking changes for other roles that might use it.

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Printer } from 'lucide-react';

import { cn, printElement } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Input } from '@/components/ui/input';
import { getSchedules } from '@/lib/schedule';

const initialRowData = {
  lokasi: '',
  mutu: '',
  slump: '',
  volume: '',
  realisasi: '',
  pakaiPasir: '',
  pakaiBatu: '',
  pakaiSemen: '',
  pakaiAir: '',
  stokPasir: '',
  stokBatu: '',
  stokSemen: '',
  stokAir: '',
};

export default function LaporanHarianPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tableData, setTableData] = useState(
    Array.from({ length: 10 }, () => ({ ...initialRowData }))
  );

  useEffect(() => {
    if (!date) return;

    const allSchedules = getSchedules();
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    const todaysSchedules = allSchedules.filter(s => s.date === selectedDateStr);

    const newTableData = todaysSchedules.map(schedule => ({
      ...initialRowData,
      lokasi: schedule.customerName,
      mutu: schedule.concreteQuality,
      slump: schedule.slump,
      volume: schedule.volume,
    }));

    const emptyRowCount = 10 - newTableData.length;
    if (emptyRowCount > 0) {
      for (let i = 0; i < emptyRowCount; i++) {
        newTableData.push({ ...initialRowData });
      }
    }

    setTableData(newTableData.slice(0, 10));
  }, [date]);

  const handleInputChange = (
    rowIndex: number,
    columnId: keyof typeof initialRowData,
    value: string
  ) => {
    const newData = [...tableData];
    newData[rowIndex][columnId] = value.toUpperCase();
    setTableData(newData);
  };
  
  return (
    <div className="space-y-4">
      <Card id="print-content">
        <CardHeader>
          <CardTitle>Laporan Harian Produksi</CardTitle>
          <CardDescription>
            Halaman ini tidak lagi digunakan untuk peran Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
              <p>Halaman ini telah digantikan oleh menu baru di sidebar.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
