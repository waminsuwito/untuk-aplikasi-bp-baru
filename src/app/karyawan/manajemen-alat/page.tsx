

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, CheckCircle2, AlertTriangle, Wrench, Package, Building, Eye, ShieldAlert, FileWarning, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type TruckChecklistReport, type UserLocation, type Vehicle, type Assignment } from '@/lib/types';
import { printElement } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getUsers } from '@/lib/auth';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-provider';
import type { User } from '@/lib/types';

interface ProcessedVehicle extends Vehicle {
    operator?: {
        name: string;
        nik: string;
    };
    lastChecklistStatus?: 'BAIK' | 'RUSAK' | 'PERLU PERHATIAN' | null;
}

interface DialogInfo {
  title: string;
  vehicles?: ProcessedVehicle[];
  users?: User[];
}

const TM_CHECKLIST_COLLECTION_KEY = 'tm-checklists';
const LOADER_CHECKLIST_COLLECTION_KEY = 'loader-checklists';
const VEHICLES_STORAGE_KEY_PREFIX = 'app-vehicles-';
const ASSIGNMENTS_STORAGE_KEY_PREFIX = 'app-assignments-';


const StatCard = ({ title, value, description, icon: Icon, onClick, clickable, colorClass, asLink, href }: { title: string; value: string | number; description: string; icon: React.ElementType, onClick?: () => void, clickable?: boolean, colorClass?: string, asLink?: boolean, href?: string }) => {
    const cardContent = (
      <Card onClick={onClick} className={cn('transition-transform hover:scale-105', clickable && 'cursor-pointer hover:bg-muted/50')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", colorClass)}>{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );

    if (asLink && href) {
        return <Link href={href}>{cardContent}</Link>;
    }
    
    return cardContent;
};

export default function ManajemenAlatPage() {
  const { user } = useAuth();
  const [dialogContent, setDialogContent] = useState<DialogInfo | null>(null);
  
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [allUsers, setAllUsers] = useState<Omit<User, 'password'>[]>([]);
  const [checklistReports, setChecklistReports] = useState<TruckChecklistReport[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const loadData = useCallback(async () => {
    if (!user?.location) return;

    try {
        const getVehiclesForLocation = (location: UserLocation): Vehicle[] => {
            const key = `${VEHICLES_STORAGE_KEY_PREFIX}${location}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        };
        const vehicles = getVehiclesForLocation(user.location);
        setAllVehicles(vehicles);

        const users = await getUsers(); 
        const filteredUsers = users.map(({ password, ...rest }) => rest);
        setAllUsers(filteredUsers);
        
        const getAssignmentsForLocation = (location: UserLocation): Assignment[] => {
            const key = `${ASSIGNMENTS_STORAGE_KEY_PREFIX}${location}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        };
        const fetchedAssignments = getAssignmentsForLocation(user.location);
        setAssignments(fetchedAssignments);

        const storedTmReports = localStorage.getItem(TM_CHECKLIST_COLLECTION_KEY);
        const tmReports: TruckChecklistReport[] = storedTmReports ? JSON.parse(storedTmReports) : [];
        const storedLoaderReports = localStorage.getItem(LOADER_CHECKLIST_COLLECTION_KEY);
        const loaderReports: TruckChecklistReport[] = storedLoaderReports ? JSON.parse(storedLoaderReports) : [];

        const allReports = [...tmReports, ...loaderReports];
        const relevantReports = allReports.filter(r => r.location === user.location);
        setChecklistReports(relevantReports);

    } catch (error) {
        console.error("Failed to load management data:", error);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [loadData]);
  
 const processedVehicles = useMemo((): ProcessedVehicle[] => {
    if (!user?.location) return [];

    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const latestChecklistByUserNik: { [nik: string]: TruckChecklistReport } = {};
    checklistReports.forEach(report => {
        if (!report.userNik) return;
        if (!latestChecklistByUserNik[report.userNik] || new Date(report.timestamp) > new Date(latestChecklistByUserNik[report.userNik].timestamp)) {
            latestChecklistByUserNik[report.userNik] = report;
        }
    });

    return allVehicles.map(vehicle => {
        const assignment = assignments.find(a => a.vehicleId === vehicle.id);
        const assignedUser = assignment ? userMap.get(assignment.userId) : undefined;
        const operator = assignedUser ? { name: assignedUser.username, nik: assignedUser.nik || '' } : undefined;
        
        let finalStatus = vehicle.status;
        let lastChecklistStatus: ProcessedVehicle['lastChecklistStatus'] = null;

        if (operator?.nik && latestChecklistByUserNik[operator.nik]) {
            const checklist = latestChecklistByUserNik[operator.nik];
            const hasDamage = checklist.items.some(item => item.status === 'rusak');
            const needsAttention = checklist.items.some(item => item.status === 'perlu_perhatian');

            if (hasDamage) lastChecklistStatus = 'RUSAK';
            else if (needsAttention) lastChecklistStatus = 'PERLU PERHATIAN';
            else lastChecklistStatus = 'BAIK';
        }

        if (finalStatus === 'RUSAK BERAT') {
            // Highest priority
        } else if (lastChecklistStatus === 'RUSAK') {
            finalStatus = 'RUSAK';
        } else if (lastChecklistStatus === 'PERLU PERHATIAN') {
            finalStatus = 'PERLU PERHATIAN';
        } else if (!operator) {
            finalStatus = 'BELUM ADA SOPIR';
        } else {
            finalStatus = 'BAIK';
        }

        return { ...vehicle, status: finalStatus, operator, lastChecklistStatus };
    });
}, [allVehicles, allUsers, checklistReports, user, assignments]);

  const filteredData = useMemo(() => {
    if (!user?.location) {
      return { totalAlat: [], alatBaik: [], perluPerhatian: [], alatRusak: [], alatRusakBerat: [], belumChecklist: [], alatBaikNoOperator: [] };
    }
    
    const todaysChecklistUserNiks = new Set(
        checklistReports
            .filter(r => format(new Date(r.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
            .map(report => report.userNik)
    );

    const alatBelumChecklist = processedVehicles.filter(v => 
        v.status !== 'RUSAK BERAT' && 
        v.operator && // Must have an operator
        !todaysChecklistUserNiks.has(v.operator.nik) // Operator has not submitted a checklist today
    );

    const alatBaik = processedVehicles.filter(v => v.status === 'BAIK');
    const perluPerhatian = processedVehicles.filter(v => v.status === 'PERLU PERHATIAN');
    const alatRusak = processedVehicles.filter(v => v.status === 'RUSAK');
    const alatRusakBerat = processedVehicles.filter(v => v.status === 'RUSAK BERAT');
    const alatBaikNoOperator = processedVehicles.filter(v => v.status === 'BELUM ADA SOPIR');
    
    return {
      totalAlat: processedVehicles,
      alatBaik,
      perluPerhatian,
      alatRusak,
      alatRusakBerat,
      belumChecklist: alatBelumChecklist,
      alatBaikNoOperator,
    };
  }, [user, processedVehicles, checklistReports]);
  
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'BAIK': return 'default';
      case 'PERLU PERHATIAN': return 'secondary';
      case 'RUSAK': return 'destructive';
      case 'RUSAK BERAT': return 'destructive';
      case 'BELUM ADA SOPIR': return 'outline';
      default: return 'outline';
    }
  };

  const handleShowDialog = (title: string, vehicles: ProcessedVehicle[] = [], users: User[] = []) => {
    setDialogContent({ title, vehicles, users });
  }

  return (
    <div className="space-y-6" id="manajemen-alat-content">
      <Dialog open={!!dialogContent} onOpenChange={() => setDialogContent(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
             <DialogDescription>
                Berikut adalah daftar yang sesuai dengan kategori yang Anda pilih.
             </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        {dialogContent?.vehicles && dialogContent.vehicles.length > 0 && (
                            <>
                                <TableHead>No. Lambung</TableHead>
                                <TableHead>No. Polisi</TableHead>
                                <TableHead>Jenis Kendaraan</TableHead>
                                <TableHead>Operator/Sopir</TableHead>
                                <TableHead>NIK Operator</TableHead>
                                <TableHead>Status</TableHead>
                            </>
                        )}
                        {dialogContent?.users && dialogContent.users.length > 0 && (
                            <>
                                <TableHead>Nama Operator</TableHead>
                                <TableHead>NIK</TableHead>
                                <TableHead>Jabatan</TableHead>
                            </>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dialogContent?.vehicles?.map(vehicle => (
                        <TableRow key={vehicle.id}>
                            <TableCell>{vehicle.nomorLambung}</TableCell>
                            <TableCell>{vehicle.nomorPolisi}</TableCell>
                            <TableCell>{vehicle.jenisKendaraan}</TableCell>
                            <TableCell>{vehicle.operator?.name || '-'}</TableCell>
                            <TableCell>{vehicle.operator?.nik || '-'}</TableCell>
                            <TableCell>
                                <Badge variant={getBadgeVariant(vehicle.status)} className={cn({'bg-green-600 hover:bg-green-700 text-white': vehicle.status === 'BAIK', 'bg-amber-500 hover:bg-amber-600 text-white': vehicle.status === 'PERLU PERHATIAN' })}>
                                    {vehicle.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                    {dialogContent?.users?.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.nik}</TableCell>
                            <TableCell>{user.jabatan}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-lg">
          <Building className="h-6 w-6 text-muted-foreground" />
          <span className="font-semibold">{user?.location || 'Memuat lokasi...'}</span>
        </div>
        <Button onClick={() => printElement('manajemen-alat-content')}>
          <Printer className="mr-2 h-4 w-4" /> Print Laporan
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Alat" value={filteredData.totalAlat.length} description="Klik untuk melihat daftar" icon={Package} clickable onClick={() => handleShowDialog('Daftar Semua Alat', filteredData.totalAlat)} />
        <StatCard title="Alat Baik" value={filteredData.alatBaik.length} description="Klik untuk melihat daftar" icon={CheckCircle2} colorClass="text-green-600" clickable onClick={() => handleShowDialog('Daftar Alat Baik', filteredData.alatBaik)} />
        <StatCard title="Alat Baik, Belum Ada Oprator/Driver" value={filteredData.alatBaikNoOperator.length} description="Klik untuk melihat daftar" icon={UserX} colorClass="text-blue-600" clickable onClick={() => handleShowDialog('Alat Baik, Belum Ada Operator', filteredData.alatBaikNoOperator)} />
        <StatCard title="Perlu Perhatian" value={filteredData.perluPerhatian.length} description="Klik untuk melihat daftar" icon={AlertTriangle} colorClass="text-amber-500" clickable onClick={() => handleShowDialog('Daftar Alat Perlu Perhatian', filteredData.perluPerhatian)} />
        <StatCard title="Alat Rusak" value={filteredData.alatRusak.length} description="Klik untuk melihat daftar" icon={Wrench} colorClass="text-destructive" clickable onClick={() => handleShowDialog('Daftar Alat Rusak', filteredData.alatRusak)} />
        <StatCard title="Belum Checklist" value={filteredData.belumChecklist.length} description="Klik untuk melihat daftar" icon={FileWarning} colorClass="text-sky-600" clickable onClick={() => handleShowDialog('Daftar Kendaraan Belum Checklist', filteredData.belumChecklist)} />
        <StatCard 
            title="Alat Rusak Berat" 
            value={filteredData.alatRusakBerat.length} 
            description="Klik untuk melihat daftar" 
            icon={ShieldAlert} 
            clickable 
            asLink
            href="/karyawan/alat-rusak-berat"
            colorClass="text-destructive font-black" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Status Armada</CardTitle>
          <CardDescription>
            Daftar semua armada dan status terakhirnya di lokasi Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Lambung</TableHead>
                  <TableHead>No. Polisi</TableHead>
                  <TableHead>Jenis Kendaraan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedVehicles.length > 0 ? (
                  processedVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.nomorLambung}</TableCell>
                      <TableCell>{vehicle.nomorPolisi}</TableCell>
                      <TableCell>{vehicle.jenisKendaraan}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(vehicle.status)}
                          className={cn({
                            'bg-green-600 hover:bg-green-700 text-white': vehicle.status === 'BAIK',
                            'bg-amber-500 hover:bg-amber-600 text-white': vehicle.status === 'PERLU PERHATIAN',
                            'font-bold': vehicle.status === 'RUSAK BERAT',
                            'text-blue-800 bg-blue-100 border-blue-300': vehicle.status === 'BELUM ADA SOPIR'
                          })}
                        >
                          {vehicle.status || 'TIDAK DIKETAHUI'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Belum ada data armada untuk lokasi Anda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    