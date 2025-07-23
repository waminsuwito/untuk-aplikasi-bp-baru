'use client';

import type { JobMixFormula } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const FORMULAS_COLLECTION = 'job-mix-formulas';

const initialFormulas: JobMixFormula[] = [
  { id: '1', mutuBeton: 'K225', mutuCode: 'BPM', pasir1: 400, pasir2: 365, batu1: 500, batu2: 529, batu3: 0, batu4: 0, air: 215, semen: 371, additive1: 0, additive2: 0, additive3: 0 },
  { id: '2', mutuBeton: 'K300', mutuCode: 'BPM', pasir1: 350, pasir2: 348, batu1: 520, batu2: 527, batu3: 0, batu4: 0, air: 215, semen: 413, additive1: 0, additive2: 0, additive3: 0 },
  { id: '3', mutuBeton: 'K350', mutuCode: 'BPM', pasir1: 340, pasir2: 341, batu1: 510, batu2: 511, batu3: 0, batu4: 0, air: 215, semen: 439, additive1: 0, additive2: 0, additive3: 0 },
];

export async function getFormulas(): Promise<JobMixFormula[]> {
  try {
    const formulasCollection = collection(firestore, FORMULAS_COLLECTION);
    const snapshot = await getDocs(formulasCollection);
    if (snapshot.empty) {
      // Seed initial data if the collection is empty
      for (const formula of initialFormulas) {
        const docRef = doc(firestore, FORMULAS_COLLECTION, formula.id);
        await setDoc(docRef, formula);
      }
      return initialFormulas;
    }
    return snapshot.docs.map(doc => doc.data() as JobMixFormula);
  } catch (error) {
    console.error('Failed to get formulas from Firestore:', error);
    return [];
  }
}

export async function saveFormulas(formulas: JobMixFormula[]): Promise<void> {
  try {
    const formulasCollection = collection(firestore, FORMULAS_COLLECTION);
    for (const formula of formulas) {
      const docRef = doc(firestore, FORMULAS_COLLECTION, formula.id);
      await setDoc(docRef, formula, { merge: true });
    }
  } catch (error) {
    console.error('Failed to save formulas to Firestore:', error);
  }
}

export async function addFormula(formulaData: Omit<JobMixFormula, 'id'>): Promise<void> {
  const newId = new Date().toISOString();
  const newFormula: JobMixFormula = { ...formulaData, id: newId };
  const docRef = doc(firestore, FORMULAS_COLLECTION, newId);
  await setDoc(docRef, newFormula);
}

export async function updateFormula(updatedFormula: JobMixFormula): Promise<void> {
  const docRef = doc(firestore, FORMULAS_COLLECTION, updatedFormula.id);
  await setDoc(docRef, updatedFormula, { merge: true });
}

export async function deleteFormula(formulaId: string): Promise<void> {
  const docRef = doc(firestore, FORMULAS_COLLECTION, formulaId);
  await deleteDoc(docRef);
}
