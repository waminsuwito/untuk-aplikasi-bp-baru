
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Trash2, Printer, ShieldX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { printElement } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { userLocations, type UserLocation, type Vehicle } from '@/lib/types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/context/auth-provider';


const TOTAL_ROWS = 300;
const VEHICLES_STORAGE_KEY_PREFIX = 'app-vehicles-';

type TableRowData = Partial<Vehicle>;

const fields: (keyof Omit<Vehicle, 'id'>)[] = ['nomorLambung', 'nomorPolisi', 'jenisKendaraan', 'status', 'location'];
const headers = ['NOMOR LAMBUNG', 'NOMOR POLISI', 'JENIS KENDARAAN', 'STATUS', 'MUTASI KENDARAAN'];

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

export function EditableVehicleList() {
  const { user } = useAuth();
  const [tableData, setTableData] = useState<TableRowData[]>(Array(TOTAL_ROWS).fill({}));
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [mutationDetails, setMutationDetails] = useState<{
    rowIndex: number;
    vehicleId: string;
    nomorPolisi: string;
    newLocation: UserLocation;
  } | null>(null);

  const loadData = useCallback(() => {
    if (!user?.location) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const storedVehicles = getVehiclesForLocation(user.location);
      const initialData = Array(TOTAL_ROWS).fill({});
      storedVehicles.forEach((vehicle, index) => {
        if (index < TOTAL_ROWS) {
          initialData[index] = vehicle;
        }
      });
      setTableData(initialData);
    } catch (error) {
      console.error("Failed to load vehicles:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat data armada.' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInputChange = (index: number, field: keyof Vehicle, value: string) => {
    const updatedData = [...tableData];
    updatedData[index] = { ...updatedData[index], [field]: value.toUpperCase() };
    setTableData(updatedData);
  };
  
  const handleSelectChange = (index: number, field: keyof Vehicle, value: string) => {
    if (field === 'location') {
        const vehicle = tableData[index];
        if (vehicle.id && vehicle.nomorPolisi) {
            setMutationDetails({
                rowIndex: index,
                vehicleId: vehicle.id,
                nomorPolisi: vehicle.nomorPolisi,
                newLocation: value as UserLocation,
            });
        }
    } else {
        const updatedData = [...tableData];
        updatedData[index] = { ...updatedData[index], [field]: value };
        setTableData(updatedData);
    }
  };

  const handleConfirmMutation = () => {
    if (!mutationDetails || !user?.location) return;
    const { vehicleId, nomorPolisi, newLocation, rowIndex } = mutationDetails;
    
    try {
      // Get the vehicle data to move
      const sourceVehicles = getVehiclesForLocation(user.location);
      const vehicleToMove = sourceVehicles.find(v => v.id === vehicleId);

      if (!vehicleToMove) {
        throw new Error("Vehicle not found in source location.");
      }
      
      const movedVehicleData = { ...vehicleToMove, location: newLocation };
      const remainingSourceVehicles = sourceVehicles.filter(v => v.id !== vehicleId);
      
      // Add to destination
      const destVehicles = getVehiclesForLocation(newLocation);
      const updatedDestVehicles = [...destVehicles, movedVehicleData];

      // Save both locations
      saveVehiclesForLocation(user.location, remainingSourceVehicles);
      saveVehiclesForLocation(newLocation, updatedDestVehicles);

      toast({ title: 'Mutasi Berhasil', description: `Kendaraan ${nomorPolisi} telah dipindahkan ke ${newLocation}.` });
      
      setMutationDetails(null);
      loadData(); // Reload data for the current page
    } catch (error) {
      console.error("Failed to mutate vehicle:", error);
      toast({ variant: 'destructive', title: 'Gagal Mutasi', description: 'Terjadi kesalahan saat memindahkan data kendaraan.' });
    }
  };

  const handleDeleteRow = (index: number) => {
    const updatedData = [...tableData];
    updatedData.splice(index, 1);
    updatedData.push({});
    setTableData(updatedData);
    toast({
      variant: 'destructive',
      title: 'Baris Dihapus',
      description: 'Data baris telah dihapus dari tampilan. Klik "Simpan" untuk menyimpan perubahan.',
    });
  };

  const handleSaveData = () => {
    if (!user?.location) return;
    setIsLoading(true);

    const activeRows = tableData.filter(
      row => (row.nomorPolisi && row.nomorPolisi.trim() !== '') || (row.nomorLambung && row.nomorLambung.trim() !== '')
    );
  
    for (const row of activeRows) {
      if (!row.nomorLambung?.trim() || !row.nomorPolisi?.trim() || !row.jenisKendaraan?.trim()) {
        toast({
          variant: 'destructive',
          title: 'Data Tidak Lengkap',
          description: `DATA KENDARAAN BELUM LENGKAP PADA BARIS DENGAN No.Pol ${row.nomorPolisi || '???'}, SILAKAN LENGKAPI UNTUK MENYIMPAN`,
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      const vehiclesToSave: Vehicle[] = activeRows.map(row => ({
          nomorLambung: row.nomorLambung || '',
          nomorPolisi: row.nomorPolisi || '',
          jenisKendaraan: row.jenisKendaraan || '',
          status: row.status || 'BAIK',
          location: user.location,
          id: row.id || `${row.nomorPolisi}-${Date.now()}`,
      }));

      saveVehiclesForLocation(user.location, vehiclesToSave);

      toast({ title: 'Berhasil', description: 'Semua perubahan telah disimpan.' });
      loadData();
    } catch (error) {
      console.error("Failed to save vehicles:", error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat menyimpan data.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearAllData = () => {
    if (!user?.location) return;
    setIsLoading(true);
    try {
        saveVehiclesForLocation(user.location, []);
        toast({ variant: 'destructive', title: 'Berhasil', description: `Semua data armada di lokasi ${user.location} telah dihapus.` });
        loadData();
    } catch (error) {
        console.error("Failed to clear vehicles:", error);
        toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus data armada.' });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>, rowIndex: number, colIndex: number) => {
    // This logic can remain the same
  };


  if (isLoading) {
    return (
        <div className="p-4 space-y-2">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  return (
    <>
        <AlertDialog open={!!mutationDetails} onOpenChange={() => setMutationDetails(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Mutasi Kendaraan</AlertDialogTitle>
                <AlertDialogDescription>
                    Apakah Anda yakin akan memutasi kendaraan dengan nomor polisi 
                    <span className="font-bold"> {mutationDetails?.nomorPolisi} </span> 
                    ke lokasi <span className="font-bold">{mutationDetails?.newLocation}</span>?
                    <br/><br/>
                    Tindakan ini akan memindahkan kendaraan dari daftar di lokasi saat ini.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setMutationDetails(null)}>Tidak</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmMutation}>Yakin</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


        <div id="editable-vehicle-list" className="flex flex-col h-full bg-background">
            <div className="flex-shrink-0 p-4 border-b bg-background flex justify-between items-center no-print">
                <h2 className="text-lg font-semibold">List Armada (Lokasi: {user?.location})</h2>
                <div className="flex gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <ShieldX className="mr-2 h-4 w-4" /> Hapus Semua Armada
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tindakan ini akan menghapus **SEMUA** data armada di lokasi **{user?.location}** secara permanen. Data tidak dapat dipulihkan. Lanjutkan?
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleClearAllData}>
                                Ya, Hapus Semua
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={() => printElement('editable-vehicle-list-table-container')}>
                        <Printer className="mr-2 h-4 w-4" /> Cetak
                    </Button>
                    <Button onClick={handleSaveData}>
                        <Save className="mr-2 h-4 w-4" /> Simpan Semua Perubahan
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-grow">
                <div id="editable-vehicle-list-table-container" className="bg-white text-black p-2">
                    <h2 className="text-2xl font-bold text-center mb-4 text-black print-only">LIST ARMADA - {user?.location}</h2>
                    <Table className="w-full border-collapse">
                    <TableHeader>
                        <TableRow className="bg-gray-200">
                        {headers.map(header => (
                            <TableHead key={header} className="border border-gray-400 p-2 text-center font-bold text-black">{header}</TableHead>
                        ))}
                        <TableHead className="border border-gray-400 p-2 text-center font-bold text-black no-print">AKSI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableData.map((row, index) => (
                        <TableRow key={row.id || `row-${index}`} className="[&_td]:p-0 [&_td]:border-gray-400">
                            {fields.map((field, colIndex) => (
                                <TableCell key={field} className="border">
                                    {field === 'location' ? (
                                        <Select
                                            value={row[field] || user?.location || ''}
                                            onValueChange={(value) => handleSelectChange(index, field, value)}
                                        >
                                            <SelectTrigger
                                                id={`${field}-${index}`}
                                                className="w-full h-full border-none rounded-none text-center bg-transparent text-black focus:ring-0"
                                                onKeyDown={(e) => handleKeyDown(e as any, index, colIndex)}
                                            >
                                                <SelectValue placeholder="Pilih Lokasi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {userLocations.map(location => (
                                                    <SelectItem key={location} value={location}>
                                                        {location}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id={`${field}-${index}`}
                                            value={row[field] || ''}
                                            onChange={(e) => handleInputChange(index, field as keyof Vehicle, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index, colIndex)}
                                            className="w-full h-full border-none rounded-none text-center bg-transparent text-black"
                                            style={{ textTransform: 'uppercase' }}
                                            placeholder={field === 'status' ? 'Otomatis dari checklist' : ''}
                                            readOnly={field === 'status'}
                                        />
                                    )}
                                </TableCell>
                            ))}
                            <TableCell className="border text-center no-print">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={!row.nomorPolisi && !row.nomorLambung}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus baris ini? Perubahan akan permanen setelah Anda menekan tombol 'Simpan'.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteRow(index)}>
                                        Ya, Hapus
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            </ScrollArea>
        </div>
    </>
  );
}
