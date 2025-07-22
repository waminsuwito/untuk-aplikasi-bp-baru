'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Trash2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { printElement } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { userLocations, type UserLocation, type Vehicle } from '@/lib/types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/context/auth-provider';

const VEHICLES_STORAGE_KEY_PREFIX = 'app-vehicles-';
const TOTAL_ROWS = 300;

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

  const loadData = () => {
    if (!user?.location) {
        setIsLoading(false);
        return;
    }
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
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

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

    // Remove from current location's list
    let currentVehicles = getVehiclesForLocation(user.location);
    const vehicleToMove = currentVehicles.find(v => v.id === mutationDetails.vehicleId);
    const updatedCurrentVehicles = currentVehicles.filter(v => v.id !== mutationDetails.vehicleId);
    saveVehiclesForLocation(user.location, updatedCurrentVehicles);

    // Add to new location's list
    if (vehicleToMove) {
        let destinationVehicles = getVehiclesForLocation(mutationDetails.newLocation);
        // Update vehicle's own location property before adding
        const movedVehicle = { ...vehicleToMove, location: mutationDetails.newLocation };
        destinationVehicles.push(movedVehicle);
        saveVehiclesForLocation(mutationDetails.newLocation, destinationVehicles);
    }

    toast({ title: 'Mutasi Berhasil', description: `Kendaraan ${mutationDetails.nomorPolisi} telah dipindahkan ke ${mutationDetails.newLocation}.` });
    
    // Reset dialog and reload data for current page
    setMutationDetails(null);
    loadData();
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

    const activeRows = tableData.filter(
      row => (row.nomorPolisi && row.nomorPolisi.trim() !== '') || (row.nomorLambung && row.nomorLambung.trim() !== '')
    );
  
    // Validation check
    for (const row of activeRows) {
      if (!row.nomorLambung?.trim() || !row.nomorPolisi?.trim() || !row.jenisKendaraan?.trim()) {
        toast({
          variant: 'destructive',
          title: 'Data Tidak Lengkap',
          description: 'DATA KENDARAAN BELUM LENGKAP, SILAKAN LENGKAPI UNTUK MENYIMPAN',
        });
        return; // Stop the save process
      }
    }

    try {
      const vehiclesToSave = activeRows
        .map((vehicleData) => ({
          nomorLambung: vehicleData.nomorLambung || '',
          nomorPolisi: vehicleData.nomorPolisi || '',
          jenisKendaraan: vehicleData.jenisKendaraan || '',
          status: vehicleData.status || '',
          location: vehicleData.location || user.location,
          id: vehicleData.id || new Date().toISOString() + Math.random(),
        } as Vehicle));

      saveVehiclesForLocation(user.location, vehiclesToSave);
      
      const rePaddedData = Array(TOTAL_ROWS).fill({});
      vehiclesToSave.forEach((vehicle, index) => {
         if (index < TOTAL_ROWS) {
          rePaddedData[index] = vehicle;
        }
      });
      setTableData(rePaddedData);

      toast({ title: 'Berhasil', description: 'Semua perubahan telah disimpan.' });
    } catch (error) {
      console.error("Failed to save vehicles:", error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat menyimpan data.' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>, rowIndex: number, colIndex: number) => {
    const { key } = e;
    let nextRowIndex = rowIndex;
    let nextColIndex = colIndex;

    const moveFocus = () => {
        const nextField = fields[nextColIndex];
        const nextInputId = `${nextField}-${nextRowIndex}`;
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
            nextInput.focus();
        }
    };
    
    switch (key) {
        case 'Enter':
        case 'ArrowDown':
            e.preventDefault();
            nextRowIndex = (rowIndex + 1) % TOTAL_ROWS;
            moveFocus();
            break;
        case 'ArrowUp':
            e.preventDefault();
            nextRowIndex = (rowIndex - 1 + TOTAL_ROWS) % TOTAL_ROWS;
            moveFocus();
            break;
        case 'ArrowRight':
            e.preventDefault();
            nextColIndex = colIndex + 1;
            if (nextColIndex >= fields.length) {
                nextColIndex = 0;
                nextRowIndex = (rowIndex + 1) % TOTAL_ROWS;
            }
            moveFocus();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            nextColIndex = colIndex - 1;
            if (nextColIndex < 0) {
                nextColIndex = fields.length - 1;
                nextRowIndex = (rowIndex - 1 + TOTAL_ROWS) % TOTAL_ROWS;
            }
            moveFocus();
            break;
        default:
            return;
    }
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
                    Tindakan ini akan menghapus kendaraan dari daftar di lokasi saat ini.
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
                                                onKeyDown={(e) => handleKeyDown(e, index, colIndex)}
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