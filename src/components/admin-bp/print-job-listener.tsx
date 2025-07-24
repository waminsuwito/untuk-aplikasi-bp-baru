'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-provider';
import { onValue, ref } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { PrintPreview } from '../dashboard/print-preview';
import { printElement } from '@/lib/utils';
import { updatePrintJobStatus } from '@/lib/actions';
import { type PrintJobData } from '@/lib/types';

export function PrintJobListener() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.location) return;

    const printJobRef = ref(realtimeDb, `print-jobs/${user.location}`);
    
    const unsubscribe = onValue(printJobRef, (snapshot) => {
      const job = snapshot.val() as PrintJobData | null;
      if (job && job.status === 'pending') {
        const printComponent = (
            <div id="realtime-print-content">
                <PrintPreview 
                    data={job.payload}
                    operatorName={job.operatorName}
                    onClose={() => {}}
                />
            </div>
        );

        // Temporarily render the component to the DOM to print it
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);
        
        // This is a hacky way to use React components outside of the main render flow
        const { createRoot } = require('react-dom/client');
        const root = createRoot(tempContainer);
        root.render(printComponent);

        setTimeout(() => {
            printElement('realtime-print-content');
            updatePrintJobStatus(user.location!, 'processed');
            document.body.removeChild(tempContainer);
        }, 500); // Delay to ensure content is rendered
      }
    });

    return () => unsubscribe();
  }, [user]);

  return null;
}
