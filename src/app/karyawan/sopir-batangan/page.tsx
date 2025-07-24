
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-provider';
import type { User, Vehicle, UserLocation, Assignment } from '@/lib/types';
import { getUsers } from '@/lib/auth';
import { Users, Trash2, PlusCircle, Inbox } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ASSIGNMENTS_STORAGE_KEY_PREFIX = 'app-assignments-';
const VEHICLES_STORAGE_KEY_PREFIX = 'app-vehicles-';

const getAssignmentsForLocation = (location: UserLocation): Assignment[] => {
    try {
        const key = `${ASSIGNMENTS_STORAGE_KEY_PREFIX}${location}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
};

const saveAssignmentsForLocation = (location: UserLocation, assignments: Assignment[]) => {
    try {
        const key = `${ASSIGNMENTS_STORAGE_KEY_PREFIX}${location}`;
        localStorage.setItem(key, JSON.stringify(assignments));
    } catch (e) { console.error("Failed to save assignments", e); }
};

const getVehiclesForLocation = (location: UserLocation): Vehicle[] => {
    try {
        const key = `${VEHICLES_STORAGE_KEY_PREFIX}${location}`;
        const storedVehicles = localStorage.getItem(key);
        return storedVehicles ? JSON.parse(storedVehicles) : [];
    } catch (error) { return []; }
};


export default function SopirBatanganPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const loadData = useCallback(() => {
    if (user?.location) {
      const users = getUsers();
      const filteredUsers = users.filter(u => u.location === user.location && u.jabatan !== 'SUPER ADMIN');
      
      const vehicles = getVehiclesForLocation(user.location);
      const savedAssignments = getAssignmentsForLocation(user.location);

      setAllUsers(filteredUsers);
      setAllVehicles(vehicles);
      setAssignments(savedAssignments);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

    const assignmentId = `${selectedUserId}-${selectedVehicleId}`;
    const newAssignment: Assignment = {
      id: assignmentId,
      userId: selectedUserId,
      username: selectedUser.username,
      vehicleId: selectedVehicleId,
      vehicleNomorPolisi: selectedVehicle.nomorPolisi,
    };

    try {
        const updatedAssignments = [...assignments, newAssignment];
        saveAssignmentsForLocation(user.location, updatedAssignments);

        toast({ title: 'Berhasil', description: `Sopir ${selectedUser.username} telah ditugaskan ke ${selectedVehicle.nomorPolisi}.` });
        
        setSelectedUserId('');
        setSelectedVehicleId('');
        loadData(); // Reload data
    } catch (error) {
        console.error("Failed to create assignment:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan penugasan.' });
    }
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (!user?.location) return;

    try {
        const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
        saveAssignmentsForLocation(user.location, updatedAssignments);

        toast({ variant: 'destructive', title: 'Penugasan Dihapus', description: 'Sopir telah dilepaskan dari kendaraan.' });
        loadData(); // Reload data
    } catch (error) {
        console.error("Failed to delete assignment:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus penugasan.' });
    }
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
