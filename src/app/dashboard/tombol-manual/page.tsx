
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { RELAY_MAPPINGS_KEY, type ControlMapping } from '@/app/dashboard/relay-settings/page';


function ControlGroup({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-card rounded-lg p-3 flex flex-col gap-2 ${className}`}>
            <h3 className="text-center text-primary font-semibold text-sm uppercase tracking-wider mb-1">{title}</h3>
            <div className="flex flex-col gap-2">
                {children}
            </div>
        </div>
    )
}

type ManualControlKey = 'pasir1' | 'pasir2' | 'batu1' | 'batu2' | 'airTimbang' | 'airBuang' | 'semenTimbang' | 'semen' | 'pintuBuka' | 'pintuTutup' | 'konveyorBawah' | 'konveyorAtas' | 'klakson';

type ManualControlsState = {
  [key in ManualControlKey]: boolean;
} & {
  selectedSilo: string;
};

const MomentaryButton = ({ 
  controlKey, 
  children, 
  className, 
  handlePress, 
  isActive,
  ...props
}: { 
  controlKey: keyof ManualControlsState, 
  children: React.ReactNode, 
  className?: string,
  handlePress: (key: keyof ManualControlsState, isPressed: boolean) => void,
  isActive: boolean,
  [x: string]: any; 
}) => (
  <Button
    onMouseDown={() => handlePress(controlKey, true)}
    onMouseUp={() => handlePress(controlKey, false)}
    onMouseLeave={() => handlePress(controlKey, false)}
    onTouchStart={() => handlePress(controlKey, true)}
    onTouchEnd={() => handlePress(controlKey, false)}
    variant={isActive ? 'default' : 'secondary'}
    className={className}
    {...props}
  >
    {children}
  </Button>
);

const ToggleButton = ({ 
  controlKey, 
  children, 
  className,
  handleToggle,
  isActive,
  ...props
}: { 
  controlKey: keyof ManualControlsState, 
  children: React.ReactNode, 
  className?: string,
  handleToggle: (key: keyof ManualControlsState) => void,
  isActive: boolean,
  [x: string]: any;
}) => (
  <Button 
    onClick={() => handleToggle(controlKey)}
    variant={isActive ? 'default' : 'secondary'}
    className={className}
    {...props}
  >
    {children}
  </Button>
);

export default function TombolManualPage() {
    const [labels, setLabels] = useState<Record<string, string>>({});
    const [activeControls, setActiveControls] = useState<ManualControlsState>({
        pasir1: false, pasir2: false, batu1: false, batu2: false,
        airTimbang: false, airBuang: false,
        selectedSilo: 'silo1',
        semenTimbang: false,
        semen: false,
        pintuBuka: false, pintuTutup: false, 
        konveyorBawah: false, 
        konveyorAtas: false, 
        klakson: false
    });

    useEffect(() => {
        try {
            const storedMappingsRaw = localStorage.getItem(RELAY_MAPPINGS_KEY);
            if (storedMappingsRaw) {
                const storedMappings: ControlMapping[] = JSON.parse(storedMappingsRaw);
                const newLabels = storedMappings.reduce((acc, curr) => {
                    acc[curr.id] = curr.label;
                    return acc;
                }, {} as Record<string, string>);
                setLabels(newLabels);
            }
        } catch (error) {
            console.error("Failed to load control labels:", error);
        }
    }, []);

    const handleToggle = (key: keyof ManualControlsState) => {
        setActiveControls(prev => {
            if (typeof prev[key] === 'boolean') {
                return { ...prev, [key]: !prev[key] };
            }
            return prev;
        });
    };

    const handlePress = (key: keyof ManualControlsState, isPressed: boolean) => {
        setActiveControls(prev => {
            if (prev[key] !== isPressed) {
                return { ...prev, [key]: isPressed };
            }
            return prev;
        });
    };

    const handleSiloChange = (silo: string) => {
        setActiveControls(prev => ({ ...prev, selectedSilo: silo }));
    };

    const getLabel = (key: keyof ManualControlsState, defaultLabel: string) => {
        return labels[key] || defaultLabel;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Tombol Manual</CardTitle>
                        <CardDescription>
                           Gunakan tombol ini untuk mengoperasikan setiap bagian secara manual.
                        </CardDescription>
                    </div>
                     <Button asChild variant="outline">
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke Dashboard
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <ControlGroup title="Aggregate Halus">
                        <MomentaryButton controlKey="pasir1" handlePress={handlePress} isActive={activeControls.pasir1}>{getLabel('pasir1', 'Pasir Galunggung')}</MomentaryButton>
                        <MomentaryButton controlKey="pasir2" handlePress={handlePress} isActive={activeControls.pasir2}>{getLabel('pasir2', 'Pasir Kampar')}</MomentaryButton>
                    </ControlGroup>

                    <ControlGroup title="Aggregate Kasar">
                        <MomentaryButton controlKey="batu1" handlePress={handlePress} isActive={activeControls.batu1}>{getLabel('batu1', 'Batu Merak')}</MomentaryButton>
                        <MomentaryButton controlKey="batu2" handlePress={handlePress} isActive={activeControls.batu2}>{getLabel('batu2', 'Batu Cikande')}</MomentaryButton>
                    </ControlGroup>
                    
                    <ControlGroup title="Air">
                        <ToggleButton controlKey="airTimbang" handleToggle={handleToggle} isActive={activeControls.airTimbang}>{getLabel('airTimbang', 'AIR TIMBANG')}</ToggleButton>
                        <ToggleButton controlKey="airBuang" handleToggle={handleToggle} isActive={activeControls.airBuang} className={cn("font-bold", activeControls.airBuang && "bg-accent hover:bg-accent/90 text-accent-foreground")}>{getLabel('airBuang', 'AIR BUANG')}</ToggleButton>
                    </ControlGroup>

                    <ControlGroup title="Semen">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground px-1">PILIH SILO</Label>
                            <Select onValueChange={handleSiloChange} defaultValue={activeControls.selectedSilo}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih silo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="silo1">Silo 1</SelectItem>
                                    <SelectItem value="silo2">Silo 2</SelectItem>
                                    <SelectItem value="silo3">Silo 3</SelectItem>
                                    <SelectItem value="silo4">Silo 4</SelectItem>
                                    <SelectItem value="silo5">Silo 5</SelectItem>
                                    <SelectItem value="silo6">Silo 6</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <ToggleButton controlKey="semenTimbang" handleToggle={handleToggle} isActive={activeControls.semenTimbang}>
                            {getLabel('semenTimbang', 'TIMBANG SEMEN')}
                        </ToggleButton>
                        <ToggleButton controlKey="semen" handleToggle={handleToggle} isActive={activeControls.semen} className={cn("font-bold", activeControls.semen && "bg-accent hover:bg-accent/90 text-accent-foreground")}>
                            {getLabel('semen', 'BUANG SEMEN')}
                        </ToggleButton>
                    </ControlGroup>

                    <div className="grid grid-rows-3 gap-4">
                        <ControlGroup title="Mixer" className="row-span-1">
                            <div className="grid grid-cols-2 gap-2">
                                <MomentaryButton 
                                controlKey="pintuBuka"
                                handlePress={handlePress}
                                isActive={activeControls.pintuBuka}
                                className={cn("text-white font-bold text-xs", activeControls.pintuBuka ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700')}
                                >
                                {getLabel('pintuBuka', 'PINTU BUKA')}
                                </MomentaryButton>
                                <MomentaryButton 
                                controlKey="pintuTutup"
                                handlePress={handlePress}
                                isActive={activeControls.pintuTutup}
                                className={cn("text-white font-bold text-xs", activeControls.pintuTutup ? 'bg-red-700' : 'bg-red-600 hover:bg-red-700')}
                                >
                                {getLabel('pintuTutup', 'PINTU TUTUP')}
                                </MomentaryButton>
                            </div>
                        </ControlGroup>
                        <ControlGroup title="Konveyor" className="row-span-1">
                            <ToggleButton controlKey="konveyorBawah" handleToggle={handleToggle} isActive={activeControls.konveyorBawah} className={cn("font-bold text-xs", activeControls.konveyorBawah && "bg-accent hover:bg-accent/90 text-accent-foreground")}>{getLabel('konveyorBawah', 'KONVEYOR BAWAH')}</ToggleButton>
                            <ToggleButton controlKey="konveyorAtas" handleToggle={handleToggle} isActive={activeControls.konveyorAtas} className={cn("font-bold text-xs", activeControls.konveyorAtas && "bg-accent hover:bg-accent/90 text-accent-foreground")}>{getLabel('konveyorAtas', 'KONVEYOR ATAS')}</ToggleButton>
                        </ControlGroup>
                        <ControlGroup title="System" className="row-span-1">
                            <MomentaryButton controlKey="klakson" handlePress={handlePress} isActive={activeControls.klakson} className={cn("font-bold text-xs", activeControls.klakson ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/90 text-accent-foreground")}>{getLabel('klakson', 'KLAKSON')}</MomentaryButton>
                        </ControlGroup>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
