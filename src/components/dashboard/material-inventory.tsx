import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface WeightDisplayProps {
  title: string;
  value: number;
  unit: string;
  target: number;
  disabled: boolean;
}

function WeightDisplay({ title, value, unit, target, disabled }: WeightDisplayProps) {
  const percentage = target > 0 ? (value / target) * 100 : 0;
  const formattedValue = Math.round(value).toString();

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="text-center text-primary uppercase text-sm tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="digital-display">
          <div className="digital-display-value">{formattedValue}</div>
          <div className="digital-display-unit">{unit}</div>
        </div>
        <div className="mt-3 space-y-2">
          <Progress value={percentage} className="h-3" />
          <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
            <span>Target: {Math.round(target)} {unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WeightDisplayPanel({
  aggregateWeight,
  airWeight,
  semenWeight,
  targetAggregate,
  targetAir,
  targetSemen,
  disabled
}: {
  aggregateWeight: number,
  airWeight: number,
  semenWeight: number,
  targetAggregate: number,
  targetAir: number,
  targetSemen: number,
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <WeightDisplay 
        title="Aggregate (Pasir + Batu)"
        value={aggregateWeight}
        unit="Kg"
        target={targetAggregate}
        disabled={disabled}
      />
      <WeightDisplay 
        title="Air"
        value={airWeight}
        unit="Kg"
        target={targetAir}
        disabled={disabled}
      />
      <WeightDisplay 
        title="Semen"
        value={semenWeight}
        unit="Kg"
        target={targetSemen}
        disabled={disabled}
      />
    </div>
  );
}
