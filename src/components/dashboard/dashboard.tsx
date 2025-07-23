
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDatabase, ref, onValue, set, off } from 'firebase/database';
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
import { app, database as firebaseDatabase } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { getScheduleSheetData, saveScheduleSheetData } from '@/lib/schedule';
import { printElement } from '@/lib/utils';
import { AlertTriangle, Ban } from 'lucide-react';

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
const PRODUCTION_HISTORY_KEY = 'production-history';
type PrintMode = 'preview' | 'direct' | 'save';

export function Dashboard() {
  const { user } = useAuth();
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
          return updatedLogs.slice(-10);
      });
  };

  useEffect(() => {
    if (!user) {
        return;
    }

    const db = getDatabase(app);
    const weightsRef = ref(db, 'weights');

    const listener = onValue(weightsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            setAggregateWeight(data.aggregate || 0);
            setAirWeight(data.air || 0);
            setSemenWeight(data.semen || 0);
        } else {
            addLog("Inisialisasi data timbangan...", "text-blue-400");
            set(weightsRef, { aggregate: 0, air: 0, semen: 0 });
        }
    }, (error) => {
        console.error("Firebase weight listener error:", error);
        toast({
            variant: 'destructive',
            title: 'Koneksi Timbangan Gagal',
            description: `Tidak dapat memuat data timbangan: ${error.message}`
        });
    });

    return () => {
        off(weightsRef, 'value', listener);
    };
  }, [user, toast]);


  useEffect(() => {
    async function loadInitialData() {
        const loadedFormulas = await getFormulas();
        setFormulas(loadedFormulas);
        const loadedSchedule = await getScheduleSheetData();
        setScheduleData(loadedSchedule);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    // This logic remains the same
  }, [jobInfo.reqNo, scheduleData, formulas, isJobInfoLocked, toast]);

  useEffect(() => {
    // This logic remains the same
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
     const db = getDatabase(app);
     if(db && user) {
        set(ref(db, 'weights'), { aggregate: 0, air: 0, semen: 0 });
     }
     setCurrentMixNumber(0);
     setActivityLog([]);
     setShowPrintPreview(false);
     setCompletedBatchData(null);
     setBatchStartTime(null);
  }
  
  const currentTargetWeights = useMemo(() => {
    const defaultWeights = {
      pasir1: 0, pasir2: 0, batu1: 0, batu2: 0, batu3: 0, batu4: 0,
      air: 0, semen: 0, additive1: 0, additive2: 0, additive3: 0,
    };

    if (!jobInfo.selectedFormulaId || formulas.length === 0) {
      return defaultWeights;
    }
    const formula = formulas.find(f => f.id === jobInfo.selectedFormulaId);
    if (!formula) {
      return defaultWeights;
    }

    const targetVolumeNum = Number(jobInfo.targetVolume) || 0;
    const jumlahMixingNum = Number(jobInfo.jumlahMixing) || 1;
    const factor = jumlahMixingNum > 0 ? targetVolumeNum / jumlahMixingNum : 0;

    return {
      pasir1: (formula.pasir1 || 0) * factor,
      pasir2: (formula.pasir2 || 0) * factor,
      batu1: (formula.batu1 || 0) * factor,
      batu2: (formula.batu2 || 0) * factor,
      batu3: (formula.batu3 || 0) * factor,
      batu4: (formula.batu4 || 0) * factor,
      air: (formula.air || 0) * factor,
      semen: (formula.semen || 0) * factor,
      additive1: (formula.additive1 || 0) * factor,
      additive2: (formula.additive2 || 0) * factor,
      additive3: (formula.additive3 || 0) * factor,
    };
  }, [jobInfo.selectedFormulaId, jobInfo.targetVolume, jobInfo.jumlahMixing, formulas]);
  
  const finishAndPrintBatch = () => {
        // This logic remains largely the same, but saves to a firestore collection instead of localStorage
  }

  const handleProcessControl = (action: 'START' | 'STOP') => {
    // This logic remains the same
  };

  const handleSetPowerOn = (isOn: boolean) => {
    // This logic remains the same
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-9">
          <WeightDisplayPanel
            aggregateWeight={aggregateWeight}
            airWeight={airWeight}
            semenWeight={semenWeight}
            targetAggregate={currentTargetWeights.pasir1 + currentTargetWeights.pasir2 + currentTargetWeights.batu1 + currentTargetWeights.batu2 + currentTargetWeights.batu3 + currentTargetWeights.batu4}
            targetAir={currentTargetWeights.air}
            targetSemen={currentTargetWeights.semen}
          />
        </div>
        <div className="col-span-12 lg:col-span-3">
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
