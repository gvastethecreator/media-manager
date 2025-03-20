'use client';

import { useEffect, useState } from 'react';
import { effectsStore, EFFECT_MODULES } from '../../store/effects-store';
import { EffectsPanel } from './effects-panel';
import type { EffectsConfig } from './types';
import { DEFAULT_EFFECTS_CONFIG } from './types';
import { deepMerge } from '@/lib/utils';
import { adaptCardOptionsToEffectsConfig, adaptEffectsConfigToCardOptions } from './effects-utils';
import type { CardOptions } from '../../types/unified-types';

interface EffectsModuleProps {
  initialConfig?: Partial<EffectsConfig>;
  onChange?: (config: EffectsConfig) => void;
  cardOptions?: Partial<CardOptions>;
  onCardOptionsChange?: (options: Partial<CardOptions>) => void;
  children?: React.ReactNode | ((props: { config: EffectsConfig; onChange: (config: EffectsConfig) => void }) => React.ReactNode);
}

/**
 * Módulo para gestionar los efectos visuales y avanzados
 * 
 * Este módulo está optimizado para trabajar con el almacén centralizado
 * de efectos y proporciona una API unificada para modificar la configuración.
 */
export function EffectsModule({
  initialConfig = {},
  onChange,
  cardOptions,
  onCardOptionsChange,
  children,
}: EffectsModuleProps) {
  // Inicializar configuración
  const [config, setConfig] = useState<EffectsConfig>(() => {
    const defaultConfig = JSON.parse(JSON.stringify(DEFAULT_EFFECTS_CONFIG)) as EffectsConfig;
    return deepMerge<Record<string, unknown>>(
      defaultConfig as Record<string, unknown>, 
      initialConfig as Record<string, unknown>
    ) as EffectsConfig;
  });

  // Sincronizar con el store al montar el componente
  useEffect(() => {
    // Activar los módulos necesarios
    effectsStore.enableModule(EFFECT_MODULES.VISUAL);
    effectsStore.enableModule(EFFECT_MODULES.ADVANCED);
    
    // Actualizar configuración en el store
    effectsStore.updateEffects(config);

    // Suscripción a cambios en el store
    const unsubscribe = effectsStore.subscribe(() => {
      // Solo actualizamos el estado local si es necesario para evitar re-renders innecesarios
      const storeEffects = effectsStore.getEffects();
      if (JSON.stringify(storeEffects) !== JSON.stringify(config)) {
        setConfig(prevConfig => ({
          ...prevConfig,
          ...storeEffects
        }));
      }
    });

    // Limpieza al desmontar
    return () => {
      unsubscribe();
    };
  }, []);

  // Actualizar la store cuando cambia el config interno
  useEffect(() => {
    effectsStore.updateEffects(config);
  }, [config]);

  // Actualizar la configuración cuando cambian las props
  useEffect(() => {
    setConfig((prevConfig) => {
      // Crear una copia para evitar mutaciones
      const currentConfig = JSON.parse(JSON.stringify(prevConfig)) as EffectsConfig;
      // Fusionar con las nuevas opciones
      return deepMerge<Record<string, unknown>>(
        currentConfig as Record<string, unknown>, 
        initialConfig as Record<string, unknown>
      ) as EffectsConfig;
    });
  }, [initialConfig]);

  // Gestionar cambios en la configuración
  const handleConfigChange = (newConfig: EffectsConfig) => {
    setConfig(newConfig);
    
    // Actualizar en el store
    effectsStore.updateEffects(newConfig);
    
    // Notificar cambios hacia arriba si es necesario
    if (onChange) {
      onChange(newConfig);
    }

    // Si tenemos un manejador de cambios para cardOptions, actualizamos las opciones de la tarjeta
    if (onCardOptionsChange) {
      const updatedCardOptions = adaptEffectsConfigToCardOptions(newConfig);
      onCardOptionsChange(updatedCardOptions);
    }
  };

  // Si hay hijos personalizados, renderizarlos con la configuración
  if (children) {
    return (
      <div className="effects-module">
        {typeof children === 'function'
          ? (children as (props: { config: EffectsConfig; onChange: (config: EffectsConfig) => void }) => React.ReactNode)({ config, onChange: handleConfigChange })
          : children}
      </div>
    );
  }

  // De lo contrario, mostrar el panel de efectos predeterminado
  return (
    <div className="space-y-4">
      <EffectsPanel
        config={config}
        onChange={handleConfigChange}
        cardOptions={cardOptions}
        onCardOptionsChange={onCardOptionsChange}
      />
    </div>
  );
}
