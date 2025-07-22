'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAiSuggestions } from '@/lib/actions';
import type { SuggestMixAdjustmentsInput, SuggestMixAdjustmentsOutput } from '@/ai/flows/suggest-mix-adjustments';
import { Loader2, Wand2 } from 'lucide-react';
import { Separator } from '../ui/separator';

export function AiAdvisor() {
  const [input, setInput] = useState<SuggestMixAdjustmentsInput>({
    historicalBatchData: 'Batch K225, 20/07/2024: kekuatan 230 kg/cm2. Pasir lebih basah dari biasanya.',
    currentMaterialQuality: 'Pasir: kadar air 5%. Batu: bersih, ukuran seragam. Semen: baru, kantong tidak rusak.',
    environmentalFactors: 'Suhu: 32°C, Kelembaban: 85%, cerah.',
    targetMixProperties: 'K225, slump 12±2 cm, workability baik untuk pemompaan.',
  });
  const [suggestion, setSuggestion] = useState<SuggestMixAdjustmentsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof SuggestMixAdjustmentsInput, value: string) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await getAiSuggestions(input);
      setSuggestion(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get AI suggestions. Please try again.',
      });
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="text-primary" />
          <span>AI Mix Advisor</span>
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions to optimize your concrete mix based on current conditions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="historical-data">Historical Batch Data</Label>
              <Textarea
                id="historical-data"
                placeholder="e.g., Previous batch results, material performance..."
                value={input.historicalBatchData}
                onChange={(e) => handleInputChange('historicalBatchData', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="material-quality">Current Material Quality</Label>
              <Textarea
                id="material-quality"
                placeholder="e.g., Moisture content, purity, particle size..."
                value={input.currentMaterialQuality}
                onChange={(e) => handleInputChange('currentMaterialQuality', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="env-factors">Environmental Factors</Label>
              <Textarea
                id="env-factors"
                placeholder="e.g., Temperature, humidity, weather..."
                value={input.environmentalFactors}
                onChange={(e) => handleInputChange('environmentalFactors', e.target.value)}
                rows={3}
              />
            </div>
             <div>
              <Label htmlFor="target-props">Target Mix Properties</Label>
              <Textarea
                id="target-props"
                placeholder="e.g., Strength, slump, workability..."
                value={input.targetMixProperties}
                onChange={(e) => handleInputChange('targetMixProperties', e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="animate-spin" /> : 'Get Suggestions'}
            </Button>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-4">
            <h3 className="font-semibold text-center">Saran Penyesuaian</h3>
            {isLoading && (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
              </div>
            )}
            {suggestion && !isLoading && (
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-primary">Penyesuaian yang Disarankan:</h4>
                  <p className="whitespace-pre-wrap">{suggestion.suggestedAdjustments}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-primary">Alasan:</h4>
                  <p className="whitespace-pre-wrap">{suggestion.rationale}</p>
                </div>
              </div>
            )}
             {!suggestion && !isLoading && (
              <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground text-center">Your AI suggestions will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
