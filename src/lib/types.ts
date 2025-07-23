

import type { LucideIcon } from 'lucide-react';

export interface Material {
  id: string;
  name: string;
  quantity: number;
  capacity: number;
  unit: string;
  Icon: LucideIcon;
  lowLevelThreshold: number;
}

export interface Formula {
  id: string;
  name: string;
  materials: {
    materialId: string;
    quantity: number;
  }[];
  mixingTime: number; // in seconds
}

export const jabatanOptions = [
  "OWNER",
  "SUPER ADMIN",
  "ADMIN BP",
  "ADMIN LOGISTIK",
  "ADMIN PRECAST",
  "ADMIN QC",
  "HELPER",
  "HELPER BP",
  "HELPER CP",
  "HELPER LABORAT",
  "HELPER LAS",
  "HELPER PRECAST",
  "HELPER TAMBAL BAN",
  "HRD",
  "HSE/K3",
  "KEP KOOR BP",
  "KEP KOOR QC",
  "KEP KOOR TEKNIK",
  "KEPALA BP",
  "KEPALA GUDANG",
  "KEPALA MEKANIK",
  "KEPALA OPRATOR",
  "KEPALA PRECAST",
  "KEPALA SOPIR",
  "KEPALA WORKSHOP",
  "LAYAR MONITOR",
  "LOGISTIK MATERIAL",
  "OPRATOR BATA RINGAN",
  "OPRATOR BP",
  "OPRATOR CP",
  "OPRATOR LOADER",
  "OPRATOR PAVING",
  "QC",
  "SOPIR DT",
  "SOPIR TM",
  "TRANSPORTER",
  "TUKANG BOBOK",
  "TUKANG LAS",
] as const;
export type Jabatan = (typeof jabatanOptions)[number];

export const userLocations = [
  "BP PEKANBARU",
  "BP DUMAI",
  "BP BAUNG",
  "BP IKN",
] as const;
export type UserLocation = (typeof userLocations)[number];

export interface User {
  id: string;
  username: string;
  password?: string;
  jabatan: Jabatan;
  location?: UserLocation;
  nik?: string;
}

export interface Vehicle {
  id: string;
  nomorPolisi: string;
  nomorLambung: string;
  jenisKendaraan: string;
  status: string;
  location: UserLocation;
}

export interface JobMixFormula {
  id: string;
  mutuBeton: string;
  mutuCode?: string;
  pasir1: number;
  pasir2: number;
  batu1: number;
  batu2: number;
  batu3: number;
  batu4: number;
  air: number;
  semen: number;
  additive1: number;
  additive2: number;
  additive3: number;
}

export interface Schedule {
  id: string;
  customerName: string;
  projectLocation: string;
  concreteQuality: string;
  slump: string;
  volume: string;
  mediaCor: 'CP' | 'Manual';
  date: string; // YYYY-MM-DD format
}

export type BongkarStatus = 'Belum Dimulai' | 'Proses' | 'Istirahat' | 'Selesai';

export interface BongkarMaterial {
  id: string;
  namaMaterial: string;
  kapalKendaraan: string;
  namaKaptenSopir: string;
  volume: string;
  keterangan: string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  status: BongkarStatus;
  waktuMulaiIstirahat: string | null;
  totalIstirahatMs: number;
  location: UserLocation; // Added location
}

export interface AttendanceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface GlobalAttendanceRecord {
  id: string; // e.g., NIK-YYYY-MM-DD
  nik: string;
  nama: string;
  location: UserLocation;
  date: string; // YYYY-MM-DD
  absenMasuk: string | null; // ISO String
  terlambat: string | null; // e.g., "15m" or null
  absenPulang: string | null; // ISO String
  lembur: string | null; // e.g., "1h 30m" or null
  photoMasuk: string | null; // Data URI
  photoPulang: string | null; // Data URI
}

export interface AnonymousReport {
  id: string;
  reportText: string;
  photoDataUri: string | null;
  timestamp: string; // ISO String
  status: 'new' | 'read';
}

