
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Boxes, Calendar as CalendarIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-provider';
import type { ProductionHistoryEntry } from '@/lib/types';


const MATERIAL_LABELS_KEY = 'app-material-labels';
const SPECIFIC_GRAVITY_KEY = 'app-material-specific-gravity';
const PRODUCTION_HISTORY_KEY = 'app-production-history';
const STOCK_KEY_PREFIX = 'app-stok-material-';

const defaultMaterialLabels = {
  pasir1: 'Pasir 1', pasir2: 'Pasir 2',
  batu1: 'Batu 1', batu2: 'Batu 2', batu3: 'Batu 3', batu4: 'Batu 4',
  semen: 'Semen', air: 'Air',
  additive1: 'Additive 1', additive2: 'Additive 2', additive3: 'Additive 3',
};

type MaterialKey = keyof typeof defaultMaterialLabels;
type DailyStock = Record<MaterialKey, { awal: number; pemasukan: number; pengiriman: number; pemakaian: number }>;

const materialKeysInOrder: MaterialKey[] = Object.keys(defaultMaterialLabels) as MaterialKey[];

const createInitialStock = (): DailyStock => {
    const stock: Partial<DailyStock> = {};
    for (const key of materialKeysInOrder) {
        stock[key] = { awal: 0, pemasukan: 0, pemakaian: 0, pengiriman: 0 };
    }
    return stock as DailyStock;
};

