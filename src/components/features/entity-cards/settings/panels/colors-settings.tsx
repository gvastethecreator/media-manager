'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { type ColorPalette, ColorPaletteSelector, DEFAULT_COLOR_PALETTES } from '../../modules/colors';
import type { CardOptions } from '../../types/card-settings-types';

interface ColorsSettingsProps {
  options: CardOptions;
  onChange: (options: CardOptions) => void;
  disabled?: boolean;
}

export function ColorsSettings({ options, onChange, disabled = false }: ColorsSettingsProps) {
  // Manejar cambio de paleta de colores
  const handleColorPaletteChange = (palette: ColorPalette) => {
    onChange({
      ...options,
      colorPalette: palette.id,
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor,
      accentColor: palette.accentColor,
      backgroundStartColor: palette.backgroundStart,
      backgroundEndColor: palette.backgroundEnd,
      textColor: palette.textColor,
      borderColor: palette.borderColor,
    });
  };

  // Manejar cambio en el uso de paletas de colores
  const handleUseColorPalettes = (enabled: boolean) => {
    onChange({
      ...options,
      useColorPalettes: enabled,
    });
  };

  // Encontrar la paleta seleccionada actualmente
  const selectedPaletteId = options.colorPalette || 'modern-blue';

  return (
    <Card className="border-none">
      <CardHeader className="px-4 py-2.5">
        <CardTitle className="text-base">Colores y Paletas</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-0 space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="use-color-palettes" className="text-sm">
            Usar paletas de colores
          </Label>
          <Switch
            id="use-color-palettes"
            checked={options.useColorPalettes}
            onCheckedChange={handleUseColorPalettes}
            disabled={disabled}
          />
        </div>

        <Separator className="my-2" />

        {options.useColorPalettes && (
          <ColorPaletteSelector
            selectedPaletteId={selectedPaletteId}
            onSelectPalette={handleColorPaletteChange}
            allowCustom={true}
          />
        )}

        {!options.useColorPalettes && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="primary-color" className="text-xs">
                  Color primario
                </Label>
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full border"
                    style={{ backgroundColor: `rgb(${options.primaryColor || '59, 130, 246'})` }}
                  />
                  <input
                    id="primary-color"
                    type="text"
                    value={options.primaryColor || '59, 130, 246'}
                    onChange={(e) => onChange({ ...options, primaryColor: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="secondary-color" className="text-xs">
                  Color secundario
                </Label>
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full border"
                    style={{ backgroundColor: `rgb(${options.secondaryColor || '37, 99, 235'})` }}
                  />
                  <input
                    id="secondary-color"
                    type="text"
                    value={options.secondaryColor || '37, 99, 235'}
                    onChange={(e) => onChange({ ...options, secondaryColor: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}