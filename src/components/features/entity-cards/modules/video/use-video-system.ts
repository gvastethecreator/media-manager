'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_VIDEO_OPTIONS, type VideoOptions } from './types';

/**
 * Hook para gestionar el sistema de video
 * @param initialOptions - Opciones iniciales de video
 * @param onChange - Callback que se ejecuta cuando cambian las opciones
 * @returns Un objeto con las opciones actuales y funciones para manipularlas
 */
export function useVideoSystem(
  initialOptions?: Partial<VideoOptions>,
  onChange?: (options: VideoOptions) => void
) {
  // Estado para las opciones de video
  const [options, setOptions] = useState<VideoOptions>({
    ...DEFAULT_VIDEO_OPTIONS,
    ...initialOptions,
  });

  // Efecto para notificar cambios en las opciones
  useEffect(() => {
    onChange?.(options);
  }, [options, onChange]);

  // Función para actualizar una opción específica
  const updateOption = useCallback((key: keyof VideoOptions, value: unknown) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Función para actualizar opciones del sistema de diseño
  const updateDesignSystemOption = useCallback((key: string, value: unknown) => {
    setOptions((prev) => ({
      ...prev,
      designSystem: {
        ...prev.designSystem,
        [key]: value,
      },
    }));
  }, []);

  // Función para actualizar opciones de efectos
  const updateEffectOption = useCallback((section: string, key: string, value: unknown) => {
    setOptions((prev) => ({
      ...prev,
      effects: {
        ...prev.effects,
        [section]: {
          ...prev.effects?.[section as keyof typeof prev.effects],
          [key]: value,
        },
      },
    }));
  }, []);

  // Función para actualizar opciones de rendimiento
  const updatePerformanceOption = useCallback((key: string, value: unknown) => {
    setOptions((prev) => ({
      ...prev,
      performance: {
        ...prev.performance,
        [key]: value,
      },
    }));
  }, []);

  // Función para resetear todas las opciones a los valores predeterminados
  const resetOptions = useCallback(() => {
    setOptions(DEFAULT_VIDEO_OPTIONS);
  }, []);

  return {
    options,
    updateOption,
    updateDesignSystemOption,
    updateEffectOption,
    updatePerformanceOption,
    resetOptions,
  };
}