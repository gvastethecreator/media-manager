'use client';

import { Badge } from '@/components/ui/badge';
import { Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormLayout, FormSection, panelColors } from '../../../settings/panels/shared';
import type { CardOptions } from '../../../types/card-settings-types';
import {
  BorderEffectsSection,
  DistortionEffectsSection,
  HolographicEffectsSection,
  ScanEffectsSection,
  TextureEffectsSection
} from './components/sections';
import { useAdvancedEffects } from './hooks/use-advanced-effects';
import type { AdvancedEffectsOptions } from './types';

/**
 * 🪄 Panel de Efectos Avanzados
 *
 * Permite configurar efectos visuales avanzados para las tarjetas,
 * incluyendo líneas de escaneo, texturas, efectos de borde, holográficos y distorsión.
 */
export function AdvancedEffectsPanel({
  options,
  onChange,
  disabled = false,
}: {
  options: CardOptions;
  onChange: (options: CardOptions) => void;
  disabled?: boolean;
}) {
  // Estado local para los efectos
  const [effectsEnabled, setEffectsEnabled] = useState(false);

  // Obtenemos el estado local y funciones del hook
  const {
    effects,
    updateEffect,
    updateEffects
  } = useAdvancedEffects(options.advancedEffects);

  // Actualizar estado local cuando cambian las opciones
  useEffect(() => {
    if (options.advancedEffects) {
      updateEffects(options.advancedEffects);
      setEffectsEnabled(true);
    }
  }, [options.advancedEffects, updateEffects]);

  // Manejar cambios en efectos específicos
  const handleEffectsChange = <K extends keyof AdvancedEffectsOptions>(
    key: K,
    value: AdvancedEffectsOptions[K]
  ) => {
    updateEffect(key, value);

    // Actualizar opciones principales
    onChange({
      ...options,
      advancedEffects: {
        ...effects,
        [key]: value
      }
    });
  };

  return (
    <FormLayout>
      <FormSection
        title="Efectos Avanzados"
        description="Configuración de efectos visuales avanzados"
        colorScheme="advanced"
        icon={<Scale className="h-4 w-4 mr-2" />}
        action={effectsEnabled ? <Badge style={{ backgroundColor: panelColors.advanced }}>Activado</Badge> : null}
      >
        <div className="space-y-6">
          {/* Secciones de Efectos */}
          <ScanEffectsSection
            effects={effects}
            onEffectsChange={handleEffectsChange}
            disabled={disabled}
          />

          <TextureEffectsSection
            effects={effects}
            onEffectsChange={handleEffectsChange}
            disabled={disabled}
          />

          <BorderEffectsSection
            effects={effects}
            onEffectsChange={handleEffectsChange}
            disabled={disabled}
          />

          <HolographicEffectsSection
            effects={effects}
            onEffectsChange={handleEffectsChange}
            disabled={disabled}
          />

          <DistortionEffectsSection
            effects={effects}
            onEffectsChange={handleEffectsChange}
            disabled={disabled}
          />
        </div>
      </FormSection>
    </FormLayout>
  );
}