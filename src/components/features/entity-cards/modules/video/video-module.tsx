'use client';

import type { VideoModuleProps } from './types';
import { useVideoSystem } from './use-video-system';
import { VideoPanel } from './video-panel';

/**
 * Módulo de video para entidades de tarjetas
 * @param props - Propiedades del módulo
 * @returns Componente React
 */
export function VideoModule({
  initialOptions,
  onChange,
  disabled,
  className,
}: VideoModuleProps) {
  // Sistema de video
  const {
    options,
    updateOption,
    updateDesignSystemOption,
    updateEffectOption,
    updatePerformanceOption,
    resetOptions
  } = useVideoSystem(
    initialOptions,
    onChange
  );

  // Renderizar panel de video
  return (
    <VideoPanel
      videoOptions={options}
      handleVideoChange={updateOption}
      handleDesignSystemChange={updateDesignSystemOption}
      handleEffectsChange={updateEffectOption}
      handlePerformanceChange={updatePerformanceOption}
      resetOptions={resetOptions}
      disabled={disabled}
      className={className}
    />
  );
}