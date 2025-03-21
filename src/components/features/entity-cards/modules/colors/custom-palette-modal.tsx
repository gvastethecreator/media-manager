'use client';

import { FormInput } from '@/components/features/entity-cards/settingsold/panels/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import type { ColorPalette } from './types';

interface CustomPaletteModalProps {
  onClose: () => void;
  onSave: (palette: ColorPalette) => void;
  initialPalette?: Partial<ColorPalette>;
}

/**
 * Modal para crear o editar paletas de colores personalizadas
 */
export function CustomPaletteModal({ onClose, onSave, initialPalette }: CustomPaletteModalProps) {
  const [palette, setPalette] = useState<Partial<ColorPalette>>({
    id: initialPalette?.id || `custom-${nanoid(6)}`,
    name: initialPalette?.name || 'Mi Paleta Personalizada',
    primaryColor: initialPalette?.primaryColor || '59, 130, 246',
    secondaryColor: initialPalette?.secondaryColor || '37, 99, 235',
    accentColor: initialPalette?.accentColor || '245, 158, 11',
    backgroundStart: initialPalette?.backgroundStart || '249, 250, 251',
    backgroundEnd: initialPalette?.backgroundEnd || '243, 244, 246',
    textColor: initialPalette?.textColor || '31, 41, 55',
    borderColor: initialPalette?.borderColor || '209, 213, 219',
    description: initialPalette?.description || 'Paleta de colores personalizada',
  });

  const updatePalette = (key: keyof ColorPalette, value: string) => {
    setPalette((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Asegurarse de que todos los campos requeridos estén presentes
    if (
      !palette.id ||
      !palette.name ||
      !palette.primaryColor ||
      !palette.secondaryColor ||
      !palette.accentColor ||
      !palette.backgroundStart ||
      !palette.backgroundEnd ||
      !palette.textColor ||
      !palette.borderColor
    ) {
      // Mostrar error o completar campos faltantes
      return;
    }

    onSave(palette as ColorPalette);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear paleta personalizada</DialogTitle>
          <DialogDescription>
            Define los colores para tu paleta personalizada. Todos los colores deben estar en formato RGB (ej: 59, 130, 246).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <FormInput
            id="palette-name"
            label="Nombre de la paleta"
            value={palette.name || ''}
            onChange={(value) => updatePalette('name', value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="primary-color"
              label="Color primario"
              value={palette.primaryColor || ''}
              onChange={(value) => updatePalette('primaryColor', value)}
              icon={
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: `rgb(${palette.primaryColor})` }}
                />
              }
            />
            <FormInput
              id="secondary-color"
              label="Color secundario"
              value={palette.secondaryColor || ''}
              onChange={(value) => updatePalette('secondaryColor', value)}
              icon={
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: `rgb(${palette.secondaryColor})` }}
                />
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="accent-color"
              label="Color de acento"
              value={palette.accentColor || ''}
              onChange={(value) => updatePalette('accentColor', value)}
              icon={
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: `rgb(${palette.accentColor})` }}
                />
              }
            />
            <FormInput
              id="text-color"
              label="Color de texto"
              value={palette.textColor || ''}
              onChange={(value) => updatePalette('textColor', value)}
              icon={
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: `rgb(${palette.textColor})` }}
                />
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="background-start"
              label="Fondo (inicio)"
              value={palette.backgroundStart || ''}
              onChange={(value) => updatePalette('backgroundStart', value)}
              icon={
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: `rgb(${palette.backgroundStart})` }}
                />
              }
            />
            <FormInput
              id="background-end"
              label="Fondo (fin)"
              value={palette.backgroundEnd || ''}
              onChange={(value) => updatePalette('backgroundEnd', value)}
              icon={
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: `rgb(${palette.backgroundEnd})` }}
                />
              }
            />
          </div>

          <FormInput
            id="border-color"
            label="Color de borde"
            value={palette.borderColor || ''}
            onChange={(value) => updatePalette('borderColor', value)}
            icon={
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: `rgb(${palette.borderColor})` }}
              />
            }
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar paleta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
