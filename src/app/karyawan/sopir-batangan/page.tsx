
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-provider';
import type { User, Vehicle, UserLocation, Assignment } from '@/lib/types';
import { getUsers } from '@/lib/auth';
import { Users, Trash2, PlusCircle, Inbox } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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


const VEHICLES_STORAGE_KEY_PREFIX = 'app-vehicles-';
const ASSIGNMENTS_STORAGE_KEY_PREFIX = 'app-assignments-';

const getAssignments = (location: UserLocation): Assignment[] => {
  try {
    const key = `${ASSIGNMENTS_STORAGE_KEY_PREFIX}${location}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveAssignments = (location: UserLocation, assignments: Assignment[]) => {
  try {
    const key = `${ASSIGNMENTS_STORAGE_KEY_PREFIX}${location}`;
    localStorage.setItem(key, JSON.stringify(assignments));
  } catch (e) {
    console.error("Failed to save assignments", e);
  }
};

const getVehicles = (location: UserLocation): Vehicle[] => {
    try {
        const key = `${VEHICLES_STORAGE_KEY_PREFIX}${location}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
};

export default function SopirBatanganPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  useEffect(() => {
    if (user?.location) {
      const users = getUsers().filter(u => u.location === user.location && u.jabatan !== 'SUPER ADMIN');
      const vehicles = getVehicles(user.location);
      const savedAssignments = getAssignments(user.location);

      setAllUsers(users);
      setAllVehicles(vehicles);
      setAssignments(savedAssignments);
    }
  }, [user]);

  const handleCreateAssignment = () => {
    if (!selectedUserId || !selectedVehicleId || !user?.location) {
      toast({ variant: 'destructive', title: 'Data Tidak Lengkap', description: 'Silakan pilih sopir dan kendaraan.' });
      return;
    }
    
    const selectedUser = allUsers.find(u => u.id === selectedUserId);
    const selectedVehicle = allVehicles.find(v => v.id === selectedVehicleId);

    if (!selectedUser || !selectedVehicle) {
      toast({ variant: 'destructive', title: 'Data tidak ditemukan' });
      return;
    }

    if (selectedVehicle.status === 'RUSAK BERAT') {
      toast({ 
        variant: 'destructive', 
        title: 'Penugasan Ditolak', 
        description: `Kendaraan ${selectedVehicle.nomorPolisi} kondisi rusak berat. Tidak bisa melakukan penugasan.` 
      });
      return;
    }

    const existingUserAssignment = assignments.find(a => a.userId === selectedUserId);
    if (existingUserAssignment) {
      toast({ variant: 'destructive', title: 'Gagal', description: `Sopir ini sudah ditugaskan ke kendaraan lain (${existingUserAssignment.vehicleNomorPolisi}).` });
      return;
    }

    const existingVehicleAssignment = assignments.find(a => a.vehicleId === selectedVehicleId);
    if (existingVehicleAssignment) {
      toast({ variant: 'destructive', title: 'Gagal', description: `Kendaraan ini sudah ditugaskan ke sopir lain (${existingVehicleAssignment.username}).` });
      return;
    }

    const newAssignment: Assignment = {
      id: `${selectedUserId}-${selectedVehicleId}`,
      userId: selectedUserId,
      username: selectedUser.username,
      vehicleId: selectedVehicleId,
      vehicleNomorPolisi: selectedVehicle.nomorPolisi,
    };

    const updatedAssignments = [...assignments, newAssignment];
    setAssignments(updatedAssignments);
    saveAssignments(user.location, updatedAssignments);

    toast({ title: 'Berhasil', description: `Sopir ${selectedUser.username} telah ditugaskan ke ${selectedVehicle.nomorPolisi}.` });

    setSelectedUserId('');
    setSelectedVehicleId('');
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (!user?.location) return;

    const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
    setAssignments(updatedAssignments);
    saveAssignments(user.location, updatedAssignments);
    toast({ variant: 'destructive', title: 'Penugasan Dihapus', description: 'Sopir telah dilepaskan dari kendaraan.' });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Penugasan Sopir dan Batangan
          </CardTitle>
          <CardDescription>
            Pasangkan sopir/operator dengan kendaraan yang akan mereka operasikan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="sopir-select">Pilih Sopir / Operator</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="sopir-select"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {allUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.username} ({u.jabatan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-select">Pilih Kendaraan (Batangan)</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger id="vehicle-select"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {allVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id} disabled={v.status === 'RUSAK BERAT'}>
                      {v.nomorPolisi} ({v.nomorLambung}) {v.status === 'RUSAK BERAT' && ' - RUSAK BERAT'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateAssignment} className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Tugaskan
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Daftar Penugasan Aktif</CardTitle>
            <CardDescription>Berikut adalah daftar sopir yang telah dipasangkan dengan kendaraan.</CardDescription>
        </CardHeader>
        <CardContent>
            {assignments.length > 0 ? (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Sopir/Operator</TableHead>
                                <TableHead>Nomor Polisi Kendaraan</TableHead>
                                <TableHead className="text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments.map(a => (
                                <TableRow key={a.id}>
                                    <TableCell className="font-medium">{a.username}</TableCell>
                                    <TableCell>{a.vehicleNomorPolisi}</TableCell>
                                    <TableCell className="text-center">
                                       <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Hapus
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Apakah Anda yakin ingin menghapus penugasan untuk sopir 
                                                <span className="font-bold"> {a.username} </span>
                                                 dari kendaraan 
                                                 <span className="font-bold"> {a.vehicleNomorPolisi}</span>?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Tidak</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteAssignment(a.id)}>
                                                Yakin
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
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <Inbox className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">Belum Ada Penugasan</h3>
                    <p className="mt-1 text-sm">Gunakan formulir di atas untuk menugaskan sopir ke kendaraan.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
