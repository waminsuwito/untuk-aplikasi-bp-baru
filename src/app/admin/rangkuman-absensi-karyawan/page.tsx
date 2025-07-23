
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { addDays, format, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { CalendarIcon, Search, Printer, UserX, BarChart3 } from 'lucide-react';
import { getUsers } from '@/lib/auth';
import { printElement } from '@/lib/utils';
import type { User, GlobalAttendanceRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-provider';
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';


interface DisplayRecord {
  key: string;
  date: string;
  nik: string;
  nama: string;
  location: string;
  status: 'Hadir' | 'Tidak Masuk Kerja';
  absenMasuk: string;
  terlambat: string;
  absenPulang: string;
  lembur: string;
}

export default function RangkumanAbsensiKaryawanPage() {
  const { user: adminUser } = useAuth();
  const [allKaryawan, setAllKaryawan] = useState<User[]>([]);
  const [allAttendance, setAllAttendance] = useState<GlobalAttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  
  useEffect(() => {
    async function fetchData() {
        try {
            const users = await getUsers();
            const filteredKaryawan = users.filter(u => 
                u.role === 'karyawan' && 
                (adminUser?.role === 'super_admin' || u.location === adminUser?.location)
            );
            setAllKaryawan(filteredKaryawan);
        } catch (error) {
            console.error("Failed to load users:", error);
        }
    }
    fetchData();
  }, [adminUser]);

  useEffect(() => {
    async function fetchAttendance() {
        if (!date?.from) return;

        const attendanceCollectionRef = collection(firestore, 'attendance-records');
        const q = query(
            attendanceCollectionRef, 
            where('date', '>=', format(date.from, 'yyyy-MM-dd')),
            where('date', '<=', format(date.to || date.from, 'yyyy-MM-dd'))
        );

        const querySnapshot = await getDocs(q);
        const records: GlobalAttendanceRecord[] = [];
        querySnapshot.forEach((doc) => {
            records.push(doc.data() as GlobalAttendanceRecord);
        });
        setAllAttendance(records);
    }
    fetchAttendance();
  }, [date]);


  const generatedRecords = useMemo(() => {
    const records: DisplayRecord[] = [];
    if (!date?.from || !allKaryawan.length) return [];

    const from = startOfDay(date.from);
    const to = date.to ? startOfDay(date.to) : from;
    
    // Iterate through each day in the selected range
    for (let day = from; day <= to; day = addDays(day, 1)) {
        const dateStr = format(day, 'yyyy-MM-dd');

        // Iterate through each employee
        for (const karyawan of allKaryawan) {
            if (!karyawan.nik) continue;

            // Find attendance record for this employee on this day
            const attendanceRecord = allAttendance.find(
                att => att.nik === karyawan.nik && att.date === dateStr
            );
            
            if (attendanceRecord) {
                records.push({
                    key: `${karyawan.nik}-${dateStr}`,
                    date: format(day, 'd MMM yyyy', { locale: localeID }),
                    nik: karyawan.nik,
                    nama: karyawan.username,
                    location: attendanceRecord.location,
                    status: 'Hadir',
                    absenMasuk: attendanceRecord.absenMasuk ? new Date(attendanceRecord.absenMasuk).toLocaleTimeString('id-ID') : '-',
                    terlambat: attendanceRecord.terlambat || '-',
                    absenPulang: attendanceRecord.absenPulang ? new Date(attendanceRecord.absenPulang).toLocaleTimeString('id-ID') : '-',
                    lembur: attendanceRecord.lembur || '-',
                });
            } else {
                 records.push({
                    key: `${karyawan.nik}-${dateStr}`,
                    date: format(day, 'd MMM yyyy', { locale: localeID }),
                    nik: karyawan.nik,
                    nama: karyawan.username,
                    location: karyawan.location || '-',
                    status: 'Tidak Masuk Kerja',
                    absenMasuk: '-',
                    terlambat: '-',
                    absenPulang: '-',
                    lembur: '-',
                });
            }
        }
    }
    return records;
  }, [date, allKaryawan, allAttendance]);

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
        // Custom parser for "d MMM yyyy" format is needed because new Date() can be unreliable
        const parseDate = (dateStr: string) => {
            const parts = dateStr.split(' '); // e.g., ["1", "Agu", "2024"]
            if (parts.length !== 3) return new Date(0);
            
            const day = parseInt(parts[0], 10);
            const year = parseInt(parts[2], 10);
            
            // A map is more reliable than parsing month names
            const monthMap: { [key: string]: number } = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5,
                'Jul': 6, 'Agu': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11
            };
            const month = monthMap[parts[1]];

            if (isNaN(day) || isNaN(year) || month === undefined) return new Date(0);
            return new Date(year, month, day);
        };

        const dateA = parseDate(a.date).getTime();
        const dateB = parseDate(b.date).getTime();
        
        if (dateA !== dateB) {
            return dateB - dateA; // Sort by date descending
        }
        return a.nama.localeCompare(b.nama); // Then by name ascending
    });
  }, [filteredRecords]);

  const summaryStats = useMemo(() => {
    if (!searchTerm.trim() || filteredRecords.length === 0) {
      return null;
    }
    
    // Check if all filtered records belong to the same person
    const uniqueNiks = new Set(filteredRecords.map(r => r.nik));
    if (uniqueNiks.size !== 1) {
      return null;
    }

    const masuk = filteredRecords.filter(r => r.status === 'Hadir').length;
    const alpha = filteredRecords.filter(r => r.status === 'Tidak Masuk Kerja').length;
    const terlambat = filteredRecords.filter(r => r.terlambat !== '-').length;

    return { masuk, alpha, terlambat };
  }, [searchTerm, filteredRecords]);


  return (
    <Card id="print-content">
      <CardHeader className="no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Rangkuman Absensi Karyawan
              </CardTitle>
              <CardDescription>
                Lihat riwayat absensi karyawan. Karyawan yang tidak absen akan ditandai "Tidak Masuk Kerja".
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
            <h1 className="text-xl font-bold">Rangkuman Absensi Karyawan</h1>
            <p className="text-sm">Lokasi: {adminUser?.location || 'Semua Lokasi'}</p>
            <p className="text-sm">
                Tanggal: {date?.from ? format(date.from, 'd MMM yyyy') : ''}
                {date?.to ? ` - ${format(date.to, 'd MMM yyyy')}` : ''}
            </p>
            {searchTerm.trim() && <p className="text-sm">Filter Karyawan: {searchTerm}</p>}
        </div>
        {displayRecords.length > 0 ? (
          <>
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>NIK</TableHead>
                    <TableHead>Nama Karyawan</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jam Masuk</TableHead>
                    <TableHead>Jam Pulang</TableHead>
                    <TableHead>Terlambat</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {displayRecords.map((item) => (
                    <TableRow key={item.key}>
                        <TableCell className="font-medium whitespace-nowrap">{item.date}</TableCell>
                        <TableCell>{item.nik}</TableCell>
                        <TableCell>{item.nama}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>
                        <Badge variant={item.status === 'Hadir' ? 'secondary' : 'destructive'}>
                            {item.status}
                        </Badge>
                        </TableCell>
                        <TableCell>{item.absenMasuk}</TableCell>
                        <TableCell>{item.absenPulang}</TableCell>
                        <TableCell>{item.terlambat !== '-' ? <Badge variant="destructive">{item.terlambat}</Badge> : '-'}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>

            {summaryStats && (
              <div className="print-only mt-8 border-t-2 border-black pt-4 break-inside-avoid">
                <h3 className="text-base font-bold mb-2">Rangkuman untuk: {filteredRecords[0].nama} (NIK: {filteredRecords[0].nik})</h3>
                <Table className="w-auto text-sm border">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-black font-bold border px-2 py-1">Keterangan</TableHead>
                            <TableHead className="text-black font-bold border text-right px-2 py-1">Jumlah</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="border px-2 py-1">Total Masuk Kerja</TableCell>
                            <TableCell className="border text-right px-2 py-1">{summaryStats.masuk} hari</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="border px-2 py-1">Total Tidak Masuk (Alpha)</TableCell>
                            <TableCell className="border text-right px-2 py-1">{summaryStats.alpha} hari</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="border px-2 py-1">Total Keterlambatan</TableCell>
                            <TableCell className="border text-right px-2 py-1">{summaryStats.terlambat} kali</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <UserX className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Tidak Ada Data</h3>
            <p className="mt-1 text-sm">
                Tidak ada data absensi yang ditemukan untuk filter yang dipilih.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
