

export const MIXING_PROCESS_STORAGE_KEY = 'mixingProcessConfig';

export interface MixingProcessStep {
  id: 'aggregates' | 'water' | 'semen';
  name: string;
  order: number;
  delay: number;
}
export interface MixingProcessConfig {
  steps: MixingProcessStep[];
}


export const defaultMixingProcess: MixingProcessConfig = {
  steps: [
    { id: 'aggregates', name: 'Pasir & Batu', order: 1, delay: 0 },
    { id: 'water', name: 'Air', order: 1, delay: 7 },
    { id: 'semen', name: 'Semen', order: 2, delay: 0 },
  ],
};


export const MIXER_TIMER_CONFIG_KEY = 'app-mixer-timer-config';

export interface MixerTimerConfig {
  open1_s: number;
  pause1_s: number;
  open2_s: number;
  pause2_s: number;
  open3_s: number;
  pause3_s: number;
  close_s: number;
}

export const defaultMixerTimerConfig: MixerTimerConfig = {
  open1_s: 2,
  pause1_s: 5,
  open2_s: 2,
  pause2_s: 10,
  open3_s: 0, 
  pause3_s: 0,
  close_s: 5,
};
