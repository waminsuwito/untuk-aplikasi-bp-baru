// src/ai/flows/suggest-mix-adjustments.ts
'use server';
/**
 * @fileOverview AI-powered mix adjustment suggestions based on historical data,
 * current material quality, and environmental factors.
 *
 * - suggestMixAdjustments - A function that provides mix adjustment suggestions.
 * - SuggestMixAdjustmentsInput - The input type for the suggestMixAdjustments function.
 * - SuggestMixAdjustmentsOutput - The return type for the suggestMixAdjustments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMixAdjustmentsInputSchema = z.object({
  historicalBatchData: z.string().describe('Historical data from previous batches, including materials used, mixing times, and resulting mix properties.'),
  currentMaterialQuality: z.string().describe('Data on the current quality of materials, including moisture content, particle size, and purity.'),
  environmentalFactors: z.string().describe('Environmental factors such as ambient temperature, humidity, and weather conditions.'),
  targetMixProperties: z.string().describe('The target properties for the mix, including strength, consistency, and workability.'),
});
export type SuggestMixAdjustmentsInput = z.infer<typeof SuggestMixAdjustmentsInputSchema>;

const SuggestMixAdjustmentsOutputSchema = z.object({
  suggestedAdjustments: z.string().describe('Suggested adjustments to the mix formula, including specific material quantities and mixing times.'),
  rationale: z.string().describe('The rationale behind the suggested adjustments, explaining how they will optimize mix properties.'),
});
export type SuggestMixAdjustmentsOutput = z.infer<typeof SuggestMixAdjustmentsOutputSchema>;

export async function suggestMixAdjustments(input: SuggestMixAdjustmentsInput): Promise<SuggestMixAdjustmentsOutput> {
  return suggestMixAdjustmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMixAdjustmentsPrompt',
  input: {schema: SuggestMixAdjustmentsInputSchema},
  output: {schema: SuggestMixAdjustmentsOutputSchema},
  prompt: `You are an AI assistant that provides expert advice on batching plant operations.

  Based on the historical batch data, current material quality, environmental factors, and target mix properties, provide suggestions for adjustments to the mix formula.

  Historical Batch Data: {{{historicalBatchData}}}
  Current Material Quality: {{{currentMaterialQuality}}}
  Environmental Factors: {{{environmentalFactors}}}
  Target Mix Properties: {{{targetMixProperties}}}

  Consider all factors to provide optimal adjustments for the mix.
  The suggested adjustments should be very specific about which materials to adjust and by how much.
  Explain the rationale in terms understandable to a plant operator.
  `,
});

const suggestMixAdjustmentsFlow = ai.defineFlow(
  {
    name: 'suggestMixAdjustmentsFlow',
    inputSchema: SuggestMixAdjustmentsInputSchema,
    outputSchema: SuggestMixAdjustmentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
