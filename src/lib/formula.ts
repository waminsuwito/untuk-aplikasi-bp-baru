
'use client';

import type { JobMixFormula } from '@/lib/types';

const FORMULAS_STORAGE_KEY = 'app-formulas';

// Pre-seeded data for demonstration
const seedFormulas: JobMixFormula[] = [
    {
        id: "1",
        mutuBeton: "K-225",
        mutuCode: "BPM",
        pasir1: 855,
        pasir2: 0,
        batu1: 1025,
        batu2: 0,
        batu3: 0,
        batu4: 0,
        semen: 300,
        air: 150,
        additive1: 0,
        additive2: 0,
        additive3: 0,
    },
    {
        id: "2",
        mutuBeton: "K-300",
        mutuCode: "BPS",
        pasir1: 750,
        pasir2: 0,
        batu1: 1100,
        batu2: 0,
        batu3: 0,
        batu4: 0,
        semen: 350,
        air: 175,
        additive1: 0.5,
        additive2: 0,
        additive3: 0,
    }
];

export function getFormulas(): JobMixFormula[] {
  try {
    const storedFormulas = localStorage.getItem(FORMULAS_STORAGE_KEY);
    if (storedFormulas) {
      return JSON.parse(storedFormulas);
    } else {
      // If no formulas are stored, seed with default data
      localStorage.setItem(FORMULAS_STORAGE_KEY, JSON.stringify(seedFormulas));
      return seedFormulas;
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
  const newFormula = {
    ...formulaData,
    id: `formula-${Date.now()}`,
  };
  formulas.push(newFormula);
  saveFormulas(formulas);
}

export function updateFormula(updatedFormula: JobMixFormula): void {
  let formulas = getFormulas();
  formulas = formulas.map(f => (f.id === updatedFormula.id ? updatedFormula : f));
  saveFormulas(formulas);
}

export function deleteFormula(formulaId: string): void {
  let formulas = getFormulas();
  formulas = formulas.filter(f => f.id !== formulaId);
  saveFormulas(formulas);
}
