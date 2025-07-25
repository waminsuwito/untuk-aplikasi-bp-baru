
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-provider';
import { format } from 'date-fns';
import { ClipboardCheck, Camera, Loader2, CheckCircle, Upload } from 'lucide-react';
import type { TruckChecklistItem, TruckChecklistReport, ChecklistStatus, UserLocation, WorkOrder } from '@/lib/types';
import Image from 'next/image';

const CHECKLIST_COLLECTION_KEY = 'tm-checklists';
const WORK_ORDER_COLLECTION_KEY = 'work-orders';

const checklistItemsDefinition = [
    { id: 'oli_mesin', label: 'Level Oli Mesin' },
    { id: 'oli_hidraulik', label: 'Level Oli Hidraulik' },
    { id: 'air_radiator', label: 'Level Air Radiator' },
    { id: 'minyak_rem', label: 'Level Minyak Rem' },
    { id: 'air_aki', label: 'Level Air Aki' },
    { id: 'fungsi_listrik', label: 'Fungsi Klakson, Alarm Mundur, Lampu-lampu' },
    { id: 'kaca_wiper', label: 'Kaca Spion, Wiper' },
    { id: 'kebersihan', label: 'Kebersihan Kabin & Gentong Mixer' },
    { id: 'kerusakan_lain', label: 'Kerusakan Lainnya' },
];

const getDailyChecklistId = (userId: string) => `tm-checklist-${userId}-${format(new Date(), 'yyyy-MM-dd')}`;

