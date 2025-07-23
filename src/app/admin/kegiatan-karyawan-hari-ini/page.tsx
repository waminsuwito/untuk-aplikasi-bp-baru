
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-provider';
import type { DailyActivityReport, DailyActivity } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
import { ClipboardList, User, Image as ImageIcon, Inbox, Clock, Printer, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { printElement } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


const ACTIVITIES_COLLECTION = 'daily-activity-reports';

export default function KegiatanKaryawanHariIniPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyActivityReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<DailyActivityReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const reportsRef = collection(firestore, ACTIVITIES_COLLECTION);
            
            const q = query(
                reportsRef, 
                where('date', '==', today), 
                where('location', '==', user.location)
            );
            
            const querySnapshot = await getDocs(q);
            const fetchedReports: DailyActivityReport[] = [];
            querySnapshot.forEach((doc) => {
                fetchedReports.push(doc.data() as DailyActivityReport);
            });
            setReports(fetchedReports);
        } catch (error) {
          console.error("Failed to load activity data from Firestore", error);
        }
    }

    fetchReports();

  }, [user]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredReports(reports);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = reports.filter(report =>
        report.username.toLowerCase().includes(lowercasedFilter) ||
        (report.nik && report.nik.toLowerCase().includes(lowercasedFilter))
      );
      setFilteredReports(filtered);
    }
  }, [searchTerm, reports]);
  
  const renderActivityDetail = (activity: DailyActivity | undefined, sessionName: string) => {
    if (!activity?.timestamp) {
        return <p className="text-sm text-muted-foreground italic pl-2">Belum ada laporan.</p>
    }
    return (
        <div className="pl-2 space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Dilaporkan pada: {format(new Date(activity.timestamp), "HH:mm 'WIB'", { locale: id })}
            </p>
            <p className="whitespace-pre-wrap">{activity.text}</p>
            {activity.photo && (
                <Dialog>
                    <DialogTrigger asChild>
                    <button className="flex items-center gap-2 text-primary hover:underline text-sm no-print">
                        <ImageIcon className="h-4 w-4" /> Lihat Foto {sessionName}
                    </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0">
                        <DialogHeader className="sr-only">
                          <DialogTitle>Foto Kegiatan: {sessionName}</DialogTitle>
                          <DialogDescription>
                            Lampiran foto untuk laporan kegiatan sesi {sessionName}.
                          </DialogDescription>
                        </DialogHeader>
                        <Image src={activity.photo} alt={`Foto ${sessionName}`} width={1200} height={900} className="rounded-lg object-contain w-full h-auto" />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
  }

  return (
    <Card>
      <CardHeader className="no-print">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              Kegiatan Karyawan Hari Ini
            </CardTitle>
            <CardDescription>
              Laporan kegiatan karyawan untuk lokasi {user?.location || '...'} pada tanggal: {tanggalHariIni}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
            <Button onClick={() => printElement('print-content')}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div id="print-content" className="print-content-container">
            <div className="print-only mb-6 text-center">
                <h1 className="text-xl font-bold">Laporan Kegiatan Harian</h1>
                <p className="text-sm">Lokasi: {user?.location || '...'}</p>
                <p className="text-sm">Tanggal: {tanggalHariIni}</p>
            </div>

            {filteredReports.length > 0 ? (
            <>
                <div className="no-print">
                    <Accordion type="multiple" className="w-full">
                    {filteredReports.map((report) => (
                        <AccordionItem key={report.userId} value={report.userId}>
                        <AccordionTrigger>
                            <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold text-left">{report.username}</p>
                                <p className="text-xs text-muted-foreground font-normal">NIK: {report.nik}</p>
                            </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pl-8">
                            <div className="space-y-2">
                            <h4 className="font-semibold">Sesi Pagi</h4>
                            {renderActivityDetail(report.pagi, 'Pagi')}
                            </div>
                            <div className="space-y-2">
                            <h4 className="font-semibold">Sesi Siang</h4>
                            {renderActivityDetail(report.siang, 'Siang')}
                            </div>
                            <div className="space-y-2">
                            <h4 className="font-semibold">Sesi Lembur</h4>
                            {renderActivityDetail(report.lembur, 'Lembur')}
                            </div>
                        </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                </div>
                
                <div className="print-only">
                <Table className="text-xs border">
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px] px-2 py-1 border font-bold text-black">No.</TableHead>
                        <TableHead className="px-2 py-1 border font-bold text-black">Nama Karyawan</TableHead>
                        <TableHead className="px-2 py-1 border font-bold text-black">NIK</TableHead>
                        <TableHead className="w-[25%] px-2 py-1 border font-bold text-black">Kegiatan Pagi</TableHead>
                        <TableHead className="w-[25%] px-2 py-1 border font-bold text-black">Kegiatan Siang</TableHead>
                        <TableHead className="w-[25%] px-2 py-1 border font-bold text-black">Kegiatan Lembur</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredReports.map((report, index) => (
                        <TableRow key={report.userId}>
                        <TableCell className="text-center px-2 py-1 border">{index + 1}</TableCell>
                        <TableCell className="px-2 py-1 border">{report.username}</TableCell>
                        <TableCell className="px-2 py-1 border">{report.nik}</TableCell>
                        <TableCell className="align-top px-2 py-1 border">
                            {report.pagi?.timestamp ? (
                            <>
                                <p className="text-gray-600">
                                {format(new Date(report.pagi.timestamp), "HH:mm", { locale: id })}
                                </p>
                                <p className="whitespace-pre-wrap">{report.pagi.text}</p>
                            </>
                            ) : (
                            <span className="text-gray-500 italic">Belum ada laporan.</span>
                            )}
                        </TableCell>
                        <TableCell className="align-top px-2 py-1 border">
                            {report.siang?.timestamp ? (
                            <>
                                <p className="text-gray-600">
                                {format(new Date(report.siang.timestamp), "HH:mm", { locale: id })}
                                </p>
                                <p className="whitespace-pre-wrap">{report.siang.text}</p>
                            </>
                            ) : (
                            <span className="text-gray-500 italic">Belum ada laporan.</span>
                            )}
                        </TableCell>
                        <TableCell className="align-top px-2 py-1 border">
                            {report.lembur?.timestamp ? (
                            <>
                                <p className="text-gray-600">
                                {format(new Date(report.lembur.timestamp), "HH:mm", { locale: id })}
                                </p>
                                <p className="whitespace-pre-wrap">{report.lembur.text}</p>
                            </>
                            ) : (
                            <span className="text-gray-500 italic">Belum ada laporan.</span>
                            )}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            </>
            ) : (
            <div className="text-center text-muted-foreground py-16">
                <Inbox className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Belum Ada Laporan</h3>
                <p className="mt-1 text-sm">
                    {searchTerm ? 'Tidak ada karyawan yang cocok dengan pencarian Anda.' : 'Belum ada laporan kegiatan dari karyawan di lokasi Anda untuk hari ini.'}
                </p>
            </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
