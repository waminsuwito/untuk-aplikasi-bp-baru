

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { JobMixFormula } from '@/lib/types';
import { AlertTriangle, Ban } from 'lucide-react';

interface ControlPanelProps {
  powerOn: boolean;
  setPowerOn: (on: boolean) => void;
  formulas: JobMixFormula[];
  operasiMode: 'MANUAL' | 'AUTO';
  setOperasiMode: (mode: 'MANUAL' | 'AUTO') => void;
  handleProcessControl: (action: 'START' | 'STOP') => void;
  
  jobInfo: {
    selectedFormulaId: string;
    reqNo: string;
    namaPelanggan: string;
    lokasiProyek: string;
    targetVolume: number | '';
    jumlahMixing: number;
    slump: number;
    mediaCor: string;
    noPolisi: string;
    namaSopir: string;
  };
  setJobInfo: (info: React.SetStateAction<ControlPanelProps['jobInfo']>) => void;
  isManualProcessRunning: boolean;
  isJobInfoLocked: boolean;
  volumeWarning: string;
  scheduleStatusWarning: string;
  hasActiveSchedule: boolean;
}

export function ControlPanel({
  powerOn,
  setPowerOn,
  formulas,
  operasiMode,
  setOperasiMode,
  handleProcessControl,
  jobInfo,
  setJobInfo,
  isManualProcessRunning,
  isJobInfoLocked,
  volumeWarning,
  scheduleStatusWarning,
  hasActiveSchedule,
}: ControlPanelProps) {

  const [mixWarning, setMixWarning] = useState('');

  const handleJobInfoChange = <K extends keyof ControlPanelProps['jobInfo']>(key: K, value: ControlPanelProps['jobInfo'][K]) => {
    setJobInfo(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
      const targetVolumeNum = Number(jobInfo.targetVolume);
      const volumePerMix = jobInfo.jumlahMixing > 0 ? targetVolumeNum / jobInfo.jumlahMixing : 0;
      if (volumePerMix > 3.5) {
          setMixWarning(`Volume per mix (${volumePerMix.toFixed(2)} M³) melebihi kapasitas mixer (3.5 M³).`);
      } else {
          setMixWarning('');
      }
  }, [jobInfo.targetVolume, jobInfo.jumlahMixing]);

  const handleKlaksonPress = (isPressed: boolean) => {
    if (isPressed) {
      console.log('HONK HONK');
    }
  }

  const isStartDisabled = !powerOn || !jobInfo.reqNo.trim() || Number(jobInfo.targetVolume) <= 0 || (operasiMode === 'AUTO' && !!mixWarning) || (operasiMode === 'MANUAL' && isManualProcessRunning) || !!volumeWarning || !!scheduleStatusWarning || !hasActiveSchedule;
  const isStopDisabled = !powerOn || (operasiMode === 'MANUAL' && !isManualProcessRunning) || !hasActiveSchedule;
  
  const isFormDisabled = !powerOn || (jobInfo.reqNo.trim() !== '' && !isJobInfoLocked) || !hasActiveSchedule;


  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Job Info */}
      <Card className="col-span-1">
        <CardContent className="pt-6 space-y-4">
          {!hasActiveSchedule && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 rounded-lg">
                <Ban className="h-10 w-10 text-destructive mb-2"/>
                <p className="text-center font-semibold text-destructive">TIDAK ADA JADWAL COR AKTIF</p>
                <p className="text-center text-xs text-muted-foreground">Silakan minta Admin BP untuk mengaktifkan jadwal.</p>
            </div>
          )}
          <div>
            <Label htmlFor="req-no" className="text-xs text-muted-foreground">REQ NO</Label>
             <Input 
                id="req-no" 
                placeholder="Masukkan nomor request" 
                value={jobInfo.reqNo} 
                onChange={e => handleJobInfoChange('reqNo', e.target.value.toUpperCase())} 
                style={{ textTransform: 'uppercase' }}
                disabled={!powerOn || !hasActiveSchedule} 
            />
            {scheduleStatusWarning && (
                <div className="text-xs text-destructive mt-1 flex items-center gap-1 p-2 bg-destructive/10 rounded-md">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{scheduleStatusWarning}</span>
                </div>
             )}
          </div>
          <div>
            <Label htmlFor="nama-pelanggan" className="text-xs text-muted-foreground">NAMA PELANGGAN</Label>
             <Input 
                id="nama-pelanggan" 
                placeholder="Data dari schedule" 
                value={jobInfo.namaPelanggan} 
                onChange={e => handleJobInfoChange('namaPelanggan', e.target.value.toUpperCase())} 
                style={{ textTransform: 'uppercase' }}
                disabled={isFormDisabled || isJobInfoLocked} 
                readOnly
            />
          </div>
          <div>
            <Label htmlFor="lokasi-proyek" className="text-xs text-muted-foreground">LOKASI PROYEK</Label>
             <Input 
                id="lokasi-proyek" 
                placeholder="Data dari schedule" 
                value={jobInfo.lokasiProyek} 
                onChange={e => handleJobInfoChange('lokasiProyek', e.target.value.toUpperCase())} 
                style={{ textTransform: 'uppercase' }}
                disabled={isFormDisabled || isJobInfoLocked}
                readOnly
            />
          </div>
        </CardContent>
      </Card>
      {/* Target Volume */}
      <Card className="col-span-1">
        <CardContent className="pt-6 space-y-4">
          {!hasActiveSchedule && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg"></div>
          )}
          <div>
            <Label htmlFor="mutu-beton" className="text-xs text-muted-foreground">MUTU BETON</Label>
            <Select 
              value={jobInfo.selectedFormulaId} 
              onValueChange={(value) => handleJobInfoChange('selectedFormulaId', value)} 
              disabled={isFormDisabled || isJobInfoLocked}
            >
              <SelectTrigger id="mutu-beton"><SelectValue placeholder="Pilih mutu..." /></SelectTrigger>
              <SelectContent>
                {formulas.map((formula) => (
                  <SelectItem key={formula.id} value={formula.id}>
                    {formula.mutuCode ? `${formula.mutuBeton} ${formula.mutuCode}` : formula.mutuBeton}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div>
            <Label htmlFor="target-volume" className="text-xs text-muted-foreground">TARGET VOLUME (M³)</Label>
            <Input 
                id="target-volume" 
                type="number" 
                value={jobInfo.targetVolume} 
                onChange={(e) => handleJobInfoChange('targetVolume', e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                step="0.1"
                disabled={isFormDisabled}
                placeholder="0.0"
            />
             {volumeWarning && (
                <div className="text-xs text-destructive mt-1 flex items-center gap-1 p-2 bg-destructive/10 rounded-md">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{volumeWarning}</span>
                </div>
             )}
          </div>
           <div>
            <Label htmlFor="jumlah-mixing" className="text-xs text-muted-foreground">JUMLAH MIXING</Label>
            <Input 
                id="jumlah-mixing" 
                type="number" 
                value={jobInfo.jumlahMixing} 
                onChange={(e) => handleJobInfoChange('jumlahMixing', Number(e.target.value) > 0 ? Number(e.target.value) : 1)}
                min="1"
                disabled={isFormDisabled} 
            />
             <p className="text-xs text-muted-foreground mt-1">Kapasitas mixer: 3.5 M³ per mix</p>
             {mixWarning && !volumeWarning && (
                <div className="text-xs text-destructive mt-1 flex items-center gap-1 p-2 bg-destructive/10 rounded-md">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{mixWarning}</span>
                </div>
             )}
          </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slump" className="text-xs text-muted-foreground">SLUMP (CM)</Label>
                <Input 
                    id="slump" 
                    type="number" 
                    value={jobInfo.slump} 
                    onChange={(e) => handleJobInfoChange('slump', Number(e.target.value))} 
                    disabled={isFormDisabled || isJobInfoLocked}
                />
              </div>
              <div>
                <Label htmlFor="media-cor" className="text-xs text-muted-foreground">MEDIA COR</Label>
                <Input 
                    id="media-cor" 
                    value={jobInfo.mediaCor} 
                    readOnly
                    disabled={isFormDisabled || isJobInfoLocked}
                />
              </div>
           </div>
        </CardContent>
      </Card>

      {/* Process Controls */}
      <Card className="col-span-1">
        <CardContent className="pt-6 space-y-2">
           <div className="text-center text-primary uppercase text-sm tracking-wider font-semibold mb-2">Mode Operasi</div>
           <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setOperasiMode('MANUAL')} variant={operasiMode === 'MANUAL' ? 'default' : 'secondary'} className="font-bold" disabled={!powerOn || !hasActiveSchedule}>MANUAL</Button>
              <Button onClick={() => setOperasiMode('AUTO')} variant={operasiMode === 'AUTO' ? 'default' : 'secondary'} className="font-bold" disabled={!powerOn || !hasActiveSchedule}>AUTO</Button>
           </div>
           <div className="text-center text-primary uppercase text-sm tracking-wider font-semibold pt-4 mb-2">Kontrol Proses</div>
           <div className="grid grid-cols-2 gap-2">
             <Button onClick={() => handleProcessControl('START')} className="font-bold text-lg col-span-1 py-6" disabled={isStartDisabled}>START</Button>
             <Button onClick={() => handleProcessControl('STOP')} variant="destructive" className="font-bold text-lg col-span-1 py-6" disabled={isStopDisabled}>STOP</Button>
           </div>
            <Button 
              onMouseDown={() => handleKlaksonPress(true)} 
              onMouseUp={() => handleKlaksonPress(false)}
              onMouseLeave={() => handleKlaksonPress(false)}
              onTouchStart={() => handleKlaksonPress(true)}
              onTouchEnd={() => handleKlaksonPress(false)}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
              disabled={!powerOn}
            >
              KLAKSON
            </Button>
            <Button onClick={() => setPowerOn(!powerOn)} variant={powerOn ? 'default' : 'destructive'} className={cn("w-full font-bold", powerOn && "blink")}>
                POWER {powerOn ? 'ON' : 'OFF'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
