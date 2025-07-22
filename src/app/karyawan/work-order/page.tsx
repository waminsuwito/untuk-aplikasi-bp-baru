

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-provider';
import { ClipboardEdit, Wrench, Inbox, MoreHorizontal, Pause, Play, Timer, Users, HardHat, PlusCircle, Trash2 } from 'lucide-react';
import type { User, TruckChecklistReport, TruckChecklistItem, UserLocation, WorkOrder, WorkOrderStatus, SparePartUsage } from '@/lib/types';
import { format, differenceInMinutes, isValid, formatDistanceStrict, addMilliseconds } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, playSound } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { getUsers } from '@/lib/auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';


const TM_CHECKLIST_STORAGE_KEY = 'app-tm-checklists';
const LOADER_CHECKLIST_STORAGE_KEY = 'app-loader-checklists';
const WORK_ORDER_STORAGE_KEY = 'app-work-orders';

interface DamagedVehicle {
  reportId: string;
  userId: string;
  userNik: string;
  username: string;
  location: UserLocation;
  timestamp: string;
  damagedItems: TruckChecklistItem[];
}

const initialSparePartFormState = {
    code: '',
    name: '',
    quantity: 1,
};


const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Custom hook to get the previous value of a prop or state
function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function WorkOrderPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [damagedVehicles, setDamagedVehicles] = useState<DamagedVehicle[]>([]);
  const prevDamagedVehicles = usePrevious(damagedVehicles);

  const [myWorkOrders, setMyWorkOrders] = useState<WorkOrder[]>([]);
  const prevMyWorkOrders = usePrevious(myWorkOrders);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  
  const [isTargetDialogVisible, setTargetDialogVisible] = useState(false);
  const [workOrderToProcess, setWorkOrderToProcess] = useState<WorkOrder | null>(null);
  
  const [isPostponeDialogVisible, setPostponeDialogVisible] = useState(false);
  const [workOrderToPostpone, setWorkOrderToPostpone] = useState<WorkOrder | null>(null);
  const [postponeReason, setPostponeReason] = useState('');
  
  const [isAssignDialogVisible, setAssignDialogVisible] = useState(false);
  const [mechanicsToAssign, setMechanicsToAssign] = useState<User[]>([]);
  const [selectedMechanics, setSelectedMechanics] = useState<Record<string, boolean>>({});
  
  const [isSparePartDialogVisible, setSparePartDialogVisible] = useState(false);
  const [workOrderToManageParts, setWorkOrderToManageParts] = useState<WorkOrder | null>(null);
  const [sparePartForm, setSparePartForm] = useState(initialSparePartFormState);

  const defaultTargetDate = new Date();
  defaultTargetDate.setHours(defaultTargetDate.getHours() + 2);
  const [targetTime, setTargetTime] = useState(formatDateTimeLocal(defaultTargetDate));

  const loadData = () => {
    if (!user) return;

    const tmChecklistsStr = localStorage.getItem(TM_CHECKLIST_STORAGE_KEY);
    const loaderChecklistsStr = localStorage.getItem(LOADER_CHECKLIST_STORAGE_KEY);
    
    const tmChecklists: TruckChecklistReport[] = tmChecklistsStr ? JSON.parse(tmChecklistsStr) : [];
    const loaderChecklists: TruckChecklistReport[] = loaderChecklistsStr ? JSON.parse(loaderChecklistsStr) : [];
    
    const allChecklists = [...tmChecklists, ...loaderChecklists];

    const storedWorkOrders = localStorage.getItem(WORK_ORDER_STORAGE_KEY);
    const allWorkOrders: WorkOrder[] = storedWorkOrders ? JSON.parse(storedWorkOrders) : [];

    const myCurrentWOs = allWorkOrders.filter(wo => {
        const isAssigned = Array.isArray(wo.assignedMechanics) && wo.assignedMechanics.some(m => m.id === user.id);
        if (!isAssigned) return false;
        
        if (wo.status !== 'Selesai') return true;

        // Show completed WO only on the same day it was completed
        if (wo.status === 'Selesai' && wo.completionTime) {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const completionDateStr = format(new Date(wo.completionTime), 'yyyy-MM-dd');
            return completionDateStr === todayStr;
        }

        return false;
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    setMyWorkOrders(myCurrentWOs);

    const activeWorkOrderReportIds = new Set(
        allWorkOrders
            .filter(wo => wo.status !== 'Selesai')
            .map(wo => wo.vehicle.reportId)
    );

    const availableDamaged: DamagedVehicle[] = allChecklists
      .map(report => {
        const damagedItems = report.items.filter(item => item.status === 'rusak' || item.status === 'perlu_perhatian');
        if (damagedItems.length > 0) {
          return {
            reportId: report.id,
            userId: report.userId,
            userNik: report.userNik,
            username: report.username,
            location: report.location,
            timestamp: report.timestamp,
            damagedItems: damagedItems,
          };
        }
        return null;
      })
      .filter((v): v is DamagedVehicle => v !== null && !activeWorkOrderReportIds.has(v.reportId))
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.startTime).getTime());
      
    setDamagedVehicles(availableDamaged);
  };

  useEffect(() => {
    loadData();
    // Periodically reload data to catch updates
    const intervalId = setInterval(loadData, 15000); // Check every 15 seconds
    return () => clearInterval(intervalId);
  }, [user]);

  // Effect for new damage report notification
  useEffect(() => {
    if (prevDamagedVehicles && damagedVehicles.length > prevDamagedVehicles.length) {
      playSound('/notification-new-damage.mp3');
      toast({
        title: "Laporan Kerusakan Baru",
        description: "Kendaraan baru telah ditambahkan ke daftar perbaikan.",
        variant: "destructive"
      });
    }
  }, [damagedVehicles, prevDamagedVehicles, toast]);

  // Effect for repair completion notification
  useEffect(() => {
    if (prevMyWorkOrders) {
      myWorkOrders.forEach(currentWO => {
        const prevWO = prevMyWorkOrders.find(p => p.id === currentWO.id);
        if (prevWO && prevWO.status !== 'Selesai' && currentWO.status === 'Selesai') {
          playSound('/notification-repair-done.mp3');
           toast({
              title: "Perbaikan Selesai",
              description: `Work order untuk ${currentWO.vehicle.username} telah selesai.`,
              className: "bg-green-100 dark:bg-green-900 border-green-500"
          });
        }
      });
    }
  }, [myWorkOrders, prevMyWorkOrders, toast]);


  const handleStartWorkOrderCreation = () => {
    if (!selectedVehicleId || !user) {
        toast({ variant: 'destructive', title: 'Pilih Kendaraan', description: 'Anda harus memilih kendaraan yang rusak terlebih dahulu.' });
        return;
    }
    const allUsers = getUsers();
    const availableMechanics = allUsers.filter(
        u => u.jabatan === 'KEPALA MEKANIK' || u.jabatan === 'KEPALA WORKSHOP' || u.jabatan === 'HELPER'
    );
    setMechanicsToAssign(availableMechanics);
    setSelectedMechanics({ [user.id]: true }); // Auto-select current user
    setAssignDialogVisible(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedVehicleId || !user) return;
    
    const assignedIds = Object.keys(selectedMechanics).filter(id => selectedMechanics[id]);
    if (assignedIds.length === 0) {
        toast({ variant: 'destructive', title: 'Pilih Mekanik', description: 'Anda harus menugaskan setidaknya satu mekanik.' });
        return;
    }

    const assignedMechanics = mechanicsToAssign
        .filter(m => assignedIds.includes(m.id))
        .map(m => ({ id: m.id, name: m.username }));

    const vehicleToRepair = damagedVehicles.find(v => v.reportId === selectedVehicleId);
    if (!vehicleToRepair) {
      toast({ variant: 'destructive', title: 'Kendaraan tidak ditemukan' });
      return;
    }

    const newWorkOrder: WorkOrder = {
      id: `${vehicleToRepair.reportId}-${user.id}-${Date.now()}`,
      assignedMechanics,
      vehicle: vehicleToRepair,
      startTime: new Date().toISOString(),
      status: 'Menunggu',
      actualDamagesNotes: '',
      usedSpareParts: [],
    };

    const storedWorkOrders = localStorage.getItem(WORK_ORDER_STORAGE_KEY);
    const allWorkOrders: WorkOrder[] = storedWorkOrders ? JSON.parse(storedWorkOrders) : [];
    allWorkOrders.push(newWorkOrder);
    localStorage.setItem(WORK_ORDER_STORAGE_KEY, JSON.stringify(allWorkOrders));

    toast({ title: 'Work Order Dibuat', description: `Telah dibuat WO untuk kendaraan NIK ${vehicleToRepair.userNik}` });
    
    setAssignDialogVisible(false);
    setSelectedVehicleId(null);
    loadData();
  };
  
  const clearVehicleDamageStatus = (reportId: string) => {
      const checklistKeys = [TM_CHECKLIST_STORAGE_KEY, LOADER_CHECKLIST_STORAGE_KEY];
      
      for (const key of checklistKeys) {
          const storedChecklists = localStorage.getItem(key);
          if (storedChecklists) {
              let checklists: TruckChecklistReport[] = JSON.parse(storedChecklists);
              let wasUpdated = false;
              
              const updatedChecklists = checklists.map(report => {
                  if (report.id === reportId) {
                      wasUpdated = true;
                      const repairedItems = report.items.map(item => ({
                          ...item,
                          status: 'baik' as 'baik',
                          notes: '',
                          photo: null,
                      }));
                      return { ...report, items: repairedItems };
                  }
                  return report;
              });

              if (wasUpdated) {
                  localStorage.setItem(key, JSON.stringify(updatedChecklists));
                  break;
              }
          }
      }
  };

  const handleActualDamagesChange = (workOrderId: string, text: string) => {
    const updatedOrders = myWorkOrders.map(wo => 
      wo.id === workOrderId ? { ...wo, actualDamagesNotes: text.toUpperCase() } : wo
    );
    setMyWorkOrders(updatedOrders);
  };

  const saveActualDamages = (workOrderId: string, text: string) => {
    const storedWorkOrders = localStorage.getItem(WORK_ORDER_STORAGE_KEY);
    const allWorkOrders: WorkOrder[] = storedWorkOrders ? JSON.parse(storedWorkOrders) : [];
    const updatedAllWorkOrders = allWorkOrders.map(wo => 
      wo.id === workOrderId ? { ...wo, actualDamagesNotes: text.toUpperCase() } : wo
    );
    localStorage.setItem(WORK_ORDER_STORAGE_KEY, JSON.stringify(updatedAllWorkOrders));
    toast({ title: 'Catatan disimpan', description: 'Catatan kerusakan aktual telah diperbarui.' });
  };
  
  const handleConfirmTargetTime = () => {
    if (!workOrderToProcess) return;

    const storedWorkOrders = localStorage.getItem(WORK_ORDER_STORAGE_KEY);
    const allWorkOrders: WorkOrder[] = storedWorkOrders ? JSON.parse(storedWorkOrders) : [];

    const updatedWorkOrders = allWorkOrders.map(wo => {
        if (wo.id === workOrderToProcess.id) {
            return {
                ...wo,
                status: 'Proses' as const,
                processStartTime: new Date().toISOString(),
                targetCompletionTime: new Date(targetTime).toISOString()
            };
        }
        return wo;
    });
    
    localStorage.setItem(WORK_ORDER_STORAGE_KEY, JSON.stringify(updatedWorkOrders));
    toast({ title: 'Status Diperbarui', description: `Work Order telah diperbarui menjadi "Proses".` });
    
    setTargetDialogVisible(false);
    setWorkOrderToProcess(null);
    loadData();
  };
  
  const handleConfirmPostpone = () => {
    if (!workOrderToPostpone || !postponeReason.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Alasan penundaan harus diisi.' });
        return;
    }

    const storedWorkOrders = localStorage.getItem(WORK_ORDER_STORAGE_KEY);
    const allWorkOrders: WorkOrder[] = storedWorkOrders ? JSON.parse(storedWorkOrders) : [];

    const updatedWorkOrders = allWorkOrders.map(wo => {
        if (wo.id === workOrderToPostpone.id) {
            return {
                ...wo,
                status: 'Tunda' as const,
                waktuMulaiTunda: new Date().toISOString(),
                notes: `DITUNDA: ${postponeReason.toUpperCase()}`
            };
        }
        return wo;
    });

    localStorage.setItem(WORK_ORDER_STORAGE_KEY, JSON.stringify(updatedWorkOrders));
    toast({ title: 'Status Diperbarui', description: 'Work Order telah ditunda.' });

    setPostponeDialogVisible(false);
    setWorkOrderToPostpone(null);
    setPostponeReason('');
    loadData();
  };


  const handleUpdateWorkOrderStatus = (workOrder: WorkOrder, status: WorkOrderStatus | 'Lanjutkan') => {
    if (status === 'Proses') {
      if (workOrder.status === 'Menunggu') {
        setWorkOrderToProcess(workOrder);
        setTargetDialogVisible(true);
      }
      return;
    }
    
    if (status === 'Tunda') {
        if (workOrder.status === 'Proses' || workOrder.status === 'Dikerjakan') {
          setWorkOrderToPostpone(workOrder);
          setPostponeDialogVisible(true);
        } else {
            toast({ variant: 'destructive', title: 'Aksi tidak valid', description: 'Hanya pekerjaan yang sedang berjalan yang bisa ditunda.' });
        }
        return;
    }

    const storedWorkOrders = localStorage.getItem(WORK_ORDER_STORAGE_KEY);
    const allWorkOrders: WorkOrder[] = storedWorkOrders ? JSON.parse(storedWorkOrders) : [];

    const updatedWorkOrders = allWorkOrders.map(wo => {
        if (wo.id === workOrder.id) {
            let updatedWo: WorkOrder = { ...wo };

            if (status === 'Lanjutkan') {
                if (wo.status === 'Tunda' && wo.waktuMulaiTunda && wo.targetCompletionTime) {
                    const waktuJedaMs = new Date().getTime() - new Date(wo.waktuMulaiTunda).getTime();
                    const totalJedaBaru = (wo.totalWaktuTundaMs || 0) + waktuJedaMs;
                    const targetBaru = addMilliseconds(new Date(wo.targetCompletionTime), waktuJedaMs);

                    updatedWo = {
                        ...updatedWo,
                        status: 'Proses',
                        notes: `Pekerjaan dilanjutkan. Total jeda: ${formatDistanceStrict(totalJedaBaru, 0, { locale: localeID })}.`,
                        waktuMulaiTunda: null,
                        totalWaktuTundaMs: totalJedaBaru,
                        targetCompletionTime: targetBaru.toISOString(),
                    };
                } else {
                  updatedWo.status = 'Proses';
                }
            } else {
                updatedWo.status = status;
                if(status !== 'Tunda' && wo.status !== 'Tunda') {
                   if (!updatedWo.notes?.startsWith('DITUNDA')) {
                       updatedWo.notes = '';
                   }
                }
            }
            
            if (status === 'Selesai') {
                const now = new Date();
                
                if (workOrder.targetCompletionTime) {
                    const targetDate = new Date(workOrder.targetCompletionTime);
                    const diffMins = differenceInMinutes(now, targetDate);
                    
                    const formatDetailedDifference = (minutes: number) => {
                        const absMinutes = Math.abs(minutes);
                        const hours = Math.floor(absMinutes / 60);
                        const mins = absMinutes % 60;
                        let result = '';
                        if (hours > 0) result += `${hours} jam `;
                        if (mins > 0) result += `${mins} menit`;
                        return result.trim() || 'kurang dari 1 menit';
                    };

                    if (diffMins <= 5 && diffMins >= -5) {
                        updatedWo.notes = 'Tepat Waktu';
                    } else if (diffMins < -5) {
                        updatedWo.notes = `Lebih Cepat ${formatDetailedDifference(diffMins)} dari target`;
                    } else {
                        updatedWo.notes = `Terlambat ${formatDetailedDifference(diffMins)}`;
                    }
                } else {
                    updatedWo.notes = "Target waktu tidak diatur.";
                }

                updatedWo.completionTime = now.toISOString();
            } else if (status !== 'Lanjutkan') { 
                delete updatedWo.completionTime;
            }
            return updatedWo;
        }
        return wo;
    });
    
    localStorage.setItem(WORK_ORDER_STORAGE_KEY, JSON.stringify(updatedWorkOrders));
    
    if (status === 'Selesai') {
        clearVehicleDamageStatus(workOrder.vehicle.reportId);
        toast({ title: 'Perbaikan Selesai', description: `Kendaraan ${workOrder.vehicle.userNik} telah selesai diperbaiki.` });
    } else if (status !== 'Proses' && status !== 'Tunda') { // Avoid toast for actions that trigger dialogs
        toast({ title: 'Status Diperbarui', description: `Work Order telah diperbarui menjadi "${status}".` });
    }

    loadData();
  };

  const handleOpenSparePartDialog = (workOrder: WorkOrder) => {
    setWorkOrderToManageParts(workOrder);
    setSparePartForm(initialSparePartFormState);
    setSparePartDialogVisible(true);
  };

  const handleAddSparePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrderToManageParts || !sparePartForm.name.trim() || sparePartForm.quantity <= 0) {
        toast({ variant: 'destructive', title: 'Data tidak valid', description: 'Pastikan nama spare part diisi dan jumlah lebih dari 0.' });
        return;
    }

    const newPart: SparePartUsage = {
        id: new Date().toISOString() + Math.random(),
        ...sparePartForm,
    };

    const updatedWO = {
        ...workOrderToManageParts,
        usedSpareParts: [...(workOrderToManageParts.usedSpareParts || []), newPart],
    };

    const storedWorkOrders = localStorage.getItem(WORK_ORDER_STORAGE_KEY);
    const allWorkOrders: WorkOrder[] = storedWorkOrders ? JSON.parse(storedWorkOrders) : [];
    const updatedAllWorkOrders = allWorkOrders.map(wo =>
      wo.id === updatedWO.id ? updatedWO : wo
    );

    localStorage.setItem(WORK_ORDER_STORAGE_KEY, JSON.stringify(updatedAllWorkOrders));
    setWorkOrderToManageParts(updatedWO);
    setSparePartForm(initialSparePartFormState);
    loadData();
  };

  const handleDeleteSparePart = (partId: string) => {
    if (!workOrderToManageParts) return;

    const updatedParts = workOrderToManageParts.usedSpareParts?.filter(p => p.id !== partId);
    const updatedWO = { ...workOrderToManageParts, usedSpareParts: updatedParts };

    const storedWorkOrders = localStorage.getItem(WORK_ORDER_STORAGE_KEY);
    const allWorkOrders: WorkOrder[] = storedWorkOrders ? JSON.parse(storedWorkOrders) : [];
    const updatedAllWorkOrders = allWorkOrders.map(wo =>
      wo.id === updatedWO.id ? updatedWO : wo
    );
    
    localStorage.setItem(WORK_ORDER_STORAGE_KEY, JSON.stringify(updatedAllWorkOrders));
    setWorkOrderToManageParts(updatedWO);
    loadData();
  };
  
    const calculateDuration = (wo: WorkOrder): string => {
        if (!wo.processStartTime || !wo.completionTime) return '-';
        const totalDurationMs = new Date(wo.completionTime).getTime() - new Date(wo.processStartTime).getTime();
        const effectiveDurationMs = totalDurationMs - (wo.totalWaktuTundaMs || 0);

        if (effectiveDurationMs < 0) return 'N/A';
        return formatDistanceStrict(effectiveDurationMs, 0, { locale: localeID });
    };

    const formatPauseDuration = (ms?: number) => {
        if (!ms || ms <= 0) return '-';
        return formatDistanceStrict(ms, 0, { locale: localeID });
    }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardEdit className="h-6 w-6 text-primary" />
            Work Order (WO)
          </CardTitle>
          <CardDescription>
            Pilih kendaraan dari daftar untuk memulai perbaikan dan membuat Work Order baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-grow">
              <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dari daftar kendaraan rusak..." />
                </SelectTrigger>
                <SelectContent>
                  {damagedVehicles.length > 0 ? damagedVehicles.map(vehicle => (
                    <SelectItem key={vehicle.reportId} value={vehicle.reportId}>
                      {`[${format(new Date(vehicle.timestamp), "d/MM HH:mm")}] - Opr: ${vehicle.username} (NIK: ${vehicle.userNik}) - Lokasi: ${vehicle.location}`}
                    </SelectItem>
                  )) : <SelectItem value="none" disabled>Tidak ada kendaraan rusak yang tersedia</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStartWorkOrderCreation} disabled={!selectedVehicleId}>
              <Wrench className="mr-2 h-4 w-4" /> Perbaiki
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAssignDialogVisible} onOpenChange={setAssignDialogVisible}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Tugaskan Mekanik</DialogTitle>
            <DialogDescription>Pilih satu atau lebih mekanik untuk mengerjakan Work Order ini.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 my-4">
            <div className="space-y-2 pr-6">
              {mechanicsToAssign.map(m => (
                <div key={m.id} className="flex items-center space-x-2 rounded-md border p-3">
                  <Checkbox 
                    id={`mech-${m.id}`} 
                    checked={selectedMechanics[m.id] || false}
                    onCheckedChange={(checked) => setSelectedMechanics(prev => ({...prev, [m.id]: !!checked}))}
                  />
                  <label htmlFor={`mech-${m.id}`} className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {m.username} <span className="text-muted-foreground">({m.jabatan})</span>
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogVisible(false)}>Batal</Button>
            <Button onClick={handleConfirmAssignment}><Users className="mr-2 h-4 w-4" /> Tugaskan Mekanik</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTargetDialogVisible} onOpenChange={setTargetDialogVisible}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Set Target Waktu Selesai</DialogTitle>
                <DialogDescription>
                    Pekerjaan akan dimulai. Tentukan target tanggal dan jam penyelesaian untuk perbaikan ini.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="target-time">Target Waktu</Label>
                <Input
                    id="target-time"
                    type="datetime-local"
                    value={targetTime}
                    onChange={e => setTargetTime(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setTargetDialogVisible(false); setWorkOrderToProcess(null); }}>Batal</Button>
                <Button onClick={handleConfirmTargetTime}>Mulai & Simpan Target</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPostponeDialogVisible} onOpenChange={setPostponeDialogVisible}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Alasan Penundaan</DialogTitle>
                <DialogDescription>
                    Apa alasan penundaan perbaikan ini? Catatan Anda akan disimpan.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="postpone-reason">Alasan Penundaan</Label>
                <Textarea
                    id="postpone-reason"
                    value={postponeReason}
                    onChange={e => setPostponeReason(e.target.value)}
                    placeholder="Contoh: Menunggu spare part, perlu alat khusus, dll."
                    rows={4}
                    style={{ textTransform: 'uppercase' }}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setPostponeDialogVisible(false); setWorkOrderToPostpone(null); setPostponeReason(''); }}>Batal</Button>
                <Button onClick={handleConfirmPostpone}>Simpan Alasan & Tunda</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isSparePartDialogVisible} onOpenChange={setSparePartDialogVisible}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manajemen Pemakaian Spare Part</DialogTitle>
            <DialogDescription>
              Tambah atau hapus spare part yang digunakan untuk Work Order kendaraan {workOrderToManageParts?.vehicle.userNik}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <form onSubmit={handleAddSparePart} className="grid grid-cols-12 gap-2 items-end border-b pb-4">
              <div className="col-span-3 space-y-1">
                <Label htmlFor="sp-code" className="text-xs">Kode Spare Part</Label>
                <Input id="sp-code" value={sparePartForm.code} onChange={e => setSparePartForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
              </div>
              <div className="col-span-5 space-y-1">
                <Label htmlFor="sp-name" className="text-xs">Nama Spare Part</Label>
                <Input id="sp-name" value={sparePartForm.name} onChange={e => setSparePartForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="sp-qty" className="text-xs">Jumlah</Label>
                <Input id="sp-qty" type="number" min="1" value={sparePartForm.quantity} onChange={e => setSparePartForm(p => ({ ...p, quantity: Number(e.target.value) }))} />
              </div>
              <div className="col-span-2">
                <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Tambah</Button>
              </div>
            </form>
            <div>
              <h4 className="font-semibold mb-2">Daftar Spare Part Digunakan:</h4>
              <ScrollArea className="h-48 border rounded-md p-2">
                {workOrderToManageParts?.usedSpareParts && workOrderToManageParts.usedSpareParts.length > 0 ? (
                  <ul className="space-y-2">
                    {workOrderToManageParts.usedSpareParts.map(part => (
                      <li key={part.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                        <div className="flex-1">
                          <span className="font-semibold">{part.name}</span>
                          <span className="text-muted-foreground ml-2">({part.code})</span>
                        </div>
                        <span className="font-mono bg-background px-2 py-0.5 rounded-md text-sm">{part.quantity} Pcs</span>
                        <Button variant="ghost" size="icon" className="ml-2 h-7 w-7" onClick={() => handleDeleteSparePart(part.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-8">Belum ada spare part yang ditambahkan.</p>
                )}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSparePartDialogVisible(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>List WO Saya</CardTitle>
          <CardDescription>
            Daftar kendaraan yang sedang Anda tangani atau yang ditunda. Laporan yang selesai akan hilang setelah 24 jam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myWorkOrders.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Mekanik</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>NIK Kendaraan</TableHead>
                    <TableHead>Detail Dari Oprator</TableHead>
                    <TableHead>Aktual Kerusakan yang Dikerjakan</TableHead>
                    <TableHead>Pemakaian Spare Parts</TableHead>
                    <TableHead>Mulai Dikerjakan</TableHead>
                    <TableHead>Target Selesai</TableHead>
                    <TableHead>Total Jeda</TableHead>
                    <TableHead>Lama Pengerjaan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myWorkOrders.map(wo => {
                    const targetDate = wo.targetCompletionTime ? new Date(wo.targetCompletionTime) : null;
                    const isTargetDateValid = targetDate && isValid(targetDate);
                    return (
                        <TableRow key={wo.id}>
                          <TableCell className="text-xs">
                              {Array.isArray(wo.assignedMechanics) ? wo.assignedMechanics.map(m => m.name).join(', ') : '-'}
                          </TableCell>
                          <TableCell className="font-medium">{wo.vehicle.username}</TableCell>
                          <TableCell>{wo.vehicle.userNik}</TableCell>
                          <TableCell>
                            <ul className="list-disc pl-5 space-y-1 text-xs">
                              {wo.vehicle.damagedItems.map(item => (
                                <li key={item.id}>
                                  <span className="font-semibold">{item.label}:</span>
                                  <p className="whitespace-pre-wrap pl-2 text-sm text-muted-foreground">{item.notes || "Tidak ada catatan."}</p>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell className="w-[250px]">
                            <Textarea
                                value={wo.actualDamagesNotes || ''}
                                onChange={(e) => handleActualDamagesChange(wo.id, e.target.value)}
                                onBlur={(e) => saveActualDamages(wo.id, e.target.value)}
                                placeholder="Tuliskan perbaikan yang Anda lakukan di sini..."
                                rows={3}
                                className="min-w-[200px]"
                                disabled={wo.status === 'Selesai'}
                                style={{ textTransform: 'uppercase' }}
                            />
                           </TableCell>
                          <TableCell className="w-[250px] align-top">
                            <div className="flex flex-col items-start gap-2">
                                {wo.usedSpareParts && wo.usedSpareParts.length > 0 && (
                                    <ul className="list-disc pl-5 text-xs space-y-1">
                                        {wo.usedSpareParts.map(part => (
                                            <li key={part.id}>
                                                <span className="font-semibold">{part.name}</span> ({part.code}) - {part.quantity} Pcs
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <Button size="sm" variant="outline" className="text-xs" onClick={() => handleOpenSparePartDialog(wo)} disabled={wo.status === 'Selesai'}>
                                    <HardHat className="mr-2 h-3 w-3" /> Kelola Spare Part
                                </Button>
                            </div>
                           </TableCell>
                           <TableCell className="text-xs">
                             {wo.processStartTime ? format(new Date(wo.processStartTime), 'd MMM, HH:mm') : '-'}
                           </TableCell>
                           <TableCell className="text-xs">{isTargetDateValid ? format(targetDate, 'd MMM, HH:mm') : '-'}</TableCell>
                           <TableCell className="text-xs">{formatPauseDuration(wo.totalWaktuTundaMs)}</TableCell>
                           <TableCell className="text-xs">{calculateDuration(wo)}</TableCell>
                           <TableCell className="font-semibold">
                              {wo.status}
                          </TableCell>
                           <TableCell className={cn("text-xs font-semibold", {
                                'text-green-600': wo.notes?.startsWith('Lebih Cepat'),
                                'text-destructive': wo.notes?.startsWith('Terlambat'),
                                'text-amber-600': wo.status === 'Tunda',
                            })}>
                                {wo.notes || '-'}
                            </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={wo.status === 'Selesai'}>
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Opsi</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {wo.status === 'Menunggu' && (
                                        <DropdownMenuItem onClick={() => handleUpdateWorkOrderStatus(wo, 'Proses')}>
                                            <Play className="mr-2 h-4 w-4" /> Proses
                                        </DropdownMenuItem>
                                    )}
                                    {wo.status === 'Tunda' && (
                                        <DropdownMenuItem onClick={() => handleUpdateWorkOrderStatus(wo, 'Lanjutkan')}>
                                            <Play className="mr-2 h-4 w-4" /> Lanjutkan
                                        </DropdownMenuItem>
                                    )}
                                    {(wo.status === 'Proses' || wo.status === 'Dikerjakan') && (
                                        <DropdownMenuItem onClick={() => handleUpdateWorkOrderStatus(wo, 'Tunda')}>
                                            <Pause className="mr-2 h-4 w-4" /> Tunda
                                        </DropdownMenuItem>
                                    )}
                                    {(wo.status === 'Proses' || wo.status === 'Tunda' || wo.status === 'Menunggu') && (
                                        <DropdownMenuItem onClick={() => handleUpdateWorkOrderStatus(wo, 'Dikerjakan')} disabled={wo.status === 'Dikerjakan'}>
                                            <Timer className="mr-2 h-4 w-4" /> Dikerjakan
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleUpdateWorkOrderStatus(wo, 'Selesai')}>
                                        Selesai
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <Inbox className="mx-auto h-12 w-12" />
              <p className="mt-2">Anda tidak memiliki Work Order yang sedang aktif.</p>
              <p className="text-sm">Pilih kendaraan dari daftar di atas untuk memulai.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
