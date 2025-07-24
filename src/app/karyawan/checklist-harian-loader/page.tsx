
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-provider';
import { format } from 'date-fns';
import { ClipboardCheck, Camera, Loader2, Upload, CheckCircle } from 'lucide-react';
import type { TruckChecklistItem, TruckChecklistReport, ChecklistStatus, UserLocation, WorkOrder } from '@/lib/types';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const CHECKLIST_COLLECTION_KEY = 'loader-checklists';
const WORK_ORDER_COLLECTION_KEY = 'work-orders';

const checklistItemsDefinition = [
    { id: 'oli_mesin', label: 'Level Oli Mesin' },
    { id: 'oli_hidraulik', label: 'Level Oli Hidraulik' },
    { id: 'air_radiator', label: 'Level Air Radiator' },
    { id: 'tekanan_ban', label: 'Kondisi & Tekanan Ban' },
    { id: 'bucket_gigi', label: 'Kondisi Baket' },
    { id: 'fungsi_listrik', label: 'Fungsi Klakson & Lampu-lampu' },
    { id: 'kaca_wiper', label: 'Kaca Spion, Kaca Jendela & Wiper' },
    { id: 'kebersihan', label: 'Kebersihan Kabin' },
    { id: 'kerusakan_lain', label: 'Kerusakan' },
];

const getDailyChecklistId = (userId: string) => `loader-checklist-${userId}-${format(new Date(), 'yyyy-MM-dd')}`;

const getInitialChecklistState = () => checklistItemsDefinition.map(item => ({ ...item, status: 'baik' as ChecklistStatus, photo: null, notes: '' }));

export default function ChecklistHarianLoaderPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [checklistItems, setChecklistItems] = useState<TruckChecklistItem[]>(getInitialChecklistState());
    const [isLoading, setIsLoading] = useState(false);
    const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | null>(null);
    const [cameraForItem, setCameraForItem] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

     useEffect(() => {
        if (user) {
            try {
                const storedReports = localStorage.getItem(CHECKLIST_COLLECTION_KEY);
                const allReports: TruckChecklistReport[] = storedReports ? JSON.parse(storedReports) : [];
                const dailyId = getDailyChecklistId(user.id);
                const todaysReport = allReports.find(r => r.id === dailyId);

                if (todaysReport) {
                    // Don't set last submission time anymore to allow re-submission
                }
            } catch (error) {
                console.error("Failed to load today's report from localStorage", error);
            }
        }
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
    
    const createWorkOrderFromChecklist = (report: TruckChecklistReport) => {
        if (!user) return;
        const damagedItems = report.items.filter(item => item.status === 'rusak' || item.status === 'perlu_perhatian');
    
        if (damagedItems.length === 0) {
            return;
        }
    
        const storedWorkOrders = localStorage.getItem(WORK_ORDER_COLLECTION_KEY);
        const allWorkOrders: WorkOrder[] = storedWorkOrders ? JSON.parse(storedWorkOrders) : [];
        
        const existingWoIndex = allWorkOrders.findIndex(wo => wo.vehicle.userId === user.id && wo.status !== 'Selesai');

        if (existingWoIndex > -1) {
            const existingWo = allWorkOrders[existingWoIndex];
            const existingDamagedIds = new Set(existingWo.vehicle.damagedItems.map(item => item.id));
            const newUniqueDamagedItems = damagedItems.filter(item => !existingDamagedIds.has(item.id));
    
            if (newUniqueDamagedItems.length > 0) {
                existingWo.vehicle.damagedItems.push(...newUniqueDamagedItems);
                existingWo.vehicle.timestamp = report.timestamp; // Update with latest report time
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
        
        try {
            const report: TruckChecklistReport = {
                id: dailyId,
                userId: user.id,
                userNik: user.nik,
                username: user.username,
                location: user.location as UserLocation,
                timestamp: submissionTime.toISOString(),
                items: checklistItems,
                vehicleType: 'loader',
            };
            
            const storedReports = localStorage.getItem(CHECKLIST_COLLECTION_KEY);
            let allReports: TruckChecklistReport[] = storedReports ? JSON.parse(storedReports) : [];
            const existingReportIndex = allReports.findIndex(r => r.id === dailyId);

            if (existingReportIndex > -1) {
                allReports[existingReportIndex] = report; // Overwrite today's report
            } else {
                allReports.push(report);
            }
            
            localStorage.setItem(CHECKLIST_COLLECTION_KEY, JSON.stringify(allReports));

            toast({ title: 'Berhasil', description: 'Checklist harian berhasil dikirim.' });
            setLastSubmissionTime(submissionTime);

            createWorkOrderFromChecklist(report);
            
            // Optionally reset form if desired after submission
            // setChecklistItems(getInitialChecklistState());

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
                    Checklist Harian Wheel Loader
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
                                                placeholder="Contoh: Ban depan kiri sobek, gigi bucket patah..."
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

    