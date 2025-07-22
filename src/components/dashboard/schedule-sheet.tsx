
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Save } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getScheduleSheetData, saveScheduleSheetData } from '@/lib/schedule';
import type { ScheduleSheetRow, ScheduleStatus, JobMixFormula } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFormulas } from '@/lib/formula';


const TOTAL_ROWS = 30;

const headers = [
    'NO', 'NO P.O', 'NAMA', 'LOKASI', 'GRADE', 'SLUMP (CM)', 'CP/M',
    'VOL M³', 'TERKIRIM M³', 'SISA M³', 'PENAMBAHAN VOL M³', 'TOTAL M³', 'STATUS'
];
const fieldKeys: (keyof ScheduleSheetRow)[] = [
    'no', 'noPo', 'nama', 'lokasi', 'mutuBeton', 'slump', 'mediaCor',
    'volume', 'terkirim', 'sisa', 'penambahanVol', 'totalVol', 'status'
];
const statusOptions: ScheduleStatus[] = ['Menunggu', 'Proses', 'Selesai', 'Tunda', 'Batal'];

const recalculateRow = (row: ScheduleSheetRow): ScheduleSheetRow => {
  const newRow = { ...row };

  // If the primary identifier 'no' is empty, clear all calculated fields.
  if (!newRow.no || newRow.no.trim() === '') {
    newRow.sisa = '';
    newRow.totalVol = '';
    newRow.status = undefined; // Reset status as well
    newRow.terkirim = '';
    newRow.penambahanVol = '';
    return newRow;
  }

  const volume = parseFloat(newRow.volume || '0');
  const terkirim = parseFloat(newRow.terkirim || '0');
  const penambahanVol = parseFloat(newRow.penambahanVol || '0');

  newRow.sisa = (volume - terkirim).toFixed(2);
  newRow.totalVol = (volume + penambahanVol).toFixed(2);
  
  return newRow;
};


