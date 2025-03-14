'use client';

import { FolderPanel } from './folder-panel';
import type { FolderModuleProps } from './types';
import { useFolderSystem } from './use-folder-system';

/**
 * Módulo de carpeta para entidades de tarjetas
 * @param props - Propiedades del módulo
 * @returns Componente React
 */
export function FolderModule({
  initialOptions,
  onChange,
  disabled,
  className,
}: FolderModuleProps) {
  // Sistema de carpeta
  const {
    options,
    updateCoreFolderConfig,
    updateCoreLayerSystem,
    updateCorePerformance,
    updateCoreEffects,
    updateCoreConfig,
    resetOptions
  } = useFolderSystem(
    initialOptions,
    onChange
  );

  // Renderizar panel de carpeta
  return (
    <FolderPanel
      options={options}
      updateCoreFolderConfig={updateCoreFolderConfig}
      updateCoreLayerSystem={updateCoreLayerSystem}
      updateCorePerformance={updateCorePerformance}
      updateCoreEffects={updateCoreEffects}
      updateCoreConfig={updateCoreConfig}
      resetOptions={resetOptions}
      disabled={disabled}
      className={className}
    />
  );
}