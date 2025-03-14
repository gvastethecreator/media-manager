'use client';

import { useCallback, useMemo, useState } from 'react';
import type { PerformanceOptions } from './types';
import { DEFAULT_PERFORMANCE_OPTIONS, cacheStrategyOptions, loadingStrategyOptions, performanceModeOptions } from './types';

/**
 * Props para el hook usePerformance
 */
export interface UsePerformanceProps {
  initialOptions?: Partial<PerformanceOptions>;
  onChange?: (options: PerformanceOptions) => void;
  disabled?: boolean;
}

/**
 * Hook para gestionar opciones de rendimiento
 * @param props - Propiedades del hook
 * @returns Objeto con las opciones y métodos para manipularlas
 */
export function usePerformance(props: UsePerformanceProps = {}) {
  const {
    initialOptions = {},
    onChange,
    disabled = false
  } = props;

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<string>('imageLoading');

  // Combinamos las opciones iniciales con las predeterminadas usando useMemo
  const options = useMemo((): PerformanceOptions => ({
    ...DEFAULT_PERFORMANCE_OPTIONS,
    ...initialOptions
  }), [initialOptions]);

  /**
   * Actualiza una propiedad específica
   * @param key - Clave de la propiedad a actualizar
   * @param value - Nuevo valor
   */
  const updateOption = useCallback((key: keyof PerformanceOptions, value: unknown) => {
    const updatedOptions = {
      ...options,
      [key]: value
    };

    onChange?.(updatedOptions);
  }, [options, onChange]);

  /**
   * Restablece todas las opciones a los valores predeterminados
   */
  const resetToDefaults = useCallback(() => {
    onChange?.(DEFAULT_PERFORMANCE_OPTIONS);
  }, [onChange]);

  return {
    // Estado
    options,
    activeTab,

    // Selectores
    cacheStrategyOptions,
    loadingStrategyOptions,
    performanceModeOptions,

    // Métodos para manipular el estado
    setActiveTab,
    updateOption,
    resetToDefaults,

    // Propiedades adicionales
    disabled
  };
}