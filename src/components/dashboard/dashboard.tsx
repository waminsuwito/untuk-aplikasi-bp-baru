
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import { WeightDisplayPanel } from './material-inventory';
import { ControlPanel } from './control-panel';
import { StatusPanel, type TimerDisplayState } from './status-panel';
import { PrintPreview } from './print-preview';
import { ScheduleSheet } from './schedule-sheet';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MIXING_PROCESS_STORAGE_KEY, defaultMixingProcess, MIXER_TIMER_CONFIG_KEY, defaultMixerTimerConfig } from '@/lib/config';
import type { MixingProcessConfig, MixerTimerConfig } from '@/lib/config';
import { useAuth } from '@/context/auth-provider';
import type { JobMixFormula, ScheduleSheetRow, ProductionHistoryEntry, PrintJobData } from '@/lib/types';
import { getFormulas } from '@/lib/formula';
import { auth, database } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { getScheduleSheetData, saveScheduleSheetData } from '@/lib/schedule';
import { printElement } from '@/lib/utils';
import { AlertTriangle, Plus, Minus } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

type AutoProcessStep =
  | 'idle'
  | 'weighing'
  | 'mixing'
  | 'discharging'
  | 'paused'
  | 'complete';

const generateSimulatedWeight = (target: number, roundingUnit: 1 | 5): number => {
  const deviation = 0.02; // 2%
  const min = target * (1 - deviation);
  const max = target * (1 + deviation);
  const randomWeight = Math.random() * (max - min) + min;
  const finalWeight = Math.round(randomWeight / roundingUnit) * roundingUnit;
  return finalWeight;
};

const PRINTER_SETTINGS_KEY = 'app-printer-settings';
const PRODUCTION_HISTORY_KEY = 'app-production-history';
type PrintMode = 'preview' | 'direct' | 'save';

