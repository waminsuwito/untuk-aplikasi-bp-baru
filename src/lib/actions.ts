'use server';

import { suggestMixAdjustments, type SuggestMixAdjustmentsInput, type SuggestMixAdjustmentsOutput } from '@/ai/flows/suggest-mix-adjustments';

export async function getAiSuggestions(input: SuggestMixAdjustmentsInput): Promise<SuggestMixAdjustmentsOutput> {
  try {
    const result = await suggestMixAdjustments(input);
    return result;
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    // In a real app, you might want to return a more structured error
    throw new Error('Failed to get AI suggestions.');
  }
}
