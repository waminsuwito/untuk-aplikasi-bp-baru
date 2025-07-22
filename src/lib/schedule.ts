'use client';

import type { Schedule, ScheduleSheetRow } from '@/lib/types';

const SCHEDULES_STORAGE_KEY = 'app-schedules';
export const SCHEDULE_SHEET_STORAGE_KEY = 'app-schedule-sheet-data';


// For the form-based schedule on the /admin/schedule-cor page
export function getSchedules(): Schedule[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedSchedules = window.localStorage.getItem(SCHEDULES_STORAGE_KEY);
    return storedSchedules ? JSON.parse(storedSchedules) : [];
  } catch (error) {
    console.error('Failed to access schedules from localStorage:', error);
    return [];
  }
}

export function saveSchedules(schedules: Schedule[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
  } catch (error) {
    console.error('Failed to save schedules to localStorage:', error);
  }
}

// For the excel-like schedule sheet
export function getScheduleSheetData(): ScheduleSheetRow[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedData = localStorage.getItem(SCHEDULE_SHEET_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error('Failed to access schedule sheet data from localStorage:', error);
    return [];
  }
}

export function saveScheduleSheetData(data: ScheduleSheetRow[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Filter out completely empty rows before saving
    const nonEmptyData = data.filter(row => Object.values(row).some(val => val && val.trim() !== ''));
    localStorage.setItem(SCHEDULE_SHEET_STORAGE_KEY, JSON.stringify(nonEmptyData));
  } catch (error) {
    console.error('Failed to save schedule sheet data to localStorage:', error);
  }
}
