
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Droplets, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFormulas, type JobMixFormula } from '@/lib/formula';

const MOISTURE_CONTENT_STORAGE_KEY = 'app-moisture-content';

type MaterialKey = 'pasir1' | 'pasir2' | 'batu1' | 'batu2';
const aggregateMaterials: { key: MaterialKey; label: string }[] = [
  { key: 'pasir1', label: 'Pasir 1' },
  { key: 'pasir2', label: 'Pasir 2' },
  { key: 'batu1', label: 'Batu 1' },
  { key: 'batu2', label: 'Batu 2' },
];

export default function MoistureControlPage() {
  const [formulas, setFormulas] = useState<JobMixFormula[]>([]);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('');
  const [moisturePercentages, setMoisturePercentages] = useState<Record<MaterialKey, number>>({
    pasir1: 0,
    pasir2: 0,
    batu1: 0,
    batu2: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadedFormulas = getFormulas();
    setFormulas(loadedFormulas);
    if (loadedFormulas.length > 0) {
      setSelectedFormulaId(loadedFormulas[0].id);
    }

    try {
      const storedMc = localStorage.getItem(MOISTURE_CONTENT_STORAGE_KEY);
      if (storedMc) {
        setMoisturePercentages(JSON.parse(storedMc));
      }
    } catch (error) {
      console.error('Failed to load moisture content from localStorage:', error);
    }
  }, []);

  const selectedFormula = useMemo(() => formulas.find(f => f.id === selectedFormulaId), [formulas, selectedFormulaId]);

  const handlePercentageChange = (material: MaterialKey, value: string) => {
    const numericValue = Number(value);
    if (!isNaN(numericValue)) {
      setMoisturePercentages(prev => ({
        ...prev,
        [material]: numericValue,
      }));
    }
  };
  
  const calculationResults = useMemo(() => {
    if (!selectedFormula) return null;

    const results = {
      ...selectedFormula,
      koreksi_pasir1: 0,
      koreksi_pasir2: 0,
      koreksi_batu1: 0,
      koreksi_batu2: 0,
      total_koreksi_agregat: 0,
    };

    results.koreksi_pasir1 = (selectedFormula.pasir1 * moisturePercentages.pasir1) / 100;
    results.koreksi_pasir2 = (selectedFormula.pasir2 * moisturePercentages.pasir2) / 100;
    results.koreksi_batu1 = (selectedFormula.batu1 * moisturePercentages.batu1) / 100;
    results.koreksi_batu2 = (selectedFormula.batu2 * moisturePercentages.batu2) / 100;

    results.total_koreksi_agregat = results.koreksi_pasir1 + results.koreksi_pasir2 + results.koreksi_batu1 + results.koreksi_batu2;

    return {
      pasir1_koreksi: selectedFormula.pasir1 + results.koreksi_pasir1,
      pasir2_koreksi: selectedFormula.pasir2 + results.koreksi_pasir2,
      batu1_koreksi: selectedFormula.batu1 + results.koreksi_batu1,
      batu2_koreksi: selectedFormula.batu2 + results.koreksi_batu2,
      air_koreksi: selectedFormula.air - results.total_koreksi_agregat,
      koreksi_pasir1: results.koreksi_pasir1,
      koreksi_pasir2: results.koreksi_pasir2,
      koreksi_batu1: results.koreksi_batu1,
      koreksi_batu2: results.koreksi_batu2,
      total_koreksi_agregat: results.total_koreksi_agregat,
    };
  }, [selectedFormula, moisturePercentages]);


  const handleSave = () => {
    try {
      localStorage.setItem(MOISTURE_CONTENT_STORAGE_KEY, JSON.stringify(moisturePercentages));
      toast({
        title: 'Berhasil',
        description: 'Nilai Moisture Content (MC) telah disimpan.',
      });
    } catch (error) {
      console.error('Failed to save moisture content:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat menyimpan data MC.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-6 w-6 text-primary" />
              Moisture Control (MC)
            </CardTitle>
            <CardDescription>
              Sesuaikan nilai kelembaban material untuk koreksi air pada campuran.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Simpan Nilai MC
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-w-md space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="mutu-beton">Pilih Mutu Beton</Label>
            <Select
              value={selectedFormulaId}
              onValueChange={setSelectedFormulaId}
              disabled={formulas.length === 0}
            >
              <SelectTrigger id="mutu-beton">
                <SelectValue placeholder="Pilih formula..." />
              </SelectTrigger>
              <SelectContent>
                {formulas.map(formula => (
                  <SelectItem key={formula.id} value={formula.id}>
                    {formula.mutuBeton}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5">Material</TableHead>
                <TableHead className="text-center">Job Mix (Kg)</TableHead>
                <TableHead className="text-center">MC (%)</TableHead>
                <TableHead className="text-center">Koreksi MC (Kg)</TableHead>
                <TableHead className="text-center font-bold text-primary">Job Mix Setelah Koreksi (Kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedFormula && calculationResults ? (
                <>
                  {aggregateMaterials.map(({ key, label }) => {
                    const originalWeight = selectedFormula[key];
                    if (typeof originalWeight !== 'number') return null;

                    return (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell className="text-center">{originalWeight.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={moisturePercentages[key]}
                            onChange={e => handlePercentageChange(key, e.target.value)}
                            className="max-w-[120px] mx-auto text-center"
                            step="0.1"
                          />
                        </TableCell>
                        <TableCell className="text-center font-semibold text-destructive">
                          + {calculationResults[`koreksi_${key}` as keyof typeof calculationResults].toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center font-bold text-lg text-primary">
                          {(calculationResults[`${key}_koreksi` as keyof typeof calculationResults] as number).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                   <TableRow>
                      <TableCell className="font-medium">Semen</TableCell>
                      <TableCell className="text-center">{selectedFormula.semen.toFixed(2)}</TableCell>
                      <TableCell className="text-center text-muted-foreground">-</TableCell>
                      <TableCell className="text-center">0.00</TableCell>
                      <TableCell className="text-center font-bold text-lg text-primary">{selectedFormula.semen.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                      <TableCell className="font-medium">Air</TableCell>
                      <TableCell className="text-center">{selectedFormula.air.toFixed(2)}</TableCell>
                      <TableCell className="text-center text-muted-foreground">-</TableCell>
                      <TableCell className="text-center font-semibold text-destructive">
                         - {calculationResults.total_koreksi_agregat.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-lg text-primary">{calculationResults.air_koreksi.toFixed(2)}</TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Pilih formula mutu beton untuk melihat material.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
             {selectedFormula && calculationResults && (
                <TableFooter>
                    <TableRow className="bg-muted/50 font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-center">
                            {(selectedFormula.pasir1 + selectedFormula.pasir2 + selectedFormula.batu1 + selectedFormula.batu2 + selectedFormula.semen + selectedFormula.air).toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-center text-primary">
                           {(calculationResults.pasir1_koreksi + calculationResults.pasir2_koreksi + calculationResults.batu1_koreksi + calculationResults.batu2_koreksi + selectedFormula.semen + calculationResults.air_koreksi).toFixed(2)}
                        </TableCell>
                    </TableRow>
                </TableFooter>
             )}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
