'use client';

import { Scale } from 'lucide-react';
import type { CardOptions } from '../../../types/card-settings-types';
import {
  EffectSection,
  type BaseEffectOptions,
  useSyncedEffects,
  EffectStatus,
} from '../shared';
import {
  BorderEffectsSection,
  DistortionEffectsSection,
  HolographicEffectsSection,
  ScanEffectsSection,
  TextureEffectsSection,
} from './components/sections';

interface AdvancedEffectsProps {
  options: CardOptions;
  onChange: (options: CardOptions) => void;
  disabled?: boolean;
}

/**
 * 🎨 Panel de Efectos Avanzados
 */
export function AdvancedEffectsPanel({ options, onChange, disabled = false }: AdvancedEffectsProps) {
  const { effects, updateEffectConfig } = useSyncedEffects(
    options.advancedEffects ?? {},
    (newEffects) => {
      onChange({
        ...options,
        advancedEffects: newEffects,
      });
    }
  );

  const isEnabled = Object.values(effects).some((effect) => effect.enabled);

  return (
    <EffectSection
      title="Efectos Avanzados"
      description="Configura efectos visuales avanzados para las tarjetas"
      icon={<Scale className="h-4 w-4" />}
      colorScheme="advanced"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">Estado</span>
        <EffectStatus enabled={isEnabled} />
      </div>

      <div className="space-y-6">
        <HolographicEffectsSection
          effect={effects.holographic as BaseEffectOptions}
          onChange={(value) => updateEffectConfig('holographic', value)}
          disabled={disabled}
        />
        <ScanEffectsSection
          effect={effects.scan as BaseEffectOptions}
          onChange={(value) => updateEffectConfig('scan', value)}
          disabled={disabled}
        />
        <TextureEffectsSection
          effect={effects.texture as BaseEffectOptions}
          onChange={(value) => updateEffectConfig('texture', value)}
          disabled={disabled}
        />
        <BorderEffectsSection
          effect={effects.border as BaseEffectOptions}
          onChange={(value) => updateEffectConfig('border', value)}
          disabled={disabled}
        />
        <DistortionEffectsSection
          effect={effects.distortion as BaseEffectOptions}
          onChange={(value) => updateEffectConfig('distortion', value)}
          disabled={disabled}
        />
      </div>
    </EffectSection>
  );
}
