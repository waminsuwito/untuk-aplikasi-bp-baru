

'use client';

import { useState, useEffect } from 'react';
import { getDatabase, ref, onChildAdded, remove } from 'firebase/database';
import { useAuth } from '@/context/auth-provider';
import type { PrintJobData, ProductionHistoryEntry } from '@/lib/types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PrintPreview } from '@/components/dashboard/print-preview';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { playSound } from '@/lib/utils';

export function PrintJobListener() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomingJob, setIncomingJob] = useState<PrintJobData | null>(null);

  useEffect(() => {
    if (!user?.location || user.jabatan !== 'ADMIN BP') {
      return;
    }

    const db = getDatabase(app);
    const printJobsRef = ref(db, `print_jobs/${user.location}`);
    
    const unsubscribe = onChildAdded(printJobsRef, (snapshot) => {
      const jobId = snapshot.key;
      const jobData: PrintJobData = snapshot.val();
      
      if (jobData && jobData.status === 'pending') {
        playSound('/notification-print-job.mp3');
        toast({
          title: 'Print Job Baru Diterima',
          description: `Operator ${jobData.operatorName} telah menyelesaikan batch untuk ${jobData.payload.namaPelanggan}.`,
        });
        setIncomingJob(jobData);
      }
    });

    return () => unsubscribe();

  }, [user, toast]);
  
  const handleClosePreview = () => {
    if (incomingJob && user?.location) {
        // Mark the job as processed by removing it from the queue
        const db = getDatabase(app);
        const jobRef = ref(db, `print_jobs/${user.location}/${incomingJob.payload.jobId}`);
        remove(jobRef).catch(err => console.error("Failed to remove print job:", err));
    }
    setIncomingJob(null);
  }

  return (
    <Sheet open={!!incomingJob} onOpenChange={(open) => !open && handleClosePreview()}>
        <SheetContent className="w-full sm:max-w-4xl p-0 flex flex-col">
            <SheetHeader className="p-6 bg-background border-b">
                <SheetTitle>Notifikasi Cetak Real-time</SheetTitle>
                <SheetDescription>
                Pekerjaan cetak berikut diterima dari Operator BP.
                </SheetDescription>
            </SheetHeader>
            <PrintPreview 
                data={incomingJob?.payload || null}
                operatorName={incomingJob?.operatorName}
                onClose={handleClosePreview} 
            />
        </SheetContent>
    </Sheet>
  );
}