const getSpecificGravities = (): Record<string, number> => {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(SPECIFIC_GRAVITY_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch(e) { return {}; }
}

const getMaterialConfig = (): typeof defaultMaterialLabels => {
  if (typeof window === 'undefined') return defaultMaterialLabels;
  try {
    const stored = localStorage.getItem(MATERIAL_LABELS_KEY);
    return stored ? { ...defaultMaterialLabels, ...JSON.parse(stored) } : defaultMaterialLabels;
  } catch (e) {
    return defaultMaterialLabels;
  }
}

const calculateStockAkhirForDay = (dayStock: DailyStock): Record<MaterialKey, number> => {
  const stockAkhir: Partial<Record<MaterialKey, number>> = {};
  for (const key of materialKeysInOrder) {
    const materialData = dayStock[key];
    const { awal = 0, pemasukan = 0, pemakaian = 0, pengiriman = 0 } = materialData || {};
    stockAkhir[key] = (awal + pemasukan) - pemakaian - pengiriman;
  }
  return stockAkhir as Record<MaterialKey, number>;
};


export default function StokMaterialPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [stock, setStock] = useState<DailyStock>(createInitialStock());
  const [productionHistory, setProductionHistory] = useState<ProductionHistoryEntry[]>([]);
  const [materialLabels, setMaterialLabels] = useState(defaultMaterialLabels);
  const [specificGravities, setSpecificGravities] = useState<Record<string,number>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const getStockKey = (d: Date) => `${STOCK_KEY_PREFIX}${user?.location}-${format(d, 'yyyy-MM-dd')}`;

  useEffect(() => {
    try {
      setMaterialLabels(getMaterialConfig());
      setSpecificGravities(getSpecificGravities());
      const storedHistory = localStorage.getItem(PRODUCTION_HISTORY_KEY);
      if (storedHistory) {
        setProductionHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  }, []);

  useEffect(() => {
    if(!user?.location) return;

    try {
      const key = getStockKey(date);
      const storedData = localStorage.getItem(key);

      if (storedData) {
        // Data for today exists, load it
        setStock({ ...createInitialStock(), ...JSON.parse(storedData) });
      } else {
        // No data for today, try to get yesterday's closing stock
        const yesterday = subDays(date, 1);
        const yesterdayKey = getStockKey(yesterday);
        const yesterdayStoredData = localStorage.getItem(yesterdayKey);
        
        if (yesterdayStoredData) {
          const yesterdayStock: DailyStock = { ...createInitialStock(), ...JSON.parse(yesterdayStoredData) };
          const yesterdayStockAkhir = calculateStockAkhirForDay(yesterdayStock);
          
          const newTodayStock = createInitialStock();
          for (const key of materialKeysInOrder) {
            newTodayStock[key].awal = yesterdayStockAkhir[key] || 0;
          }
          setStock(newTodayStock);
        } else {
          // No data for yesterday either, start with fresh initial stock
          setStock(createInitialStock());
        }
      }
    } catch (error) {
      console.error("Failed to load stock data:", error);
      setStock(createInitialStock()); // Reset on error
    }
  }, [date, user]);

  const calculatedUsage = useMemo(() => {
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    const todaysProduction = productionHistory.filter(
      item => format(new Date(item.startTime), 'yyyy-MM-dd') === selectedDateStr
    );

    const usage: Record<MaterialKey, number> = {} as any;
    for (const key of materialKeysInOrder) {
        usage[key as MaterialKey] = 0;
    }

    todaysProduction.forEach(item => {
      for (const key in item.actualWeights) {
        const matKey = key as keyof ProductionHistoryEntry['actualWeights'];
        if (usage.hasOwnProperty(matKey)) {
          usage[matKey as MaterialKey] += item.actualWeights[matKey] || 0;
        }
      }
    });
    
    // Convert to M3 or L for aggregates/additives
    for(const key of materialKeysInOrder) {
        if (key.startsWith('pasir') || key.startsWith('batu')) {
            const sg = specificGravities[key.substring(0, key.length -1)] || 1;
            usage[key] = sg > 0 ? usage[key] / sg : usage[key];
        } else if (key.startsWith('additive')) {
            const sg = specificGravities[key] || 1;
            usage[key] = sg > 0 ? usage[key] / sg : usage[key];
        }
    }
    
    return usage;
  }, [date, productionHistory, specificGravities]);
  
  useEffect(() => {
    setStock(prev => {
        const newStock = { ...prev };
        for (const key of materialKeysInOrder) {
            newStock[key] = { ...newStock[key], pemakaian: calculatedUsage[key] || 0 };
        }
        return newStock;
    });
  }, [calculatedUsage]);


  const handleStockChange = (material: MaterialKey, field: 'awal' | 'pemasukan' | 'pengiriman', value: string) => {
    const numericValue = parseFloat(value) || 0;
    setStock(prev => ({
      ...prev,
      [material]: {
        ...prev[material],
        [field]: numericValue,
      },
    }));
  };

  const handleSave = () => {
    if(!user?.location) {
        toast({ variant: 'destructive', title: 'Error', description: 'User location not found.' });
        return;
    }
    try {
      const key = getStockKey(date);
      localStorage.setItem(key, JSON.stringify(stock));
      toast({
        title: 'Berhasil Disimpan',
        description: `Data stok untuk tanggal ${format(date, 'd MMMM yyyy')} telah disimpan.`,
      });
    } catch (error) {
      console.error("Failed to save stock data:", error);
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat menyimpan data.',
      });
    }
  };

  const calculateStockAkhir = (materialData: { awal: number; pemasukan: number; pemakaian: number; pengiriman: number }) => {
    const { awal = 0, pemasukan = 0, pemakaian = 0, pengiriman = 0 } = materialData;
    return (awal + pemasukan) - pemakaian - pengiriman;
  };
  
  const formatStockValue = (value: number): string => {
    const numValue = Number(value);
    if (isNaN(numValue)) return '0';
    return numValue % 1 === 0
      ? numValue.toLocaleString('id-ID')
      : numValue.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Boxes className="h-6 w-6 text-primary" />
                    Stok Material
                </CardTitle>
                <CardDescription>
                    Kelola stok awal, pemakaian, dan stok akhir material harian.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn('w-[280px] justify-start text-left font-normal', !date && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => setDate(d || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold mb-2">Lokasi: <span className="text-primary">{user?.location}</span></p>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[15%] font-bold text-white bg-gray-700 min-w-[150px]">KETERANGAN</TableHead>
                {materialKeysInOrder.map(key => {
                    let unit = 'Kg';
                    if (key.startsWith('pasir') || key.startsWith('batu')) {
                      unit = 'M³';
                    } else if (key.startsWith('additive')) {
                      unit = 'L';
                    }
                    
                    return (
                        <TableHead key={key} className="text-center font-bold text-white bg-gray-600 min-w-[150px]">
                            {materialLabels[key]} ({unit})
                        </TableHead>
                    );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">STOK AWAL</TableCell>
                {materialKeysInOrder.map(key => (
                    <TableCell key={key}>
                        <Input type="number" className="text-center" value={stock[key]?.awal || 0} onChange={e => handleStockChange(key, 'awal', e.target.value)} />
                    </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">PEMASUKAN</TableCell>
                {materialKeysInOrder.map(key => (
                    <TableCell key={key}>
                        <Input type="number" className="text-center" value={stock[key]?.pemasukan || 0} onChange={e => handleStockChange(key, 'pemasukan', e.target.value)} />
                    </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">PEMAKAIAN</TableCell>
                 {materialKeysInOrder.map(key => (
                    <TableCell key={key}>
                        <Input type="number" className="text-center" value={stock[key]?.pemakaian.toFixed(2) || '0.00'} readOnly disabled />
                    </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">PENGIRIMAN</TableCell>
                 {materialKeysInOrder.map(key => (
                    <TableCell key={key}>
                        <Input type="number" className="text-center" value={stock[key]?.pengiriman || 0} onChange={e => handleStockChange(key, 'pengiriman', e.target.value)} />
                    </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-muted font-bold">
                <TableCell>STOK AKHIR</TableCell>
                 {materialKeysInOrder.map(key => (
                    <TableCell key={key} className="text-center text-lg">
                        {formatStockValue(calculateStockAkhir(stock[key]))}
                    </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full md:w-auto ml-auto">
            <Save className="mr-2 h-4 w-4" />
            Simpan Data Stok
        </Button>
      </CardFooter>
    </Card>
  );
}