export function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const [aggregateWeight, setAggregateWeight] = useState(0);
  const [airWeight, setAirWeight] = useState(0);
  const [semenWeight, setSemenWeight] = useState(0);
  const [currentMixNumber, setCurrentMixNumber] = useState(0);
  const [autoProcessStep, setAutoProcessStep] = useState<AutoProcessStep>('idle');

  const [powerOn, setPowerOn] = useState(true);
  const [mixingTime, setMixingTime] = useState(15);
  const [timerDisplay, setTimerDisplay] = useState<TimerDisplayState>({
    value: mixingTime,
    total: mixingTime,
    label: 'Waktu Mixing',
    colorClass: 'text-primary',
  });

  const [formulas, setFormulas] = useState<JobMixFormula[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleSheetRow[]>([]);
  
  const initialJobInfo = {
    selectedFormulaId: '',
    reqNo: '',
    namaPelanggan: '',
    lokasiProyek: '',
    targetVolume: '' as number | '',
    jumlahMixing: 1,
    slump: 12,
    mediaCor: '',
    noPolisi: '',
    namaSopir: '',
  };
  
  const [jobInfo, setJobInfo] = useState(initialJobInfo);
  const [isJobInfoLocked, setIsJobInfoLocked] = useState(false);
  const [volumeWarning, setVolumeWarning] = useState('');
  const [scheduleStatusWarning, setScheduleStatusWarning] = useState('');


  const [mixingProcessConfig, setMixingProcessConfig] = useState<MixingProcessConfig>(defaultMixingProcess);
  const [mixerTimerConfig, setMixerTimerConfig] = useState<MixerTimerConfig>(defaultMixerTimerConfig);
  
  const [operasiMode, setOperasiMode] = useState<'MANUAL' | 'AUTO'>('AUTO');
  const [isManualProcessRunning, setIsManualProcessRunning] = useState(false);
  const [activityLog, setActivityLog] = useState<{ message: string; id: number; color: string; timestamp: string }[]>([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [completedBatchData, setCompletedBatchData] = useState<ProductionHistoryEntry | null>(null);
  const [batchStartTime, setBatchStartTime] = useState<Date | null>(null);

  const hasActiveSchedule = useMemo(() => {
    return scheduleData.some(row => row.status === 'Proses');
  }, [scheduleData]);

  const addLog = (message: string, color: string = 'text-foreground') => {
      setActivityLog(prev => {
          const newLog = { 
              message, 
              color, 
              id: Date.now() + Math.random(), 
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit'}) 
          };
          const updatedLogs = [...prev, newLog];
          return updatedLogs.slice(-10); // Keep only the last 10 logs
      });
  };

  useEffect(() => {
    // Wait until authentication is fully resolved before proceeding
    if (isAuthLoading || !user) {
        return;
    }

    const db = getDatabase();
    const weightsRef = ref(db, 'weights');
    let unsubscribe: () => void;

    // Function to initialize and start listening
    const initializeAndListen = async () => {
      try {
        const snapshot = await get(weightsRef);
        if (!snapshot.exists()) {
          addLog("Inisialisasi data timbangan...", "text-blue-400");
          // Initializing the data if it doesn't exist
          await set(weightsRef, { aggregate: 0, air: 0, semen: 0 });
        }
      } catch (error: any) {
        console.error("Firebase initialization error:", error);
        toast({
          variant: 'destructive',
          title: 'Error Inisialisasi Database',
          description: `Gagal menyiapkan data timbangan: ${error.message}`
        });
        return; // Don't attach listener if init fails
      }

      // If initialization was successful, attach the listener
      unsubscribe = onValue(weightsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setAggregateWeight(data.aggregate || 0);
          setAirWeight(data.air || 0);
          setSemenWeight(data.semen || 0);
        }
      }, (error) => {
        console.error("Firebase weight listener error:", error);
        toast({
          variant: 'destructive',
          title: 'Koneksi Timbangan Gagal',
          description: `Tidak dapat memuat data timbangan: ${error.message}`
        });
      });
    };

    initializeAndListen();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthLoading, user, toast]);


  useEffect(() => {
    const loadedFormulas = getFormulas();
    setFormulas(loadedFormulas);
    const loadedSchedule = getScheduleSheetData();
    setScheduleData(loadedSchedule);
  }, []);

  useEffect(() => {
    if (!jobInfo.reqNo.trim()) {
      if (isJobInfoLocked) {
        setJobInfo(prev => ({
          ...initialJobInfo,
          reqNo: '',
          targetVolume: prev.targetVolume,
          jumlahMixing: prev.jumlahMixing,
        }));
        setIsJobInfoLocked(false);
      }
      setScheduleStatusWarning('');
      return;
    }

    const reqNoAsNumber = parseInt(jobInfo.reqNo, 10);
    if (isNaN(reqNoAsNumber)) {
      if (isJobInfoLocked) setIsJobInfoLocked(false);
      setScheduleStatusWarning('');
      return;
    }

    const matchingSchedule = scheduleData.find(row => parseInt(row.no, 10) === reqNoAsNumber);

    if (matchingSchedule) {
        const currentStatus = matchingSchedule.status || 'Menunggu';
        let warningMsg = '';

        if (currentStatus === 'Menunggu') {
            warningMsg = 'Jadwal ini masih menunggu, belum diijinkan untuk loading.';
        } else if (currentStatus === 'Selesai' || currentStatus === 'Batal') {
            warningMsg = `Jadwal ini sudah berstatus "${currentStatus}".`;
        } else if (currentStatus === 'Tunda') {
            warningMsg = 'Jadwal ini sedang ditunda.';
        }

        if (warningMsg) {
            setScheduleStatusWarning(warningMsg);
            if (isJobInfoLocked) setIsJobInfoLocked(false);
            return;
        }

        // If status is 'Proses'
        setScheduleStatusWarning('');
        const matchingFormula = formulas.find(f => f.mutuBeton === matchingSchedule.mutuBeton);
        
        setJobInfo(prev => ({
            ...prev,
            selectedFormulaId: matchingFormula ? matchingFormula.id : '',
            namaPelanggan: matchingSchedule.nama || '',
            lokasiProyek: matchingSchedule.lokasi || '',
            slump: parseFloat(matchingSchedule.slump) || prev.slump,
            mediaCor: matchingSchedule.mediaCor || '',
        }));
        
        if (!isJobInfoLocked) {
            setIsJobInfoLocked(true);
            toast({ title: 'Jadwal Ditemukan', description: `Data untuk No. ${jobInfo.reqNo} telah dimuat.` });
        }
    } else {
        setScheduleStatusWarning('');
        if (isJobInfoLocked) {
            setJobInfo(prev => ({
                ...initialJobInfo,
                reqNo: prev.reqNo,
                targetVolume: prev.targetVolume,
                jumlahMixing: prev.jumlahMixing,
            }));
            setIsJobInfoLocked(false);
        }
    }
  }, [jobInfo.reqNo, scheduleData, formulas, isJobInfoLocked, toast]);

  useEffect(() => {
    const targetVolumeNum = Number(jobInfo.targetVolume);

    if (isJobInfoLocked && jobInfo.reqNo && targetVolumeNum > 0) {
      const reqNoAsNumber = parseInt(jobInfo.reqNo, 10);
      const matchingSchedule = scheduleData.find(row => parseInt(row.no, 10) === reqNoAsNumber);
  
      if (matchingSchedule) {
        const scheduledVolume = parseFloat(matchingSchedule.volume) || 0;
        const alreadySentVolume = parseFloat(matchingSchedule.terkirim) || 0;
        const remainingVolume = scheduledVolume - alreadySentVolume;
  
        if (remainingVolume <= 0 && scheduledVolume > 0) {
          setVolumeWarning(`Schedule untuk REQ NO ${jobInfo.reqNo} sudah terpenuhi.`);
        } else if (targetVolumeNum > remainingVolume) {
          setVolumeWarning(`Volume melebihi sisa schedule (${remainingVolume.toFixed(2)} M³).`);
        } else {
          setVolumeWarning('');
        }
      } else {
        setVolumeWarning('');
      }
    } else {
      setVolumeWarning('');
    }
  }, [jobInfo.targetVolume, jobInfo.reqNo, isJobInfoLocked, scheduleData]);


  useEffect(() => {
    try {
      const savedProcess = window.localStorage.getItem(MIXING_PROCESS_STORAGE_KEY);
      if (savedProcess) setMixingProcessConfig(JSON.parse(savedProcess));
      const savedTimers = window.localStorage.getItem(MIXER_TIMER_CONFIG_KEY);
      if (savedTimers) setMixerTimerConfig(JSON.parse(savedTimers));
    } catch (error) {
      console.error("Failed to load configs from localStorage", error);
    }
  }, []);
  
  const resetStateForNewJob = () => {
     setAggregateWeight(0);
     setAirWeight(0);
     setSemenWeight(0);
     setCurrentMixNumber(0);
     setActivityLog([]);
     setShowPrintPreview(false);
     setCompletedBatchData(null);
     setBatchStartTime(null);
  }
  
  const currentTargetWeights = useMemo(() => {
    const selectedFormula = formulas.find(f => f.id === jobInfo.selectedFormulaId);
    const targetVolumeNum = Number(jobInfo.targetVolume);
    if (selectedFormula && jobInfo.jumlahMixing > 0 && targetVolumeNum > 0) {
      const volumePerMix = targetVolumeNum / jobInfo.jumlahMixing;
      return {
        pasir1: selectedFormula.pasir1 * volumePerMix,
        pasir2: selectedFormula.pasir2 * volumePerMix,
        batu1: selectedFormula.batu1 * volumePerMix,
        batu2: selectedFormula.batu2 * volumePerMix,
        batu3: selectedFormula.batu3 * volumePerMix,
        batu4: selectedFormula.batu4 * volumePerMix,
        air: selectedFormula.air * volumePerMix,
        semen: selectedFormula.semen * volumePerMix,
        additive1: selectedFormula.additive1 * volumePerMix,
        additive2: selectedFormula.additive2 * volumePerMix,
        additive3: selectedFormula.additive3 * volumePerMix,
      };
    }
    return { pasir1: 0, pasir2: 0, batu1: 0, batu2: 0, batu3: 0, batu4: 0, air: 0, semen: 0, additive1: 0, additive2: 0, additive3: 0 };
  }, [jobInfo.selectedFormulaId, jobInfo.targetVolume, jobInfo.jumlahMixing, formulas]);
  
  const finishAndPrintBatch = () => {
        const selectedFormula = formulas.find(f => f.id === jobInfo.selectedFormulaId);
        if (!batchStartTime) {
            toast({ variant: 'destructive', title: 'Error Cetak', description: 'Waktu mulai batch tidak ditemukan.' });
            return;
        }

        const finalActualWeights = {
            pasir1: generateSimulatedWeight(currentTargetWeights.pasir1, 5),
            pasir2: generateSimulatedWeight(currentTargetWeights.pasir2, 5),
            batu1: generateSimulatedWeight(currentTargetWeights.batu1, 5),
            batu2: generateSimulatedWeight(currentTargetWeights.batu2, 5),
            batu3: generateSimulatedWeight(currentTargetWeights.batu3, 5),
            batu4: generateSimulatedWeight(currentTargetWeights.batu4, 5),
            air: generateSimulatedWeight(currentTargetWeights.air, 1),
            semen: generateSimulatedWeight(currentTargetWeights.semen, 1),
            additive1: generateSimulatedWeight(currentTargetWeights.additive1, 1),
            additive2: generateSimulatedWeight(currentTargetWeights.additive2, 1),
            additive3: generateSimulatedWeight(currentTargetWeights.additive3, 1),
        };

        const finalData: ProductionHistoryEntry = {
            ...jobInfo,
            noPolisi: '', // Kosongkan sesuai permintaan
            namaSopir: '', // Kosongkan sesuai permintaan
            targetVolume: Number(jobInfo.targetVolume),
            jobId: `SIM-${Date.now().toString().slice(-6)}`,
            mutuBeton: selectedFormula?.mutuBeton || 'N/A',
            mutuCode: selectedFormula?.mutuCode || '',
            startTime: batchStartTime.toISOString(),
            endTime: new Date().toISOString(),
            targetWeights: currentTargetWeights,
            actualWeights: finalActualWeights,
        };
        
        setCompletedBatchData(finalData);

        // --- Start Real-time Notification ---
        if (user?.location && user.jabatan === 'OPRATOR BP') {
          try {
            const printJob: PrintJobData = {
              status: 'pending',
              operatorName: user.username,
              payload: finalData
            };
            const printJobRef = ref(database, `print_jobs/${user.location}/${finalData.jobId}`);
            set(printJobRef, printJob);
            addLog(`Notifikasi cetak dikirim ke Admin BP`, 'text-blue-400');
          } catch (error) {
            console.error("Failed to send print job to RTDB:", error);
            addLog(`Gagal mengirim notifikasi cetak`, 'text-destructive');
          }
        }
        // --- End Real-time Notification ---


        // Save to production history
        try {
            const storedHistory = localStorage.getItem(PRODUCTION_HISTORY_KEY);
            const history: ProductionHistoryEntry[] = storedHistory ? JSON.parse(storedHistory) : [];
            history.push(finalData);
            localStorage.setItem(PRODUCTION_HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error("Failed to save production history", error);
        }

        if (jobInfo.reqNo.trim()) {
            const reqNoAsNumber = parseInt(jobInfo.reqNo, 10);
            if (!isNaN(reqNoAsNumber)) {
                let foundAndUpdate = false;
                const updatedScheduleData = getScheduleSheetData().map(row => {
                    if (parseInt(row.no, 10) === reqNoAsNumber) {
                        foundAndUpdate = true;
                        const currentTerkirim = parseFloat(row.terkirim) || 0;
                        const addedVolume = Number(jobInfo.targetVolume) || 0;
                        const newTerkirim = currentTerkirim + addedVolume;
                        const originalVolume = parseFloat(row.volume) || 0;
                        const newSisa = originalVolume - newTerkirim;
                        return {
                            ...row,
                            terkirim: newTerkirim.toFixed(2),
                            sisa: newSisa.toFixed(2)
                        };
                    }
                    return row;
                });
                
                if (foundAndUpdate) {
                    setScheduleData(updatedScheduleData);
                    saveScheduleSheetData(updatedScheduleData);
                    toast({ title: "Schedule Diperbarui", description: `Volume terkirim untuk REQ NO ${jobInfo.reqNo} telah diperbarui.`});
                } else {
                    toast({ variant: "destructive", title: "Schedule Tidak Ditemukan", description: `REQ NO ${jobInfo.reqNo} tidak ditemukan di schedule.`});
                }
            }
        }
        
        const printMode = localStorage.getItem(PRINTER_SETTINGS_KEY) as PrintMode | null || 'preview';

        if (printMode === 'preview') {
            setShowPrintPreview(true);
        } else if (printMode === 'direct') {
            setTimeout(() => {
                printElement('direct-print-content');
            }, 100);
        } else { // 'save' mode
            toast({
                title: 'Data Disimpan',
                description: 'Data batch telah berhasil disimpan tanpa mencetak.',
            });
        }
    }

  const handleProcessControl = (action: 'START' | 'STOP') => {
    if (!powerOn) return;

    if (operasiMode === 'AUTO') {
        setAutoProcessStep('idle');
        resetStateForNewJob();
        addLog('Proses AUTO dihentikan.', 'text-destructive');
    } else { // MANUAL MODE
        if (action === 'START') {
            resetStateForNewJob();
            setIsManualProcessRunning(true);
            setBatchStartTime(new Date());
            addLog('Loading manual dimulai', 'text-green-500');
        } else if (action === 'STOP' && isManualProcessRunning) {
            setIsManualProcessRunning(false);
            finishAndPrintBatch();
            addLog('Loading manual selesai', 'text-primary');
        }
    }
  };

  const handleSetPowerOn = (isOn: boolean) => {
    setPowerOn(isOn);
    if (!isOn) {
        handleProcessControl('STOP');
        resetStateForNewJob();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-9">
          <WeightDisplayPanel
              aggregateWeight={aggregateWeight}
              airWeight={airWeight}
              semenWeight={semenWeight}
              targetAggregate={currentTargetWeights.pasir1 + currentTargetWeights.pasir2 + currentTargetWeights.batu1 + currentTargetWeights.batu2}
              targetAir={currentTargetWeights.air}
              targetSemen={currentTargetWeights.semen}
              disabled={!powerOn || isManualProcessRunning || (operasiMode === 'AUTO' && autoProcessStep !== 'idle' && autoProcessStep !== 'complete')}
          />
        </div>
        <div className="col-span-3">
          <StatusPanel 
            log={activityLog}
            timerDisplay={timerDisplay}
            mixingTime={mixingTime}
            setMixingTime={setMixingTime}
            disabled={!powerOn || isManualProcessRunning || (operasiMode === 'AUTO' && autoProcessStep !== 'idle' && autoProcessStep !== 'complete')}
            currentMixInfo={ operasiMode === 'AUTO' && autoProcessStep !== 'idle' && autoProcessStep !== 'complete' ? {
              current: currentMixNumber,
              total: jobInfo.jumlahMixing
            } : undefined}
          />
        </div>
      </div>
      
      <div>
        <ControlPanel
          powerOn={powerOn}
          setPowerOn={handleSetPowerOn}
          formulas={formulas}
          operasiMode={operasiMode}
          setOperasiMode={setOperasiMode}
          handleProcessControl={handleProcessControl}
          jobInfo={jobInfo}
          setJobInfo={setJobInfo}
          isManualProcessRunning={isManualProcessRunning}
          isJobInfoLocked={isJobInfoLocked}
          volumeWarning={volumeWarning}
          scheduleStatusWarning={scheduleStatusWarning}
          hasActiveSchedule={hasActiveSchedule}
        />
      </div>
      
      <div>
        <ScheduleSheet isOperatorView={true} />
      </div>
        
      <Sheet open={showPrintPreview} onOpenChange={setShowPrintPreview}>
      <SheetContent className="w-full sm:max-w-4xl p-0 flex flex-col">
          <SheetHeader className="p-6 bg-background border-b">
              <SheetTitle>Print Preview</SheetTitle>
              <SheetDescription>
              Review the batch details below. Use the print button to get a physical copy.
              </SheetDescription>
          </SheetHeader>
          <PrintPreview 
              data={completedBatchData}
              operatorName={user?.username}
              onClose={() => setShowPrintPreview(false)} 
          />
      </SheetContent>
      </Sheet>
      
      <div className="hidden">
          <div id="direct-print-content">
              {completedBatchData && <PrintPreview data={completedBatchData} operatorName={user?.username} onClose={() => {}} />}
          </div>
      </div>
    </div>
  );
}
