
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
import { Anchor, Trash2, CheckCircle, Coffee, Play, Printer } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn, printElement } from '@/lib/utils';
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
import type { BongkarMaterial, BongkarStatus, UserLocation } from '@/lib/types';
import { useAuth } from '@/context/auth-provider';
import { firestore } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot, deleteDoc, query, where } from 'firebase/firestore';


const BONGKAR_MATERIAL_COLLECTION = 'unloading-activities';
const materialOptions = ["Batu", "Pasir", "Semen", "Obat Beton"];

const initialFormState = {
  namaMaterial: '',
  kapalKendaraan: '',
  namaKaptenSopir: '',
  volume: '',
  keterangan: '',
};

export default function BongkarMaterialPage() {
  const { user } = useAuth();
  const [daftarBongkar, setDaftarBongkar] = useState<BongkarMaterial[]>([]);
  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    if (!user || !user.location) return;

    const q = query(
      collection(firestore, BONGKAR_MATERIAL_COLLECTION),
      where('location', '==', user.location)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data: BongkarMaterial[] = [];
        querySnapshot.forEach((doc) => {
            data.push(doc.data() as BongkarMaterial);
        });
        data.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
        setDaftarBongkar(data);
    }, (error) => {
        console.error("Error fetching unloading activities:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({...prev, [name]: value}));
  };

  const getUnit = (material: string): string => {
    switch (material) {
        case "Batu":
        case "Pasir":
            return "M³";
        case "Semen":
            return "Kg";
        case "Obat Beton":
            return "Liter";
        default:
            return "";
    }
  };

  const handleTambahBongkar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.location) return;

    const requiredFields: (keyof typeof initialFormState)[] = ['namaMaterial', 'kapalKendaraan', 'namaKaptenSopir', 'volume'];
    for (const field of requiredFields) {
        if (!formState[field].trim()) {
            alert(`Kolom "${field.replace(/([A-Z])/g, ' $1').trim()}" harus diisi.`);
            return;
        }
    }

    const unit = getUnit(formState.namaMaterial);
    const id = new Date().toISOString();
    const newItem: BongkarMaterial = {
      id: id,
      ...formState,
      volume: `${formState.volume} ${unit}`.trim(),
      waktuMulai: null,
      waktuSelesai: null,
      status: 'Belum Dimulai',
      waktuMulaiIstirahat: null,
      totalIstirahatMs: 0,
      location: user.location,
    };
    
    try {
        await setDoc(doc(firestore, BONGKAR_MATERIAL_COLLECTION, id), newItem);
        setFormState(initialFormState); // Reset form
    } catch(error) {
        console.error("Failed to add unloading activity:", error);
    }
  };

  const updateFirestoreDoc = async (id: string, updateData: Partial<BongkarMaterial>) => {
    const docRef = doc(firestore, BONGKAR_MATERIAL_COLLECTION, id);
    await setDoc(docRef, updateData, { merge: true });
  }

  const handleMulaiProses = (id: string) => {
     updateFirestoreDoc(id, {
        status: 'Proses' as const,
        waktuMulai: new Date().toISOString(),
      });
  };

  const handleSelesaiBongkar = (id: string) => {
    const itemToUpdate = daftarBongkar.find(item => item.id === id);
    if (!itemToUpdate) return;
    
    const waktuSelesaiObj = new Date();
    let finalTotalIstirahatMs = itemToUpdate.totalIstirahatMs || 0;
    
    if (itemToUpdate.status === 'Istirahat' && itemToUpdate.waktuMulaiIstirahat) {
       try {
           const istirahatMulai = new Date(itemToUpdate.waktuMulaiIstirahat).getTime();
           if (!isNaN(istirahatMulai)) {
             const istirahatSelesai = waktuSelesaiObj.getTime();
             const durasiIstirahatIni = istirahatSelesai - istirahatMulai;
             finalTotalIstirahatMs += durasiIstirahatIni;
           }
       } catch (e) { console.error("Invalid break start date", e); }
    }
    
    updateFirestoreDoc(id, {
        status: 'Selesai' as const,
        waktuSelesai: waktuSelesaiObj.toISOString(),
        totalIstirahatMs: finalTotalIstirahatMs,
        waktuMulaiIstirahat: null,
    });
  };

  const handleToggleIstirahat = (id: string) => {
    const itemToUpdate = daftarBongkar.find(item => item.id === id);
    if (!itemToUpdate) return;
    
    if (itemToUpdate.status === 'Proses') {
      updateFirestoreDoc(id, { 
        status: 'Istirahat' as const,
        waktuMulaiIstirahat: new Date().toISOString(),
      });
    } else if (itemToUpdate.status === 'Istirahat') {
      let totalIstirahatBaru = itemToUpdate.totalIstirahatMs || 0;
      if (itemToUpdate.waktuMulaiIstirahat) {
          try {
              const istirahatMulai = new Date(itemToUpdate.waktuMulaiIstirahat).getTime();
              if (!isNaN(istirahatMulai)) {
                const istirahatSelesai = new Date().getTime();
                const durasiIstirahatIni = istirahatSelesai - istirahatMulai;
                totalIstirahatBaru += durasiIstirahatIni;
              }
          } catch(e) { console.error("Invalid break start date on resume", e); }
      }
      
      updateFirestoreDoc(id, { 
        status: 'Proses' as const,
        waktuMulaiIstirahat: null,
        totalIstirahatMs: totalIstirahatBaru,
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    await deleteDoc(doc(firestore, BONGKAR_MATERIAL_COLLECTION, id));
  };

  const calculatePerformance = (item: BongkarMaterial) => {
    if (item.status !== 'Selesai' || !item.waktuMulai || !item.waktuSelesai) {
      return { lamaBongkar: '-', rataRata: '-' };
    }
    
    try {
      const mulaiMs = new Date(item.waktuMulai).getTime();
      const selesaiMs = new Date(item.waktuSelesai).getTime();
      
      if (isNaN(mulaiMs) || isNaN(selesaiMs)) {
        return { lamaBongkar: 'Error', rataRata: 'Error' };
      }

      const totalDurasiMs = selesaiMs - mulaiMs;
      const durasiKerjaMs = totalDurasiMs - (item.totalIstirahatMs || 0);

      if (durasiKerjaMs < 0) {
        return { lamaBongkar: 'N/A', rataRata: 'N/A' };
      }

      const jam = Math.floor(durasiKerjaMs / (1000 * 60 * 60));
      const menit = Math.floor((durasiKerjaMs % (1000 * 60 * 60)) / (1000 * 60));
      const lamaBongkar = `${jam} jam ${menit} mnt`;

      const volumeValue = parseFloat(item.volume);
      const volumeUnit = item.volume.split(' ').slice(1).join(' ');
      const durasiKerjaJam = durasiKerjaMs / (1000 * 60 * 60);

      let rataRata = '-';
      if (durasiKerjaJam > 0 && !isNaN(volumeValue)) {
        const rate = volumeValue / durasiKerjaJam;
        rataRata = `${rate.toFixed(2)} ${volumeUnit}/jam`;
      }

      return { lamaBongkar, rataRata };
    } catch (error) {
      console.error("Error calculating performance:", error);
      return { lamaBongkar: 'Error', rataRata: 'Error' };
    }
  };
  
  const unit = getUnit(formState.namaMaterial);

  return (
    <div className="space-y-6">
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Anchor className="h-6 w-6 text-primary" />
            Bongkar Material
          </CardTitle>
          <CardDescription>
            Catat aktivitas bongkar material dari kapal atau kendaraan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTambahBongkar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="namaMaterial">Nama Material</Label>
              <Select name="namaMaterial" value={formState.namaMaterial} onValueChange={(value) => handleSelectChange('namaMaterial', value)}>
                <SelectTrigger id="namaMaterial"><SelectValue placeholder="Pilih material" /></SelectTrigger>
                <SelectContent>
                  {materialOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kapalKendaraan">Kapal/Kendaraan</Label>
              <Input id="kapalKendaraan" name="kapalKendaraan" value={formState.kapalKendaraan} onChange={handleInputChange} placeholder="Contoh: KM. Bahari / BM 1234 XY" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namaKaptenSopir">Nama Kapten/Sopir</Label>
              <Input id="namaKaptenSopir" name="namaKaptenSopir" value={formState.namaKaptenSopir} onChange={handleInputChange} placeholder="Contoh: Budi" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume">Volume / Jumlah {unit && `(${unit})`}</Label>
              <Input id="volume" name="volume" type="number" value={formState.volume} onChange={handleInputChange} placeholder={unit ? "Contoh: 1000" : "Pilih material"} disabled={!formState.namaMaterial} />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Input id="keterangan" name="keterangan" value={formState.keterangan} onChange={handleInputChange} placeholder="Opsional" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end">
              <Button type="submit" className="w-full md:w-auto">Tambah ke Daftar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card id="print-content">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Riwayat Bongkar Material</CardTitle>
              <CardDescription>
                Daftar aktivitas bongkar material yang sedang berjalan dan yang sudah selesai.
              </CardDescription>
            </div>
            <Button onClick={() => printElement('print-content')} className="no-print">
              <Printer className="mr-2 h-4 w-4" /> Cetak
            </Button>
          </div>
          <div className="print-only mb-6 text-center">
            <h1 className="text-xl font-bold">Riwayat Bongkar Material</h1>
          </div>
        </CardHeader>
        <CardContent>
          {daftarBongkar.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Mulai Bongkar</TableHead>
                            <TableHead className="text-center">Istirahat (menit)</TableHead>
                            <TableHead>Selesai Bongkar</TableHead>
                            <TableHead>Nama Material</TableHead>
                            <TableHead>Kapal/Kendaraan</TableHead>
                            <TableHead>Kapten/Sopir</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Lama Bongkar</TableHead>
                            <TableHead>Rata-rata /jam</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead className="text-center no-print">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {daftarBongkar.map((item) => {
                            const { lamaBongkar, rataRata } = calculatePerformance(item);
                            return (
                                <TableRow key={item.id}>
                                    <TableCell>
                                    <Badge 
                                        variant={
                                        item.status === 'Selesai' ? 'default' :
                                        item.status === 'Belum Dimulai' ? 'outline' :
                                        'secondary'
                                        }
                                        className={cn(item.status === 'Istirahat' && 'bg-accent text-accent-foreground hover:bg-accent/80')}
                                    >
                                        {item.status}
                                    </Badge>
                                    </TableCell>
                                    <TableCell>{item.waktuMulai ? new Date(item.waktuMulai).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</TableCell>
                                    <TableCell className="text-center">
                                    {Math.floor((item.totalIstirahatMs || 0) / 60000)}
                                    </TableCell>
                                    <TableCell>{item.waktuSelesai ? new Date(item.waktuSelesai).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</TableCell>
                                    <TableCell>{item.namaMaterial}</TableCell>
                                    <TableCell>{item.kapalKendaraan}</TableCell>
                                    <TableCell>{item.namaKaptenSopir}</TableCell>
                                    <TableCell>{item.volume}</TableCell>
                                    <TableCell>{lamaBongkar}</TableCell>
                                    <TableCell>{rataRata}</TableCell>
                                    <TableCell>{item.keterangan}</TableCell>
                                    <TableCell className="text-center space-x-2 no-print">
                                        {item.status === 'Belum Dimulai' && (
                                        <Button variant="default" size="sm" onClick={() => handleMulaiProses(item.id)}>
                                            <Play className="h-4 w-4 mr-2" />
                                            Mulai
                                        </Button>
                                        )}
                                        {item.status === 'Proses' && (
                                            <>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                      <Coffee className="h-4 w-4 mr-2" />
                                                      Istirahat
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Konfirmasi Istirahat</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Apakah Anda yakin ingin memulai waktu istirahat? Waktu kerja akan dijeda.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleToggleIstirahat(item.id)}>
                                                        Ya, Mulai Istirahat
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>

                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button variant="default" size="sm">
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                        Selesai
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Konfirmasi Selesai</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Apakah Anda yakin ingin menyelesaikan proses bongkar ini? Tindakan ini tidak dapat dibatalkan.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleSelesaiBongkar(item.id)}>
                                                        Ya, Selesaikan
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}
                                        {item.status === 'Istirahat' && (
                                            <>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button variant="default" size="sm">
                                                      <Play className="h-4 w-4 mr-2" />
                                                      Lanjut
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Konfirmasi Lanjut Kerja</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Apakah Anda yakin ingin melanjutkan proses bongkar? Waktu kerja akan kembali dihitung.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleToggleIstirahat(item.id)}>
                                                        Ya, Lanjutkan
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                                
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button variant="secondary" size="sm">
                                                      <CheckCircle className="h-4 w-4 mr-2" />
                                                      Selesai
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Konfirmasi Selesai</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Apakah Anda yakin ingin menyelesaikan proses bongkar ini bahkan saat sedang istirahat? Tindakan ini tidak dapat dibatalkan.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleSelesaiBongkar(item.id)}>
                                                        Ya, Selesaikan
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}

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
                                                Apakah Anda yakin ingin menghapus data bongkar untuk <span className='font-bold'>{item.kapalKendaraan}</span>? Tindakan ini tidak dapat dibatalkan.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Batal</AlertDialogCancel>
                                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteItem(item.id)}>
                                                Ya, Hapus
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>Belum ada data bongkar material.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
