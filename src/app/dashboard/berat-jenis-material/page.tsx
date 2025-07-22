
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Scale, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'app-material-specific-gravity';

const materialDefinitions = [
  { key: 'pasir1', label: 'Pasir 1' },
  { key: 'pasir2', label: 'Pasir 2' },
  { key: 'batu1', label: 'Batu 1' },
  { key: 'batu2', label: 'Batu 2' },
  { key: 'semen', label: 'Semen' },
  { key: 'air', label: 'Air' },
];

type MaterialKey = typeof materialDefinitions[number]['key'];

type SpecificGravityData = Record<MaterialKey, number>;

const defaultValues: SpecificGravityData = {
  pasir1: 2.65,
  pasir2: 2.65,
  batu1: 2.7,
  batu2: 2.7,
  semen: 3.15,
  air: 1.0,
};

export default function BeratJenisMaterialPage() {
  const [data, setData] = useState<SpecificGravityData>(defaultValues);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        // Merge stored data with defaults to ensure all keys are present
        const parsedData = JSON.parse(storedData);
        setData({ ...defaultValues, ...parsedData });
      }
    } catch (error) {
      console.error("Failed to load specific gravity data:", error);
    }
  }, []);

  const handleValueChange = (key: MaterialKey, value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      setData(prev => ({ ...prev, [key]: numericValue }));
    } else {
        setData(prev => ({...prev, [key]: 0}));
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      toast({ title: 'Berhasil', description: 'Data berat jenis material telah disimpan.' });
    } catch (error) {
      console.error("Failed to save specific gravity data:", error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan data.' });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              Berat Jenis Material
            </CardTitle>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Material</TableHead>
                <TableHead className="text-center">PEMBAGIAN MATERIAL KG KE M3</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialDefinitions.map(({ key, label }) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={data[key as MaterialKey] || ''}
                      onChange={(e) => handleValueChange(key as MaterialKey, e.target.value)}
                      className="w-48 text-center mx-auto"
                      step="0.01"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Simpan Data
        </Button>
      </CardFooter>
    </Card>
  );
}
