'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { DesignSystem, DesignSystemPreset } from './types';
import { DesignPreview } from './design-preview';
import { DEFAULT_DESIGN_SYSTEM } from './design-module';

interface DesignPresetsProps {
  presets: DesignSystemPreset[];
  onSelectPreset: (preset: DesignSystemPreset) => void;
  onSavePreset: (preset: DesignSystemPreset) => void;
  onDeletePreset: (presetId: string) => void;
  currentDesign: DesignSystem;
}

export function DesignPresets({
  presets,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
  currentDesign
}: DesignPresetsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPreset, setNewPreset] = useState<Partial<DesignSystemPreset>>({
    name: '',
    description: '',
    designSystem: currentDesign
  });

  // Manejar cambios en los campos del formulario
  const handleInputChange = (field: keyof DesignSystemPreset, value: string) => {
    setNewPreset(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Guardar un nuevo preset
  const handleSavePreset = () => {
    if (!newPreset.name) return;

    const presetToSave: DesignSystemPreset = {
      id: `preset-${Date.now()}`,
      name: newPreset.name,
      description: newPreset.description || '',
      designSystem: currentDesign
    };

    onSavePreset(presetToSave);
    setIsDialogOpen(false);
    setNewPreset({
      name: '',
      description: '',
      designSystem: currentDesign
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Presets de Diseño</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Guardar Preset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guardar Preset de Diseño</DialogTitle>
              <DialogDescription>
                Guarda la configuración actual como un preset para usarla más tarde.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="preset-name">Nombre</Label>
                <Input
                  id="preset-name"
                  value={newPreset.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Mi preset de diseño"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preset-description">Descripción</Label>
                <Textarea
                  id="preset-description"
                  value={newPreset.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe este preset..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Vista Previa</Label>
                <DesignPreview designSystem={currentDesign} className="h-40" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSavePreset} disabled={!newPreset.name}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Preset predeterminado */}
          <Card className="overflow-hidden cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-0">
              <div className="p-2 border-b">
                <h4 className="font-medium text-sm">Predeterminado</h4>
                <p className="text-xs text-muted-foreground">Diseño predeterminado del sistema</p>
              </div>
              <div className="p-2">
                <DesignPreview
                  designSystem={DEFAULT_DESIGN_SYSTEM}
                  className="h-32"
                  showPlaceholder
                />
              </div>
              <div className="p-2 bg-muted/50 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectPreset({
                    id: 'default',
                    name: 'Predeterminado',
                    description: 'Diseño predeterminado del sistema',
                    designSystem: DEFAULT_DESIGN_SYSTEM
                  })}
                >
                  Aplicar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Presets guardados */}
          {presets.map((preset) => (
            <Card
              key={preset.id}
              className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
            >
              <CardContent className="p-0">
                <div className="p-2 border-b">
                  <h4 className="font-medium text-sm">{preset.name}</h4>
                  {preset.description && (
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  )}
                </div>
                <div className="p-2">
                  <DesignPreview
                    designSystem={preset.designSystem}
                    className="h-32"
                    showPlaceholder
                  />
                </div>
                <div className="p-2 bg-muted/50 flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeletePreset(preset.id)}
                  >
                    Eliminar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectPreset(preset)}
                  >
                    Aplicar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}