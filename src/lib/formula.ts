'use client';

import { firestore } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { JobMixFormula } from '@/lib/types';

const FORMULAS_COLLECTION_NAME = 'formulas';

export async function getFormulas(): Promise<JobMixFormula[]> {
  try {
    const formulasCollection = collection(firestore, FORMULAS_COLLECTION_NAME);
    const formulaSnapshot = await getDocs(formulasCollection);
    if (formulaSnapshot.empty) {
      // Data is empty, no seeding on production.
      return [];
    }
    const formulaList = formulaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobMixFormula));
    return formulaList;
  } catch (error) {
    console.error('Failed to get formulas from Firestore:', error);
    return [];
  }
}

export async function saveFormulas(formulas: JobMixFormula[]): Promise<void> {
    // This function might be less used now, as we'll add/update/delete one by one.
    // But it could be useful for a bulk import feature.
    try {
        const formulasCollection = collection(firestore, FORMULAS_COLLECTION_NAME);
        for (const formula of formulas) {
            const { id, ...data } = formula;
            const docRef = doc(formulasCollection, id);
            await addDoc(formulasCollection, data);
        }
    } catch (error) {
        console.error('Failed to save formulas to Firestore:', error);
    }
}

export async function addFormula(formulaData: Omit<JobMixFormula, 'id'>): Promise<void> {
  await addDoc(collection(firestore, FORMULAS_COLLECTION_NAME), formulaData);
}

export async function updateFormula(updatedFormula: JobMixFormula): Promise<void> {
  const { id, ...data } = updatedFormula;
  const formulaRef = doc(firestore, FORMULAS_COLLECTION_NAME, id);
  await updateDoc(formulaRef, data);
}

export async function deleteFormula(formulaId: string): Promise<void> {
  await deleteDoc(doc(firestore, FORMULAS_COLLECTION_NAME, formulaId));
}
