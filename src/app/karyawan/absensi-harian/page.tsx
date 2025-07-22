
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { calculateDistance } from '@/lib/utils';
import { MapPin, Camera, Loader2, CheckCircle, XCircle, LogIn, LogOut, Info, ThumbsUp, AlertTriangle, PartyPopper, Timer, Bed, Coffee } from 'lucide-react';
import type { AttendanceLocation, GlobalAttendanceRecord, UserLocation } from '@/lib/types';
import { useAuth } from '@/context/auth-provider';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const ATTENDANCE_LOCATIONS_KEY = 'app-attendance-locations';
const GLOBAL_ATTENDANCE_KEY = 'app-global-attendance-records';
const ATTENDANCE_RADIUS_METERS = 50000; // 50km for testing
const TIME_ZONE = 'Asia/Jakarta'; // WIB

const getPersonalAttendanceKey = (userId: string) => {
    const now = toZonedTime(new Date(), TIME_ZONE);
    const dateStr = format(now, 'yyyy-MM-dd');
    return `attendance-${userId}-${dateStr}`;
};

type PersonalAttendanceRecord = {
  clockIn?: string;
  isLate?: boolean;
  clockOut?: string;
};
type AttendanceAction = 'clockIn' | 'clockOut' | 'none';

export default function AttendancePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [locations, setLocations] = useState<AttendanceLocation[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<AttendanceLocation | null>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState<'idle' | 'success' | 'failed'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [personalAttendanceRecord, setPersonalAttendanceRecord] = useState<PersonalAttendanceRecord | null>(null);
    const [currentAction, setCurrentAction] = useState<AttendanceAction>('none');
    const [descriptionContent, setDescriptionContent] = useState({
        message: 'Pilih lokasi, aktifkan kamera, lalu lakukan absensi.',
        variant: 'default' as 'default' | 'destructive',
        icon: <Info className="h-5 w-5" />,
    });

    // Effect to load initial data
    useEffect(() => {
        try {
            const storedData = localStorage.getItem(ATTENDANCE_LOCATIONS_KEY);
            if (storedData) {
                setLocations(JSON.parse(storedData));
            }
        } catch (error) {
            console.error("Failed to load attendance locations from localStorage", error);
        }

        if (user) {
            try {
                const personalKey = getPersonalAttendanceKey(user.id);
                const storedRecord = localStorage.getItem(personalKey);
                if (storedRecord) {
                    setPersonalAttendanceRecord(JSON.parse(storedRecord));
                } else {
                    setPersonalAttendanceRecord(null);
                }
            } catch (error) {
                console.error("Failed to load today's attendance record", error);
            }
        }
    }, [user]);

    // Effect to determine the current possible action (clock-in/clock-out)
    useEffect(() => {
        const determineAction = () => {
            if (!user) {
              setCurrentAction('none');
              return;
            }

            // Already clocked out for the day
            if (personalAttendanceRecord?.clockOut) {
                setCurrentAction('none');
                return;
            }

            // Already clocked in, can clock out now
            if (personalAttendanceRecord?.clockIn) {
                setCurrentAction('clockOut');
                return;
            }
            
            // Not clocked in yet, can clock in now
            if (!personalAttendanceRecord?.clockIn) {
                setCurrentAction('clockIn');
                return;
            }
        };

        determineAction();
    }, [personalAttendanceRecord, user]);
    
    // Effect for the dynamic description message
    useEffect(() => {
        const getDynamicDescription = () => {
            if (!user) {
                return { message: 'Memuat data pengguna...', variant: 'default' as const, icon: <Loader2 className="h-5 w-5 animate-spin" /> };
            }

            const now = toZonedTime(new Date(), TIME_ZONE);
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const userName = user.username;
            const currentTime = hours * 100 + minutes;

            if (personalAttendanceRecord?.clockOut) {
                return { message: `Absensi hari ini sudah selesai, ${userName}. Sampai jumpa besok!`, variant: 'default' as const, icon: <PartyPopper className="h-5 w-5 text-green-500" /> };
            }

            if (personalAttendanceRecord?.clockIn) {
                return { message: `Selamat sore/malam Sdr. ${userName}, terimakasih sudah melakukan pekerjaan anda hari ini, tetap semangat dan berusaha besok lebih baik lagi. Selamat istirahat, terimakasih.`, variant: 'default' as const, icon: <ThumbsUp className="h-5 w-5 text-green-500" /> };
            }

            // If not clocked in, show a default welcome. Time-based messages disabled for testing.
            return { message: `Selamat datang ${userName}. Silakan lakukan absensi masuk.`, variant: 'default' as const, icon: <Info className="h-5 w-5" /> };
        };

        const newDescription = getDynamicDescription();
        setDescriptionContent(newDescription);

    }, [user, currentAction, personalAttendanceRecord]);

    const activateCamera = async () => {
        if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
            toast({ variant: 'destructive', title: 'Kamera Tidak Didukung', description: 'Browser Anda tidak mendukung akses kamera.' });
            setHasCameraPermission(false);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({ variant: 'destructive', title: 'Akses Kamera Ditolak', description: 'Mohon izinkan akses kamera di pengaturan browser Anda untuk melanjutkan.' });
        }
    };
    
    const capturePhoto = (): string | null => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState === 4) {
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                context.setTransform(1, 0, 0, 1, 0, 0);
                return canvas.toDataURL('image/jpeg', 0.8);
            }
        }
        return null;
    };
    
    const updateGlobalAttendance = (updateData: Partial<GlobalAttendanceRecord>) => {
        if (!user || !user.nik) return;
        try {
            const storedData = localStorage.getItem(GLOBAL_ATTENDANCE_KEY);
            const allRecords: GlobalAttendanceRecord[] = storedData ? JSON.parse(storedData) : [];
            const today = format(toZonedTime(new Date(), TIME_ZONE), 'yyyy-MM-dd');
            const userRecordIndex = allRecords.findIndex(r => r.nik === user.nik && r.date === today);

            if (userRecordIndex > -1) {
                allRecords[userRecordIndex] = { ...allRecords[userRecordIndex], ...updateData };
            } else {
                const newRecord: GlobalAttendanceRecord = {
                    nik: user.nik,
                    nama: user.username,
                    location: user.location as UserLocation,
                    date: today,
                    absenMasuk: null,
                    terlambat: null,
                    absenPulang: null,
                    lembur: null,
                    photoMasuk: null,
                    photoPulang: null,
                    ...updateData,
                };
                allRecords.push(newRecord);
            }
            localStorage.setItem(GLOBAL_ATTENDANCE_KEY, JSON.stringify(allRecords));
        } catch (error) {
            console.error("Failed to update global attendance", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan data absensi global.' });
        }
    };
    
    const handleAttendance = () => {
        if (!selectedLocation || currentAction === 'none') {
            toast({ variant: 'destructive', title: 'Aksi Tidak Tersedia', description: 'Pastikan Anda telah memilih lokasi dan berada dalam jam absensi.' });
            return;
        }

        if (!user || !user.nik) {
            toast({ variant: 'destructive', title: 'Absensi Gagal', description: 'Data NIK Anda tidak ditemukan. Hubungi HRD.' });
            return;
        }

        const photoDataUri = capturePhoto();
        if (!photoDataUri) {
            toast({ variant: 'destructive', title: 'Gagal Mengambil Foto', description: 'Tidak dapat mengambil gambar dari kamera. Pastikan kamera sudah aktif.' });
            return;
        }

        setIsCheckingIn(true);
        setAttendanceStatus('idle');
        setStatusMessage('Mendapatkan lokasi Anda...');

        if (!navigator.geolocation) {
            setIsCheckingIn(false);
            setStatusMessage('Geolokasi tidak didukung oleh browser ini.');
            toast({ variant: 'destructive', title: 'Error', description: 'Geolokasi tidak didukung.' });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // const userLat = position.coords.latitude;
                // const userLon = position.coords.longitude;
                // const distance = calculateDistance(userLat, userLon, selectedLocation.latitude, selectedLocation.longitude);
                
                // For testing purposes, we'll bypass the distance check.
                // if (distance <= ATTENDANCE_RADIUS_METERS) {
                
                const now = new Date();
                const nowZoned = toZonedTime(now, TIME_ZONE);
                
                if (currentAction === 'clockIn') {
                    const batasMasuk = toZonedTime(new Date(), TIME_ZONE);
                    batasMasuk.setHours(7, 30, 0, 0);
                    
                    const isLate = nowZoned.getTime() > batasMasuk.getTime();
                    let terlambatDuration = null;
                    
                    if (isLate) {
                        const selisihMs = nowZoned.getTime() - batasMasuk.getTime();
                        terlambatDuration = `${Math.floor(selisihMs / 60000)}m`;
                    }

                    const newPersonalRecord: PersonalAttendanceRecord = { clockIn: now.toISOString(), isLate };
                    setPersonalAttendanceRecord(newPersonalRecord);
                    localStorage.setItem(getPersonalAttendanceKey(user.id), JSON.stringify(newPersonalRecord));

                    updateGlobalAttendance({
                        absenMasuk: now.toISOString(),
                        terlambat: terlambatDuration,
                        photoMasuk: photoDataUri,
                    });

                    const toastDescription = isLate ? 'Anda tercatat terlambat hari ini.' : 'Absensi masuk berhasil dicatat.';
                    toast({ title: 'Absensi Masuk Berhasil', description: toastDescription });
                    setAttendanceStatus('success');
                    setStatusMessage(`Berhasil absen masuk pada ${nowZoned.toLocaleTimeString('id-ID')}.`);

                } else if (currentAction === 'clockOut') {
                    const updatedPersonalRecord = { ...personalAttendanceRecord, clockOut: now.toISOString() };
                    setPersonalAttendanceRecord(updatedPersonalRecord as PersonalAttendanceRecord);
                    localStorage.setItem(getPersonalAttendanceKey(user.id), JSON.stringify(updatedPersonalRecord as PersonalAttendanceRecord));
                    
                    updateGlobalAttendance({ absenPulang: now.toISOString(), photoPulang: photoDataUri });

                    toast({ title: 'Absensi Pulang Berhasil', description: 'Absensi pulang berhasil dicatat.' });
                    setAttendanceStatus('success');
                    setStatusMessage(`Berhasil absen pulang pada ${nowZoned.toLocaleTimeString('id-ID')}.`);
                }
                
                // } else {
                //     setAttendanceStatus('failed');
                //     const failMsg = `Anda terlalu jauh! Jarak Anda ${distance.toFixed(0)} meter dari lokasi. Radius yang diizinkan adalah ${ATTENDANCE_RADIUS_METERS} meter.`;
                //     setStatusMessage(failMsg);
                //     toast({ variant: 'destructive', title: 'Absensi Gagal', description: 'Anda berada di luar radius yang diizinkan.' });
                // }
                setIsCheckingIn(false);
            },
            (error) => {
                setIsCheckingIn(false);
                setAttendanceStatus('failed');
                let errMsg = 'Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.';
                if (error.code === error.PERMISSION_DENIED) {
                    errMsg = 'Izin lokasi ditolak. Mohon aktifkan di pengaturan browser.';
                }
                setStatusMessage(errMsg);
                toast({ variant: 'destructive', title: 'Error Lokasi', description: errMsg });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };
    
    const getButtonText = () => {
        if (isCheckingIn) return 'Memvalidasi...';
        switch (currentAction) {
            case 'clockIn': return 'Absen Masuk Sekarang';
            case 'clockOut': return 'Absen Pulang Sekarang';
            default:
                if (personalAttendanceRecord?.clockOut) {
                    return 'Absensi Hari Ini Selesai';
                }
                if (personalAttendanceRecord?.clockIn && !personalAttendanceRecord.clockOut) {
                    return 'Absen Pulang Sekarang'; // Enable for testing
                }
                return 'Absen Masuk Sekarang'; // Enable for testing
        }
    };
    
    const isButtonDisabled = isCheckingIn || hasCameraPermission !== true || locations.length === 0 || !selectedLocation || currentAction === 'none';

    return (
        <Card className="max-w-2xl mx-auto shadow-none border-0">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-6 w-6 text-primary" />
                    Absensi
                </CardTitle>
                <Alert variant={descriptionContent.variant} className="text-left [&>svg]:hidden">
                    <div className="flex items-start gap-3">
                        <div className="pt-0.5">{descriptionContent.icon}</div>
                        <div className="flex-1">
                            <AlertDescription className="text-foreground/90">
                                {descriptionContent.message}
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            </CardHeader>
            <CardContent className="space-y-6">
                <canvas ref={canvasRef} className="hidden" />
                <div className="space-y-2">
                    <label className="text-sm font-medium">Pilih Lokasi Batching Plant</label>
                    <Select onValueChange={(value) => setSelectedLocation(locations.find(l => l.name === value) || null)} disabled={locations.length === 0}>
                        <SelectTrigger>
                            <SelectValue placeholder={locations.length > 0 ? "Pilih lokasi Anda..." : "Tidak ada lokasi dikonfigurasi"} />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline style={{ transform: "scaleX(-1)" }} />
                    {hasCameraPermission !== true && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-background p-4 text-center">
                            {hasCameraPermission === null ? (
                                <>
                                    <Camera className="h-12 w-12 mb-4 text-primary" />
                                    <h3 className="text-lg font-bold">Aktifkan Kamera untuk Absensi</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Aplikasi memerlukan izin untuk menggunakan kamera Anda.</p>
                                    <Button onClick={activateCamera}>
                                        <Camera className="mr-2 h-4 w-4" />
                                        Aktifkan Kamera
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center bg-destructive/90 text-destructive-foreground p-6 rounded-lg">
                                    <XCircle className="h-10 w-10 mb-2"/>
                                    <p className="font-bold">Akses Kamera Ditolak</p>
                                    <p className="text-sm text-center mt-1">Mohon segarkan halaman dan berikan izin kamera di pengaturan browser Anda.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {personalAttendanceRecord?.clockIn && (
                    <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/30 border-blue-500">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle>Status Absensi Hari Ini</AlertTitle>
                        <AlertDescription>
                            <p>Masuk: <span className="font-semibold">{new Date(personalAttendanceRecord.clockIn).toLocaleTimeString('id-ID')}</span> {personalAttendanceRecord.isLate && <span className="text-destructive font-bold">(Terlambat)</span>}</p>
                            {personalAttendanceRecord.clockOut && <p>Pulang: <span className="font-semibold">{new Date(personalAttendanceRecord.clockOut).toLocaleTimeString('id-ID')}</span></p>}
                        </AlertDescription>
                    </Alert>
                )}
                
                {statusMessage && (
                    <Alert variant={attendanceStatus === 'success' ? 'default' : attendanceStatus === 'failed' ? 'destructive' : 'default'} className={attendanceStatus === 'success' ? 'bg-green-100 dark:bg-green-900/40 border-green-500' : ''}>
                        {attendanceStatus === 'success' && <CheckCircle className="h-4 w-4" />}
                        {attendanceStatus === 'failed' && <XCircle className="h-4 w-4" />}
                        {isCheckingIn && <Loader2 className="h-4 w-4 animate-spin" />}
                        <AlertTitle>
                            {attendanceStatus === 'success' ? 'Berhasil!' : attendanceStatus === 'failed' ? 'Gagal!' : 'Status'}
                        </AlertTitle>
                        <AlertDescription>
                            {statusMessage}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleAttendance} disabled={isCheckingIn || hasCameraPermission !== true || locations.length === 0 || !selectedLocation} className="w-full" size="lg">
                    {isCheckingIn ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        currentAction === 'clockIn' ? <LogIn className="mr-2 h-5 w-5" /> :
                        currentAction === 'clockOut' ? <LogOut className="mr-2 h-5 w-5" /> :
                        <MapPin className="mr-2 h-5 w-5" />
                    )}
                    {getButtonText()}
                </Button>
            </CardFooter>
        </Card>
    );
}

    