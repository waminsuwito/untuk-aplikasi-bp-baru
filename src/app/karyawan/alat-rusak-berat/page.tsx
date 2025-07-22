
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShieldX, Inbox } from 'lucide-react';
import type { Vehicle, UserLocation } from '@/lib/types';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/auth-provider';


const VEHICLES_STORAGE_KEY_PREFIX = 'app-vehicles-';

const getVehiclesForLocation = (location: UserLocation): Vehicle[] => {
    try {
        const key = `${VEHICLES_STORAGE_KEY_PREFIX}${location}`;
        const storedVehicles = localStorage.getItem(key);
        return storedVehicles ? JSON.parse(storedVehicles) : [];
    } catch (error) {
        console.error(`Failed to load vehicles for ${location}:`, error);
        return [];
    }
}

const saveVehiclesForLocation = (location: UserLocation, vehicles: Vehicle[]) => {
    try {
        const key = `${VEHICLES_STORAGE_KEY_PREFIX}${location}`;
        localStorage.setItem(key, JSON.stringify(vehicles));
    } catch (error) {
        console.error(`Failed to save vehicles for ${location}:`, error);
    }
}

export default function AlatRusakBeratPage() {
  const { user } = useAuth();
  const [heavyDamageVehicles, setHeavyDamageVehicles] = useState<Vehicle[]>([]);
  const { toast } = useToast();

  const loadHeavyDamageData = () => {
    if (!user?.location) return;
    try {
      const allVehicles = getVehiclesForLocation(user.location);
      const filtered = allVehicles.filter(v => v.status === 'RUSAK BERAT');
      setHeavyDamageVehicles(filtered);
    } catch (error) {
      console.error("Failed to load heavily damaged vehicles:", error);
      toast({ variant: 'destructive', title: 'Gagal Memuat Data', description: 'Tidak bisa memuat data alat rusak berat.' });
    }
  };

  useEffect(() => {
    loadHeavyDamageData();
    // Add event listener to react to changes from other pages
    window.addEventListener('storage', loadHeavyDamageData);
    return () => window.removeEventListener('storage', loadHeavyDamageData);
  }, [user]);

  const handleReleaseVehicle = (vehicleId: string) => {
    if (!user?.location) return;
    try {
      let allVehicles = getVehiclesForLocation(user.location);
      
      const updatedVehicles = allVehicles.map(v => 
        v.id === vehicleId ? { ...v, status: 'BAIK' } : v
      );

      saveVehiclesForLocation(user.location, updatedVehicles);
      
      loadHeavyDamageData(); // Reload the list on this page
      
      toast({
        title: 'Alat Dikeluarkan',
        description: 'Alat telah dikeluarkan dari daftar rusak berat dan statusnya diubah menjadi "BAIK".',
      });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal mengeluarkan alat dari daftar.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Daftar Alat dengan Kerusakan Berat</CardTitle>
          <Button asChild variant="outline">
            <Link href="/karyawan/manajemen-alat">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
        </div>
        <CardDescription>
            Kelola daftar alat yang memerlukan perhatian khusus atau perbaikan besar. Alat yang dikeluarkan akan berstatus "BAIK".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NOMOR LAMBUNG</TableHead>
                <TableHead>NOMOR POLISI</TableHead>
                <TableHead>JENIS KENDARAAN</TableHead>
                <TableHead>STATUS ALAT</TableHead>
                <TableHead className="text-center text-red-600 font-bold">KELUARKAN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {heavyDamageVehicles.length > 0 ? (
                heavyDamageVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.nomorLambung}</TableCell>
                    <TableCell>{vehicle.nomorPolisi}</TableCell>
                    <TableCell>{vehicle.jenisKendaraan}</TableCell>
                    <TableCell className="font-semibold text-destructive">{vehicle.status}</TableCell>
                    <TableCell className="text-center">
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <ShieldX className="mr-2 h-4 w-4" />
                                Keluarkan
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Konfirmasi</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Apakah Anda yakin ingin mengeluarkan alat ini dari daftar kerusakan berat? Alat ini akan kembali ke pemantauan normal dengan status "BAIK".
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleReleaseVehicle(vehicle.id)}>
                                      Ya, Keluarkan
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <Inbox className="mx-auto h-12 w-12" />
                    <p className="mt-2">Tidak ada alat dalam daftar kerusakan berat saat ini.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
