
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import type { DateRange } from 'react-day-picker';
import { addDays, format, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { CalendarIcon, Search, Printer, Inbox, Image as ImageIcon, FileText, Clock } from 'lucide-react';
import { getUsers } from '@/lib/auth';
import { printElement, cn } from '@/lib/utils';
import type { User, DailyActivityReport, DailyActivity } from '@/lib/types';
import { useAuth } from '@/context/auth-provider';
import Image from 'next/image';

const GLOBAL_ACTIVITIES_KEY = 'app-daily-activities';

interface DisplayRecord {
  key: string;
  date: string; // "d MMM yyyy" format
  dateObj: Date;
  nik: string;
  nama: string;
  location: string;
  pagi: DailyActivity | null;
  siang: DailyActivity | null;
  lembur: DailyActivity | null;
}

export default function RangkumanKegiatanKaryawanPage() {
  const { user: adminUser } = useAuth();
  const [allKaryawan, setAllKaryawan] = useState<User[]>([]);
  const [allActivities, setAllActivities] = useState<DailyActivityReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  
  useEffect(() => {
    try {
      const users = getUsers();
      const filteredKaryawan = users.filter(u => 
        u.role === 'karyawan' && 
        (adminUser?.role === 'super_admin' || u.location === adminUser?.location)
      );
      setAllKaryawan(filteredKaryawan);

      const storedData = localStorage.getItem(GLOBAL_ACTIVITIES_KEY);
      if (storedData) {
        setAllActivities(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }, [adminUser]);

  const generatedRecords = useMemo(() => {
    const records: DisplayRecord[] = [];
    if (!date?.from || !allKaryawan.length) return [];

    const from = startOfDay(date.from);
    const to = date.to ? startOfDay(date.to) : from;
    
    for (let day = from; day <= to; day = addDays(day, 1)) {
      const dateStrYmd = format(day, 'yyyy-MM-dd');
      const dateStrDisplay = format(day, 'd MMM yyyy', { locale: localeID });

      for (const karyawan of allKaryawan) {
        if (!karyawan.nik) continue;

        const activityReport = allActivities.find(
          act => act.nik === karyawan.nik && act.date === dateStrYmd
        );

        records.push({
          key: `${karyawan.nik}-${dateStrYmd}`,
          date: dateStrDisplay,
          dateObj: day,
          nik: karyawan.nik,
          nama: karyawan.username,
          location: karyawan.location || '-',
          pagi: activityReport?.pagi?.timestamp ? activityReport.pagi : null,
          siang: activityReport?.siang?.timestamp ? activityReport.siang : null,
          lembur: activityReport?.lembur?.timestamp ? activityReport.lembur : null,
        });
      }
    }
    return records;
  }, [date, allKaryawan, allActivities]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) {
      return generatedRecords;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return generatedRecords.filter(
      (r) =>
        r.nama.toLowerCase().includes(lowercasedFilter) ||
        r.nik.toLowerCase().includes(lowercasedFilter)
    );
  }, [generatedRecords, searchTerm]);

  const displayRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
        const dateA = a.dateObj.getTime();
        const dateB = b.dateObj.getTime();
        
        if (dateA !== dateB) {
            return dateB - dateA; // Sort by date descending
        }
        return a.nama.localeCompare(b.nama); // Then by name ascending
    });
  }, [filteredRecords]);

  const renderActivityCell = (activity: DailyActivity | null, sessionName: string) => {
    if (!activity) {
      return <span className="text-muted-foreground text-xs italic">Tidak ada laporan</span>;
    }
    return (
      <div className="space-y-1">
        <p className="whitespace-pre-wrap text-sm">{activity.text}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {activity.timestamp && (
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(activity.timestamp), 'HH:mm')}</span>
            )}
            {activity.photo && (
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-1 text-primary hover:underline no-print">
                            <ImageIcon className="h-3 w-3" /> Lihat Foto
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0">
                        <Image src={activity.photo} alt={`Foto Kegiatan ${sessionName}`} width={1200} height={900} className="rounded-lg object-contain w-full h-auto" />
                    </DialogContent>
                </Dialog>
            )}
        </div>
      </div>
    );
  };

  return (
    <Card id="print-content">
      <CardHeader className="no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Rangkuman Kegiatan Karyawan
            </CardTitle>
            <CardDescription>
              Lihat riwayat laporan kegiatan harian dari semua karyawan.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari NIK atau Nama..."
                className="pl-8 w-full md:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "d LLL, y")} -{" "}
                        {format(date.to, "d LLL, y")}
                      </>
                    ) : (
                      format(date.from, "d LLL, y")
                    )
                  ) : (
                    <span>Pilih rentang tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={localeID}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={() => printElement('print-content')}>
              <Printer className="mr-2 h-4 w-4" /> Cetak
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="print-only mb-6 text-center">
            <h1 className="text-xl font-bold">Rangkuman Kegiatan Karyawan</h1>
            <p className="text-sm">Lokasi: {adminUser?.location || 'Semua Lokasi'}</p>
            <p className="text-sm">
                Tanggal: {date?.from ? format(date.from, 'd MMM yyyy') : ''}
                {date?.to ? ` - ${format(date.to, 'd MMM yyyy')}` : ''}
            </p>
            {searchTerm.trim() && <p className="text-sm">Filter Karyawan: {searchTerm}</p>}
        </div>
        {displayRecords.length > 0 ? (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Nama Karyawan</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Kegiatan Pagi</TableHead>
                  <TableHead>Kegiatan Siang</TableHead>
                  <TableHead>Kegiatan Lembur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRecords.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell className="font-medium whitespace-nowrap">{item.date}</TableCell>
                    <TableCell>{item.nik}</TableCell>
                    <TableCell>{item.nama}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell className="align-top">{renderActivityCell(item.pagi, 'Pagi')}</TableCell>
                    <TableCell className="align-top">{renderActivityCell(item.siang, 'Siang')}</TableCell>
                    <TableCell className="align-top">{renderActivityCell(item.lembur, 'Lembur')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <Inbox className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Tidak Ada Data</h3>
            <p className="mt-1 text-sm">
              Tidak ada laporan kegiatan yang ditemukan untuk filter yang dipilih.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
