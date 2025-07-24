'use client';

import type { JobMixFormula } from '@/lib/types';

const FORMULAS_STORAGE_KEY = 'app-job-mix-formulas';

const initialFormulas: JobMixFormula[] = [
  { id: '1', mutuBeton: 'K225', mutuCode: 'BPM', pasir1: 400, pasir2: 365, batu1: 500, batu2: 529, batu3: 0, batu4: 0, air: 215, semen: 371, additive1: 0, additive2: 0, additive3: 0 },
  { id: '2', mutuBeton: 'K300', mutuCode: 'BPM', pasir1: 350, pasir2: 348, batu1: 520, batu2: 527, batu3: 0, batu4: 0, air: 215, semen: 413, additive1: 0, additive2: 0, additive3: 0 },
  { id: '3', mutuBeton: 'K350', mutuCode: 'BPM', pasir1: 340, pasir2: 341, batu1: 510, batu2: 511, batu3: 0, batu4: 0, air: 215, semen: 439, additive1: 0, additive2: 0, additive3: 0 },
];

export function getFormulas(): JobMixFormula[] {
  try {
    const storedData = localStorage.getItem(FORMULAS_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    } else {
      // Seed if empty
      localStorage.setItem(FORMULAS_STORAGE_KEY, JSON.stringify(initialFormulas));
      return initialFormulas;
    }
  } catch (error) {
    console.error('Failed to get formulas from localStorage:', error);
    return [];
  }
}

export function saveFormulas(formulas: JobMixFormula[]): void {
  try {
    localStorage.setItem(FORMULAS_STORAGE_KEY, JSON.stringify(formulas));
  } catch (error) {
    console.error('Failed to save formulas to localStorage:', error);
  }
}

export function addFormula(formulaData: Omit<JobMixFormula, 'id'>): void {
  const formulas = getFormulas();
  const newFormula: JobMixFormula = { ...formulaData, id: new Date().toISOString() };
  const updatedFormulas = [...formulas, newFormula];
  saveFormulas(updatedFormulas);
}

export function updateFormula(updatedFormula: JobMixFormula): void {
  let formulas = getFormulas();
  const index = formulas.findIndex(f => f.id === updatedFormula.id);
  if (index !== -1) {
    formulas[index] = updatedFormula;
    saveFormulas(formulas);
  }
}

export function deleteFormula(formulaId: string): void {
  let formulas = getFormulas();
  const updatedFormulas = formulas.filter(f => f.id !== formulaId);
  saveFormulas(updatedFormulas);
}
