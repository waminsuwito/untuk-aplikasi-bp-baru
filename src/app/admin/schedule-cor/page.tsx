
// This page is now unlinked for the ADMIN LOGISTIK role.
// The content is kept to avoid breaking changes for other roles that might use it.
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
import { CalendarCheck, PlusCircle, Trash2, Calendar as CalendarIcon, Printer } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Schedule } from '@/lib/types';
import { getSchedules, saveSchedules } from '@/lib/schedule';
import { cn, printElement } from '@/lib/utils';


const initialFormState = {
  customerName: '',
  projectLocation: '',
  concreteQuality: '',
  slump: '',
  volume: '',
  mediaCor: 'CP' as const,
};

export default function ScheduleCorPage() {
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [formState, setFormState] = useState<Omit<Schedule, 'id' | 'date'>>(initialFormState);

  useEffect(() => {
    // Safely load schedules only on the client side
    setAllSchedules(getSchedules());
  }, []);

  const todaysSchedules = allSchedules.filter(
    (s) => s.date === format(date, 'yyyy-MM-dd')
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleMediaCorChange = (value: 'CP' | 'Manual') => {
    setFormState(prev => ({...prev, mediaCor: value}));
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formState.customerName.trim() ||
      !formState.projectLocation.trim() ||
      !formState.concreteQuality.trim() ||
      !formState.slump.trim() ||
      !formState.volume.trim()
    ) {
      alert('Semua kolom harus diisi.');
      return;
    }
    setAllSchedules(currentSchedules => {
        const newSchedule: Schedule = {
            id: new Date().toISOString(),
            ...formState,
            date: format(date, 'yyyy-MM-dd'),
        };
        const updatedSchedules = [...currentSchedules, newSchedule];
        saveSchedules(updatedSchedules);
        return updatedSchedules;
    });
    setFormState(initialFormState); // Reset form
  };

  const handleDeleteSchedule = (id: string) => {
    setAllSchedules(currentSchedules => {
        const updatedSchedules = currentSchedules.filter(schedule => schedule.id !== id);
        saveSchedules(updatedSchedules);
        return updatedSchedules;
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Schedule Cor</CardTitle>
           <CardDescription>
            Halaman ini tidak lagi digunakan untuk peran Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center py-12 text-muted-foreground">
              <p>Halaman ini telah digantikan oleh menu baru di sidebar.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
