'use client';

import { useState, useEffect } from 'react';
import { LayersModuleConfig, LayersModuleProps, DEFAULT_LAYERS_CONFIG } from './types';
import { LayersPanel } from './layers-panel';
import { LayersProvider, adaptLayersConfigToCardOptions } from './use-layers';
import { deepMerge } from '@/lib/utils';

/**
 * 🌈 Módulo de capas para Entity Cards
 *
 * Este módulo permite gestionar las capas visuales que componen una tarjeta de entidad,
 * incluyendo su orden, visibilidad y configuraciones específicas.
 */
export function LayersModule({
  initialConfig = {},
  onChange,
  cardOptions,
  onCardOptionsChange
}: LayersModuleProps) {
  const [config, setConfig] = useState<LayersModuleConfig>(() =>
    deepMerge(DEFAULT_LAYERS_CONFIG, initialConfig) as LayersModuleConfig
  );

  // Actualizar la configuración cuando cambian las props
  useEffect(() => {
    setConfig(prevConfig =>
      deepMerge(prevConfig, initialConfig) as LayersModuleConfig
    );
  }, [initialConfig]);

  // Manejar cambios en la configuración
  const handleConfigChange = (newConfig: LayersModuleConfig) => {
    setConfig(newConfig);
    onChange?.(newConfig);

    // Si tenemos un manejador de cambios para cardOptions, actualizamos las opciones de la tarjeta
    if (onCardOptionsChange) {
      const updatedCardOptions = adaptLayersConfigToCardOptions(newConfig);
      onCardOptionsChange(updatedCardOptions);
    }
  };

  return (
    <LayersProvider initialConfig={config}>
      <div className="space-y-4">
        <LayersPanel
          config={config}
          onChange={handleConfigChange}
          cardOptions={cardOptions}
          onCardOptionsChange={onCardOptionsChange}
        />
      </div>
    </LayersProvider>
  );
}