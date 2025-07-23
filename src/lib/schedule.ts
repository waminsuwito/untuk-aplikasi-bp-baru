'use client';

import type { ScheduleSheetRow } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';


export const SCHEDULE_SHEET_COLLECTION = 'schedule-sheet';

export async function getScheduleSheetData(): Promise<ScheduleSheetRow[]> {
  try {
    const scheduleCollection = collection(firestore, SCHEDULE_SHEET_COLLECTION);
    const snapshot = await getDocs(scheduleCollection);
    
    if (snapshot.empty) {
      return [];
    }
    
    const data = snapshot.docs.map(doc => doc.data() as ScheduleSheetRow);
    // Sort by 'no' field numerically
    return data.sort((a, b) => (parseInt(a.no) || 0) - (parseInt(b.no) || 0));

  } catch (error) {
    console.error('Failed to get schedule sheet data from Firestore:', error);
    return [];
  }
}

export async function saveScheduleSheetData(data: ScheduleSheetRow[]): Promise<void> {
  try {
    const batch = writeBatch(firestore);
    const scheduleCollection = collection(firestore, SCHEDULE_SHEET_COLLECTION);
    
    // First, delete all existing documents in the collection to handle deletions from the UI
    const existingSnapshot = await getDocs(scheduleCollection);
    existingSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Then, add all the current rows from the UI that are not empty
    const nonEmptyData = data.filter(row => Object.values(row).some(val => val && String(val).trim() !== ''));

    nonEmptyData.forEach(row => {
      // Use 'no' as the document ID. If 'no' is not present, this row is invalid and won't be saved.
      if (row.no && row.no.trim() !== '') {
        const docRef = doc(firestore, SCHEDULE_SHEET_COLLECTION, row.no.trim());
        batch.set(docRef, row);
      }
    });

    await batch.commit();

  } catch (error) {
    console.error('Failed to save schedule sheet data to Firestore:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}
