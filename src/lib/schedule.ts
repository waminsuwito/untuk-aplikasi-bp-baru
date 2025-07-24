'use client';

import { firestore } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { ScheduleSheetRow } from '@/lib/types';

export const SCHEDULE_SHEET_STORAGE_KEY = 'schedule-sheet'; // This will be the document ID

export async function getScheduleSheetData(): Promise<ScheduleSheetRow[]> {
  try {
    const docRef = doc(firestore, 'schedules', SCHEDULE_SHEET_STORAGE_KEY);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data().sheetData;
      // Ensure it's an array
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error('Failed to get schedule sheet data from Firestore:', error);
  }
  return []; // Return empty array if nothing is stored or on error
}

export async function saveScheduleSheetData(data: ScheduleSheetRow[]): Promise<void> {
  try {
    // Filter out rows that are completely empty before saving
    const nonEmptyData = data.filter(row => Object.values(row).some(val => val && String(val).trim() !== ''));
    const docRef = doc(firestore, 'schedules', SCHEDULE_SHEET_STORAGE_KEY);
    await setDoc(docRef, { sheetData: nonEmptyData }, { merge: true });
  } catch (error) {
    console.error('Failed to save schedule sheet data to Firestore:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}
