'use client';

import type { ScheduleSheetRow } from '@/lib/types';

export const SCHEDULE_SHEET_STORAGE_KEY = 'app-schedule-sheet-data';

export function getScheduleSheetData(): ScheduleSheetRow[] {
  try {
    const storedData = localStorage.getItem(SCHEDULE_SHEET_STORAGE_KEY);
    if (storedData) {
      const data = JSON.parse(storedData);
      // Ensure it's an array
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error('Failed to get schedule sheet data from localStorage:', error);
  }
  return []; // Return empty array if nothing is stored or on error
}

export function saveScheduleSheetData(data: ScheduleSheetRow[]): void {
  try {
    // Filter out rows that are completely empty before saving
    const nonEmptyData = data.filter(row => Object.values(row).some(val => val && String(val).trim() !== ''));
    localStorage.setItem(SCHEDULE_SHEET_STORAGE_KEY, JSON.stringify(nonEmptyData));
  } catch (error) {
    console.error('Failed to save schedule sheet data to localStorage:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}