export default function ChecklistHarianTmPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [checklistItems, setChecklistItems] = useState<TruckChecklistItem[]>(
        checklistItemsDefinition.map(item => ({ ...item, status: 'baik', photo: null, notes: '' }))
    );
    const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [cameraForItem, setCameraForItem] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // No initial data fetching, this page is for submissions.
    }, [user]);

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraForItem(null);
    };

    const handleActivateCamera = async (itemId: string) => {
        if (cameraForItem === itemId) {
            stopCamera();
            return;
        }
        stopCamera(); 

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraForItem(itemId);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Kamera Gagal', description: 'Gagal mengakses kamera. Mohon berikan izin.' });
        }
    };

    const capturePhoto = (): string | null => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                stopCamera();
                return canvas.toDataURL('image/jpeg');
            }
        }
        return null;
    };

    const handleCaptureAndSetPhoto = (itemId: string) => {
        const photoDataUri = capturePhoto();
        if (photoDataUri) {
            setChecklistItems(prevItems =>
                prevItems.map(item =>
                    item.id === itemId ? { ...item, photo: photoDataUri } : item
                )
            );
        }
    };

    const handleStatusChange = (itemId: string, status: ChecklistStatus) => {
        setChecklistItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, status } : item
            )
        );
    };

    const handleNotesChange = (itemId: string, notes: string) => {
        setChecklistItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, notes: notes.toUpperCase() } : item
            )
        );
    };

    const createWorkOrderFromChecklist = async (report: TruckChecklistReport) => {
        if (!user) return;
        const damagedItems = report.items.filter(item => item.status === 'rusak' || item.status === 'perlu_perhatian');
    
        if (damagedItems.length === 0) {
            return;
        }

        const storedWorkOrders = localStorage.getItem(WORK_ORDER_COLLECTION_KEY);
        const allWorkOrders: WorkOrder[] = storedWorkOrders ? JSON.parse(storedWorkOrders) : [];
        
        const existingWoIndex = allWorkOrders.findIndex(
            wo => wo.vehicle.userId === user.id && wo.status !== 'Selesai'
        );
        
        if (existingWoIndex > -1) {
            const existingWo = allWorkOrders[existingWoIndex];
            const existingDamagedIds = new Set(existingWo.vehicle.damagedItems.map(item => item.id));
            const newUniqueDamagedItems = damagedItems.filter(item => !existingDamagedIds.has(item.id));
    
            if (newUniqueDamagedItems.length > 0) {
                existingWo.vehicle.damagedItems.push(...newUniqueDamagedItems);
                existingWo.vehicle.timestamp = report.timestamp;
                allWorkOrders[existingWoIndex] = existingWo;

                localStorage.setItem(WORK_ORDER_COLLECTION_KEY, JSON.stringify(allWorkOrders));
                toast({
                    title: "Work Order Diperbarui",
                    description: "Laporan kerusakan baru telah ditambahkan ke Work Order yang sudah ada.",
                });
            }
        } else {
            const workOrderId = `WO-${user.id}-${Date.now()}`;
            const newWorkOrder: WorkOrder = {
                id: workOrderId,
                assignedMechanics: [],
                vehicle: {
                    reportId: report.id,
                    userId: report.userId,
                    userNik: report.userNik,
                    username: report.username,
                    location: report.location,
                    timestamp: report.timestamp,
                    damagedItems: damagedItems,
                },
                startTime: new Date().toISOString(),
                status: 'Menunggu',
                actualDamagesNotes: '',
                usedSpareParts: [],
            };
            allWorkOrders.push(newWorkOrder);
            localStorage.setItem(WORK_ORDER_COLLECTION_KEY, JSON.stringify(allWorkOrders));
            toast({
                title: "Work Order Dibuat",
                description: `Laporan kerusakan otomatis dibuat untuk Mekanik.`,
            });
        }
    };


    const handleSubmit = async () => {
        if (!user || !user.nik || !user.location) {
            toast({ variant: 'destructive', title: 'Error', description: 'Data pengguna tidak valid.' });
            return;
        }

        const isAllChecked = checklistItems.every(item => item.status !== null);
        if (!isAllChecked) {
            toast({ variant: 'destructive', title: 'Form Belum Lengkap', description: 'Mohon periksa dan isi semua item checklist.' });
            return;
        }
        
        setIsLoading(true);
        const submissionTime = new Date();
        const dailyId = getDailyChecklistId(user.id);
        const report: TruckChecklistReport = {
            id: dailyId,
            userId: user.id,
            userNik: user.nik,
            username: user.username,
            location: user.location as UserLocation,
            timestamp: submissionTime.toISOString(),
            items: checklistItems,
            vehicleType: 'tm',
        };

        try {
            const storedChecklists = localStorage.getItem(CHECKLIST_COLLECTION_KEY);
            const allChecklists: TruckChecklistReport[] = storedChecklists ? JSON.parse(storedChecklists) : [];
            const reportIndex = allChecklists.findIndex(r => r.id === dailyId);
            
            if (reportIndex > -1) {
                allChecklists[reportIndex] = report;
            } else {
                allChecklists.push(report);
            }
            
            localStorage.setItem(CHECKLIST_COLLECTION_KEY, JSON.stringify(allChecklists));

            toast({ title: 'Berhasil', description: 'Checklist harian berhasil dikirim.' });
            setLastSubmissionTime(submissionTime);

            await createWorkOrderFromChecklist(report);
            
        } catch (error) {
            console.error("Failed to save checklist report", error);
            toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan laporan.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-6 w-6 text-primary" />
                    Checklist Harian Truck Mixer (TM)
                </CardTitle>
                <CardDescription>
                    Lakukan pemeriksaan berikut sebelum memulai operasi harian. Anda bisa mengirim ulang checklist jika kondisi kendaraan berubah.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <canvas ref={canvasRef} className="hidden" />

                {lastSubmissionTime && (
                    <Alert variant="default" className="bg-blue-100 dark:bg-blue-900/40 border-blue-500">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle>Laporan Terakhir Dikirim</AlertTitle>
                        <AlertDescription>
                            Anda terakhir mengirimkan laporan pada: {format(lastSubmissionTime, 'dd MMMM yyyy, HH:mm:ss')}.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-8">
                    {checklistItems.map((item, index) => (
                        <div key={item.id} className="border-b pb-6">
                            <Label className="text-base font-semibold">{index + 1}. {item.label}</Label>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className="space-y-4">
                                    <RadioGroup
                                        value={item.status || ""}
                                        onValueChange={(value) => handleStatusChange(item.id, value as ChecklistStatus)}
                                        className="space-y-2"
                                        disabled={isLoading}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="baik" id={`${item.id}-baik`} />
                                            <Label htmlFor={`${item.id}-baik`}>Baik</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="rusak" id={`${item.id}-rusak`} />
                                            <Label htmlFor={`${item.id}-rusak`}>Rusak</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="perlu_perhatian" id={`${item.id}-perhatian`} />
                                            <Label htmlFor={`${item.id}-perhatian`}>Perlu Perhatian</Label>
                                        </div>
                                    </RadioGroup>

                                    {(item.status === 'rusak' || item.status === 'perlu_perhatian') && (
                                        <div className="space-y-2 pt-2">
                                            <Label htmlFor={`notes-${item.id}`} className="text-sm font-medium">
                                                Catatan (jelaskan kerusakan/detail)
                                            </Label>
                                            <Textarea
                                                id={`notes-${item.id}`}
                                                placeholder="Contoh: Oli rembes sedikit, alarm mundur mati..."
                                                value={item.notes || ''}
                                                onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                                style={{ textTransform: 'uppercase' }}
                                                disabled={isLoading}
                                                rows={3}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {item.photo ? (
                                        <div className="relative w-48 h-36">
                                            <Image src={item.photo} alt={`Foto untuk ${item.label}`} layout="fill" objectFit="cover" className="rounded-md border" />
                                        </div>
                                    ) : cameraForItem === item.id ? (
                                        <div className="space-y-2">
                                            <div className="relative aspect-video w-full max-w-sm bg-muted rounded-md overflow-hidden border">
                                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                            </div>
                                            <Button onClick={() => handleCaptureAndSetPhoto(item.id)} size="sm">
                                                <Camera className="mr-2 h-4 w-4" /> Ambil Foto
                                            </Button>
                                        </div>
                                    ) : (
                                        (item.status === 'rusak' || item.status === 'perlu_perhatian') && (
                                            <Button
                                                variant="outline"
                                                onClick={() => handleActivateCamera(item.id)}
                                                disabled={isLoading}
                                            >
                                                <Upload className="mr-2 h-4 w-4" /> Upload Foto
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                 <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        'Kirim Checklist'
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
