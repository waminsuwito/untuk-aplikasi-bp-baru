
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
import { Truck, Trash2, Printer } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { printElement } from '@/lib/utils';

const MATERIAL_KELUAR_STORAGE_KEY = 'app-material-keluar';
const materialOptions = ["Batu", "Pasir", "Semen", "Obat Beton"];

interface MaterialKeluar {
  id: string;
  namaMaterial: string;
  nomorKendaraan: string;
  namaSopir: string;
  volume: string;
  alamatPengiriman: string;
  keterangan: string;
  waktu: string;
}

const initialFormState = {
  namaMaterial: '',
  nomorKendaraan: '',
  namaSopir: '',
  volume: '',
  alamatPengiriman: '',
  keterangan: '',
};

export default function PengirimanMaterialPage() {
  const [daftarMaterialKeluar, setDaftarMaterialKeluar] = useState<MaterialKeluar[]>([]);
  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(MATERIAL_KELUAR_STORAGE_KEY);
      if (storedData) {
        setDaftarMaterialKeluar(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const saveToLocalStorage = (data: MaterialKeluar[]) => {
    try {
      localStorage.setItem(MATERIAL_KELUAR_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  };

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

  const handleAddPengiriman = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields: (keyof typeof formState)[] = ['namaMaterial', 'nomorKendaraan', 'namaSopir', 'volume', 'alamatPengiriman'];
    for (const field of requiredFields) {
        if (!formState[field].trim()) {
            alert(`Kolom "${field.replace(/([A-Z])/g, ' $1').trim()}" harus diisi.`);
            return;
        }
    }

    const unit = getUnit(formState.namaMaterial);
    const newItem: MaterialKeluar = {
      id: new Date().toISOString(),
      ...formState,
      volume: `${formState.volume} ${unit}`.trim(),
      waktu: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
    };
    const updatedData = [...daftarMaterialKeluar, newItem];
    setDaftarMaterialKeluar(updatedData);
    saveToLocalStorage(updatedData);
    setFormState(initialFormState); // Reset form
  };

  const handleDeleteItem = (id: string) => {
    const updatedData = daftarMaterialKeluar.filter(item => item.id !== id);
    setDaftarMaterialKeluar(updatedData);
    saveToLocalStorage(updatedData);
  };
  
  const unit = getUnit(formState.namaMaterial);

  return (
    <div className="space-y-6">
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Pengiriman Material
          </CardTitle>
          <CardDescription>
            Catat material yang keluar dari gudang untuk pengiriman.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPengiriman} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="namaMaterial">Nama Material</Label>
              <Select
                name="namaMaterial"
                value={formState.namaMaterial}
                onValueChange={(value) => handleSelectChange('namaMaterial', value)}
              >
                <SelectTrigger id="namaMaterial">
                  <SelectValue placeholder="Pilih material" />
                </SelectTrigger>
                <SelectContent>
                  {materialOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="nomorKendaraan">Nomor Kendaraan</Label>
              <Input
                id="nomorKendaraan"
                name="nomorKendaraan"
                value={formState.nomorKendaraan}
                onChange={handleInputChange}
                placeholder="Contoh: BM 1234 XY"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="namaSopir">Nama Sopir</Label>
              <Input
                id="namaSopir"
                name="namaSopir"
                value={formState.namaSopir}
                onChange={handleInputChange}
                placeholder="Contoh: Budi"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume">Volume / Jumlah {unit && `(${unit})`}</Label>
              <Input
                id="volume"
                name="volume"
                type="number"
                value={formState.volume}
                onChange={handleInputChange}
                placeholder={unit ? "Contoh: 10" : "Pilih material"}
                disabled={!formState.namaMaterial}
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="alamatPengiriman">Alamat Pengiriman</Label>
              <Input
                id="alamatPengiriman"
                name="alamatPengiriman"
                value={formState.alamatPengiriman}
                onChange={handleInputChange}
                placeholder="Contoh: Jl. Sudirman No. 1"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Input
                id="keterangan"
                name="keterangan"
                value={formState.keterangan}
                onChange={handleInputChange}
                placeholder="Opsional"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end">
              <Button type="submit" className="w-full md:w-auto">Tambah Pengiriman</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card id="print-content">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Riwayat Pengiriman Material</CardTitle>
              <CardDescription>
                Daftar material yang telah dikirim.
              </CardDescription>
            </div>
            <Button onClick={() => printElement('print-content')} className="no-print">
              <Printer className="mr-2 h-4 w-4" /> Cetak
            </Button>
          </div>
          <div className="print-only mb-6 text-center">
            <h1 className="text-xl font-bold">Riwayat Pengiriman Material</h1>
          </div>
        </CardHeader>
        <CardContent>
          {daftarMaterialKeluar.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Nama Material</TableHead>
                            <TableHead>No. Kendaraan</TableHead>
                            <TableHead>Nama Sopir</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead className="text-center no-print">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {daftarMaterialKeluar.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.waktu}</TableCell>
                                <TableCell>{item.namaMaterial}</TableCell>
                                <TableCell>{item.nomorKendaraan}</TableCell>
                                <TableCell>{item.namaSopir}</TableCell>
                                <TableCell>{item.volume}</TableCell>
                                <TableCell>{item.alamatPengiriman}</TableCell>
                                <TableCell>{item.keterangan}</TableCell>
                                <TableCell className="text-center no-print">
                                    <Button variant="destructive" size="icon" onClick={() => handleDeleteItem(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Hapus</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>Belum ada data pengiriman material.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