export interface AccidentReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterNik: string;
  location: UserLocation;
  accidentLocation: string; // e.g., "Area Mixer", "Gudang Semen"
  accidentTimestamp: string; // ISO String
  description: string;
  photoDataUri: string | null;
  timestamp: string; // Submission timestamp
  status: 'new' | 'reviewed';
}

export interface DailyActivity {
  text: string | null;
  photo: string | null; // Data URI
  timestamp: string | null; // ISO String
}

export interface DailyActivityReport {
  id: string; // e.g., userId-YYYY-MM-DD
  userId: string;
  nik: string;
  username: string;
  location: UserLocation;
  date: string; // YYYY-MM-DD
  pagi: DailyActivity;
  siang: DailyActivity;
  lembur?: DailyActivity;
}

export interface BroadcastMessage {
  id: string;
  messageText: string;
  timestamp: string; // ISO String
}

interface UserFeedback {
    id: string;
    reporterId: string;
    reporterName: string;
    reporterNik: string;
    location: UserLocation;
    text: string;
    timestamp: string; // ISO String
    status: 'new' | 'read';
}

export type Suggestion = UserFeedback;
export type Complaint = UserFeedback;

export type ChecklistStatus = 'baik' | 'rusak' | 'perlu_perhatian';

export interface TruckChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus | null;
  photo: string | null; // Data URI
  notes?: string;
}

export interface TruckChecklistReport {
  id: string; // Composite key like `userId-YYYY-MM-DD`
  userId: string;
  userNik: string;
  username: string;
  location: UserLocation;
  timestamp: string; // ISO String of submission time
  items: TruckChecklistItem[];
  vehicleType: 'tm' | 'loader';
}

export type ScheduleStatus = 'Menunggu' | 'Proses' | 'Selesai' | 'Tunda' | 'Batal';

export type ScheduleSheetRow = {
  no: string;
  noPo: string;
  nama: string;
  lokasi: string;
  mutuBeton: string;
  slump: string;
  mediaCor: string;
  volume: string;
  terkirim: string;
  sisa: string;
  penambahanVol: string;
  totalVol: string;
  status: ScheduleStatus;
};

export interface ProductionHistoryEntry {
  jobId: string;
  reqNo: string;
  namaPelanggan: string;
  lokasiProyek: string;
  noPolisi: string;
  namaSopir: string;
  mutuBeton: string;
  mutuCode?: string;
  targetVolume: number;
  slump: number;
  startTime: string; // ISO String
  endTime: string; // ISO String
  targetWeights: {
    pasir1: number;
    pasir2: number;
    batu1: number;
    batu2: number;
    batu3: number;
    batu4: number;
    air: number;
    semen: number;
    additive1: number;
    additive2: number;
    additive3: number;
  };
  actualWeights: {
    pasir1: number;
    pasir2: number;
    batu1: number;
    batu2: number;
    batu3: number;
    batu4: number;
    air: number;
    semen: number;
    additive1: number;
    additive2: number;
    additive3: number;
  };
}


export type WorkOrderStatus = 'Menunggu' | 'Proses' | 'Dikerjakan' | 'Tunda' | 'Selesai';

export interface SparePartUsage {
  id: string;
  code: string;
  name: string;
  quantity: number;
}

export interface WorkOrder {
  id: string;
  assignedMechanics: { id: string; name: string }[];
  vehicle: {
    reportId: string;
    userId: string;
    userNik: string;
    username: string;
    location: UserLocation;
    timestamp: string;
    damagedItems: TruckChecklistItem[];
  };
  startTime: string;
  processStartTime?: string;
  targetCompletionTime?: string;
  status: WorkOrderStatus;
  completionTime?: string;
  notes?: string;
  actualDamagesNotes?: string;
  waktuMulaiTunda?: string | null;
  totalWaktuTundaMs?: number;
  usedSpareParts?: SparePartUsage[];
}

export interface Assignment {
  id: string;
  userId: string;
  username: string;
  vehicleId: string;
  vehicleNomorPolisi: string;
}

export interface VehiclePosition {
  id: string;
  nomorPolisi: string;
  jenis: string;
  operator: string | null;
  lat: number;
  lng: number;
}

export interface PrintJobData {
  status: 'pending' | 'processed';
  operatorName: string;
  payload: ProductionHistoryEntry;
}
