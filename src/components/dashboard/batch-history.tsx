// This file is no longer used for manual controls as they have been moved to their own page.
// The file is kept in case it will be used for batch history functionality later.

export function ManualControlPanel() {
    return null;
}

export type ManualControlsState = {
  pasir1: boolean;
  pasir2: boolean;
  batu1: boolean;
  batu2: boolean;
  airTimbang: boolean;
  airBuang: boolean;
  selectedSilo: string;
  semenTimbang: boolean;
  semen: boolean;
  pintuBuka: boolean;
  pintuTutup: boolean;
  konveyorBawah: boolean;
  konveyorAtas: boolean;
  klakson: boolean;
}