export function ScheduleSheet({ isOperatorView }: { isOperatorView?: boolean }) {
  const [data, setData] = useState<ScheduleSheetRow[]>(() => Array(TOTAL_ROWS).fill({}).map(() => ({} as ScheduleSheetRow)));
  const [formulas, setFormulas] = useState<JobMixFormula[]>([]);
  const [date, setDate] = useState(format(new Date(), 'dd MMMM yyyy'));
  const { toast } = useToast();

  const loadDataFromStorage = () => {
    try {
      setFormulas(getFormulas());
      const storedData = getScheduleSheetData();
      let fullData;
      if (storedData.length > 0) {
        const recalculatedData = storedData.map(recalculateRow);
        fullData = [...recalculatedData];
      } else {
        fullData = [];
      }
      
      while (fullData.length < TOTAL_ROWS) {
          fullData.push({} as ScheduleSheetRow);
      }
      setData(fullData);

    } catch (error) {
        console.error("Failed to load schedule sheet data", error);
    }
  };

  useEffect(() => {
    loadDataFromStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-schedule-sheet-data') {
        loadDataFromStorage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleInputChange = (rowIndex: number, key: keyof ScheduleSheetRow, value: string) => {
    setData(currentData => {
      let updatedData = [...currentData];
      let currentRow = { ...updatedData[rowIndex], [key]: value.toUpperCase() };
      
      currentRow = recalculateRow(currentRow);
      updatedData[rowIndex] = currentRow;
      return updatedData;
    });
  };
  
  const handleSave = () => {
     try {
        saveScheduleSheetData(data);
        toast({ title: 'Berhasil', description: 'Data schedule berhasil disimpan.' });
    } catch (error) {
        console.error("Failed to save schedule sheet data", error);
        toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan data schedule.' });
    }
  }

  const handleStatusChange = (rowIndex: number, newStatus: ScheduleStatus) => {
    const updatedData = [...data];
    updatedData[rowIndex] = { ...updatedData[rowIndex], status: newStatus };
    setData(updatedData);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, rowIndex: number, colIndex: number) => {
    const { key } = e;
    let nextRowIndex = rowIndex;
    let nextColIndex = colIndex;

    if (key === 'Enter' || key === 'ArrowDown') {
        e.preventDefault();
        nextRowIndex = rowIndex + 1;
    } else if (key === 'ArrowUp') {
        e.preventDefault();
        nextRowIndex = rowIndex - 1;
    } else if (key === 'ArrowRight') {
        e.preventDefault();
        nextColIndex = colIndex + 1;
    } else if (key === 'ArrowLeft') {
        e.preventDefault();
        nextColIndex = colIndex - 1;
    } else {
        return;
    }

    if (nextColIndex >= fieldKeys.length) {
        nextColIndex = 0;
        nextRowIndex = rowIndex + 1;
    }
    if (nextColIndex < 0) {
        nextColIndex = fields.length - 1;
        nextRowIndex = rowIndex - 1;
    }

    if (nextRowIndex >= 0 && nextRowIndex < TOTAL_ROWS) {
        const nextField = fieldKeys[nextColIndex];
        const nextInputId = `${nextField}-${nextRowIndex}`;
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
            nextInput.focus();
        }
    }
  };
  
  const getStatusColorClass = (status?: ScheduleStatus) => {
      switch (status) {
          case 'Selesai': return 'bg-green-100 hover:bg-green-200/50';
          case 'Tunda': return 'bg-amber-100 hover:bg-amber-200/50';
          case 'Batal': return 'bg-red-100 hover:bg-red-200/50';
          case 'Proses': return 'bg-blue-100 hover:bg-blue-200/50';
          default: return 'hover:bg-gray-100'; // Menunggu or undefined
      }
  };

  const renderCellContent = (row: ScheduleSheetRow, key: keyof ScheduleSheetRow, rowIndex: number, colIndex: number) => {
    const isRowLocked = row.status === 'Selesai' || row.status === 'Batal';
    const isReadOnlyForAdmin = !isOperatorView && ['terkirim', 'sisa', 'totalVol', 'status'].includes(key);
    
    let displayValue;
    const isRowActive = (row.no && row.no.trim() !== '') || (row.noPo && row.noPo.trim() !== '') || (row.nama && row.nama.trim() !== '');

    if (key === 'status') {
       if (!isRowActive) return null;
       
       const currentStatus = row.status || 'Menunggu';
       
       if (isOperatorView) {
         return (
            <div className={cn(
                "w-full min-h-[40px] text-center flex items-center justify-center p-2",
                currentStatus === 'Proses' && 'font-bold text-green-600'
            )}>
                {currentStatus}
            </div>
         );
       }

       return (
            <Select 
                value={currentStatus} 
                onValueChange={(value: ScheduleStatus) => handleStatusChange(rowIndex, value)}
                disabled={isRowLocked}
            >
                <SelectTrigger className={cn(
                    "w-full h-full border-none rounded-none text-center bg-transparent focus:ring-0",
                    currentStatus === 'Proses' && 'font-bold text-green-600'
                )}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {statusOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
       );
    } else if (key === 'mutuBeton') {
        const matchingFormula = formulas.find(f => f.mutuBeton === row.mutuBeton);
        const displayMutu = matchingFormula?.mutuCode ? `${row.mutuBeton} ${matchingFormula.mutuCode}` : row.mutuBeton;
        
        if (isOperatorView || isRowLocked || isReadOnlyForAdmin) {
            return (
                <div className="w-full min-h-[40px] text-center bg-transparent flex items-center justify-center p-2">
                    <p className="whitespace-pre-wrap break-words">{displayMutu || ''}</p>
                </div>
            );
        }
      
        if (!isRowActive) return null;
        return (
          <Select
            value={row.mutuBeton || ''}
            onValueChange={(value) => handleInputChange(rowIndex, 'mutuBeton', value)}
            disabled={isRowLocked}
          >
            <SelectTrigger className="w-full h-full border-none rounded-none text-center bg-transparent focus:ring-0 uppercase">
              <SelectValue placeholder="Pilih Mutu" />
            </SelectTrigger>
            <SelectContent>
              {formulas.map((formula) => {
                const displayLabel = formula.mutuCode ? `${formula.mutuBeton} ${formula.mutuCode}` : formula.mutuBeton;
                return (
                  <SelectItem key={formula.id} value={formula.mutuBeton}>
                    {displayLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
    }
    else {
        displayValue = row[key] ?? '';
    }

    if (isOperatorView || isReadOnlyForAdmin || isRowLocked) {
      return (
        <div className="w-full min-h-[40px] text-center bg-transparent flex items-center justify-center p-2">
          <p className="whitespace-pre-wrap break-words">{displayValue}</p>
        </div>
      );
    }
  
    return (
      <Textarea
        id={`${key}-${rowIndex}`}
        value={displayValue}
        onChange={e => handleInputChange(rowIndex, key, e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
        className="w-full min-h-[40px] border-none rounded-none text-center bg-transparent text-black resize-none p-2"
        style={{ textTransform: 'uppercase' }}
      />
    );
  };


  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-primary" />
                        SCHEDULE COR HARI INI
                    </CardTitle>
                    <CardDescription>Tanggal: {date}</CardDescription>
                </div>
                {!isOperatorView && (
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Simpan
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-x-auto bg-white text-black p-2">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-200 hover:bg-gray-200">
                            {headers.map(header => (
                                <TableHead key={header} className="text-center font-bold whitespace-nowrap px-2 text-black">{header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, rowIndex) => (
                            <TableRow 
                                key={`row-${rowIndex}`} 
                                className={cn(
                                    "[&_td]:p-0",
                                    getStatusColorClass(row.status)
                                )}
                            >
                                {fieldKeys.map((key, colIndex) => (
                                    <TableCell key={`${key}-${rowIndex}`} className="border-t border-gray-300 align-top h-[40px]">
                                        {renderCellContent(row, key, rowIndex, colIndex)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
}
