'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DEFAULT_RARITIES, RaritySelector, RaritySystem } from '../../modules/rarities';
import type { CardOptions } from '../../types/card-settings-types';

interface RaritiesSettingsProps {
  options: CardOptions;
  onChange: (options: CardOptions) => void;
  entityType?: string;
  entityId?: string;
  disabled?: boolean;
}

export function RaritiesSettings({
  options,
  onChange,
  entityType = 'generic',
  entityId,
  disabled = false
}: RaritiesSettingsProps) {
  // Manejar cambio en el uso del sistema de rareza
  const handleUseRaritySystem = (enabled: boolean) => {
    onChange({
      ...options,
      raritySystem: enabled,
    });
  };

  // Manejar cambio en la distribución de rareza
  const handleRarityDistributionChange = (distribution: Record<string, number>) => {
    onChange({
      ...options,
      rarityDistribution: distribution,
    });
  };

  // Manejar selección de rareza predeterminada
  const handleDefaultRarityChange = (rarityId: string) => {
    onChange({
      ...options,
      defaultRarity: rarityId,
    });
  };

  return (
    <Card className="border-none">
      <CardHeader className="px-4 py-2.5">
        <CardTitle className="text-base">Sistema de Rareza</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-0 space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="use-rarity-system" className="text-sm">
            Habilitar sistema de rareza
          </Label>
          <Switch
            id="use-rarity-system"
            checked={options.raritySystem}
            onCheckedChange={handleUseRaritySystem}
            disabled={disabled}
          />
        </div>

        {options.raritySystem && (
          <>
            <Separator className="my-2" />

            <Tabs defaultValue="distribution" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="distribution" className="text-xs">Distribución</TabsTrigger>
                <TabsTrigger value="default" className="text-xs">Rareza por defecto</TabsTrigger>
              </TabsList>

              <TabsContent value="distribution" className="mt-2 space-y-4">
                <RaritySystem
                  entityType={entityType}
                  entityId={entityId}
                  initialDistribution={options.rarityDistribution}
                  onChange={handleRarityDistributionChange}
                  enabled={options.raritySystem}
                />
              </TabsContent>

              <TabsContent value="default" className="mt-2">
                <div className="space-y-2">
                  <Label className="text-xs">Rareza predeterminada</Label>
                  <RaritySelector
                    rarities={DEFAULT_RARITIES}
                    selectedRarityId={options.defaultRarity}
                    onSelectRarity={(rarity) => handleDefaultRarityChange(rarity.id)}
                    showChance={true}
                    showLevel={true}
                    size="sm"
                    displayType="list"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}