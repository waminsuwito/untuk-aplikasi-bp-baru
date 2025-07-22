
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { MapPin, Trash2, Edit, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AttendanceLocation } from '@/lib/types';
import { useAuth } from '@/context/auth-provider';

const ATTENDANCE_LOCATIONS_KEY = 'app-attendance-locations';

const initialLocationsSeed: AttendanceLocation[] = [
  { id: '1', name: 'BP PEKANBARU', latitude: 0.507067, longitude: 101.447779 },
  { id: '2', name: 'BP DUMAI', latitude: 1.6242, longitude: 101.4449 },
  { id: '3', name: 'BP BAUNG', latitude: 0.6358, longitude: 101.6917 },
  { id: '4', name: 'BP IKN', latitude: -0.9754, longitude: 116.9926 },
];

const initialFormState = {
  name: '',
  latitude: '',
  longitude: '',
};

const getAllLocations = (): AttendanceLocation[] => {
  try {
    const storedData = localStorage.getItem(ATTENDANCE_LOCATIONS_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
    // Seed if empty
    localStorage.setItem(ATTENDANCE_LOCATIONS_KEY, JSON.stringify(initialLocationsSeed));
    return initialLocationsSeed;
  } catch (error) {
    console.error("Failed to read locations from localStorage", error);
    return [];
  }
};

const saveAllLocations = (data: AttendanceLocation[]) => {
  try {
    localStorage.setItem(ATTENDANCE_LOCATIONS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save locations to localStorage", error);
  }
};

export default function SetLokasiAbsensiPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [formState, setFormState] = useState(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const allLocations = getAllLocations();
    if (user.jabatan === 'HSE/K3') {
      setLocations(allLocations.filter(loc => loc.name === user.location));
    } else {
      setLocations(allLocations);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormState(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.name.trim() || !formState.latitude.trim() || !formState.longitude.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields must be filled.' });
      return;
    }
    const lat = parseFloat(formState.latitude);
    const lon = parseFloat(formState.longitude);
    if (isNaN(lat) || isNaN(lon)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Latitude and Longitude must be valid numbers.' });
      return;
    }

    const allLocations = getAllLocations();
    let updatedAllLocations;

    if (editingId) {
      updatedAllLocations = allLocations.map(loc => 
        loc.id === editingId ? { ...loc, name: formState.name, latitude: lat, longitude: lon } : loc
      );
      toast({ title: 'Location Updated', description: `Location "${formState.name}" has been updated.` });
    } else {
      if (user?.jabatan !== 'SUPER ADMIN') return;
      const newLocation: AttendanceLocation = {
        id: new Date().toISOString(),
        name: formState.name, latitude: lat, longitude: lon,
      };
      updatedAllLocations = [...allLocations, newLocation];
      toast({ title: 'Location Added', description: `Location "${formState.name}" has been added.` });
    }

    saveAllLocations(updatedAllLocations);

    // Refresh the view
    if (user?.jabatan === 'HSE/K3') {
      setLocations(updatedAllLocations.filter(loc => loc.name === user.location));
    } else {
      setLocations(updatedAllLocations);
    }

    setFormState(initialFormState);
    setEditingId(null);
  };

  const handleEdit = (location: AttendanceLocation) => {
    setEditingId(location.id);
    setFormState({
      name: location.name,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormState(initialFormState);
  };

  const handleDelete = (id: string) => {
    if (user?.jabatan !== 'SUPER ADMIN') {
      toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk menghapus lokasi.' });
      return;
    }
    const allLocations = getAllLocations();
    const updatedAllLocations = allLocations.filter(loc => loc.id !== id);
    saveAllLocations(updatedAllLocations);
    setLocations(updatedAllLocations); // Refresh view for super_admin
    toast({ variant: 'destructive', title: 'Location Deleted', description: 'The location has been removed.' });
  };

  return (
    <div className="space-y-6">
      {(user?.jabatan === 'SUPER ADMIN' || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              {editingId ? 'Edit Lokasi Absensi' : 'Tambah Lokasi Absensi Baru'}
            </CardTitle>
            <CardDescription>
              {editingId 
                ? `Ubah detail untuk lokasi "${formState.name}". ${user?.jabatan === 'HSE/K3' ? 'Anda hanya bisa mengubah koordinat.' : ''}` 
                : 'Tambahkan lokasi baru untuk absensi karyawan.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lokasi</Label>
                  <Input 
                    id="name" name="name" value={formState.name} onChange={handleInputChange} 
                    placeholder="Contoh: BP PEKANBARU" 
                    style={{ textTransform: 'uppercase' }}
                    disabled={editingId && user?.jabatan === 'HSE/K3'} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" name="latitude" type="number" step="any" value={formState.latitude} onChange={handleInputChange} placeholder="Contoh: 0.507067" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" name="longitude" type="number" step="any" value={formState.longitude} onChange={handleInputChange} placeholder="Contoh: 101.447779" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {editingId && <Button type="button" variant="outline" onClick={handleCancelEdit}>Batal</Button>}
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {editingId ? 'Simpan Perubahan' : 'Tambah Lokasi'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Lokasi Absensi</CardTitle>
          <CardDescription>
            {user?.jabatan === 'HSE/K3' 
              ? `Menampilkan lokasi yang dikonfigurasi untuk ${user.location}.`
              : 'Daftar semua lokasi yang telah dikonfigurasi untuk absensi.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Lokasi</TableHead>
                    <TableHead>Latitude</TableHead>
                    <TableHead>Longitude</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell>{loc.latitude}</TableCell>
                      <TableCell>{loc.longitude}</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(loc)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        {user?.jabatan === 'SUPER ADMIN' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Hapus</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus lokasi "{loc.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(loc.id)}>
                                  Ya, Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>
                {user?.jabatan === 'HSE/K3' 
                  ? 'Tidak ada lokasi yang terkonfigurasi untuk Anda.'
                  : 'Belum ada lokasi yang ditambahkan.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
