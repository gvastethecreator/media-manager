'use client';

import { useState, useCallback, useEffect } from 'react';
import { CoreOptions, DEFAULT_CORE_OPTIONS } from '../types';
import merge from 'lodash/merge';

/**
 * 🪝 Hook para gestionar la configuración del núcleo
 *
 * Proporciona funcionalidades para gestionar todas las opciones
 * fundamentales del sistema de tarjetas.
 *
 * @param initialOptions - Opciones iniciales para el core
 * @returns Objeto con estado y funciones para manipular la configuración del core
 */
export function useCoreSettings(initialOptions?: Partial<CoreOptions>) {
  // Combinar opciones predeterminadas con las proporcionadas
  const [coreOptions, setCoreOptions] = useState<CoreOptions>(
    merge({}, DEFAULT_CORE_OPTIONS, initialOptions || {})
  );

  // Actualizar opciones cuando cambian las iniciales
  useEffect(() => {
    if (initialOptions) {
      setCoreOptions(prev => merge({}, prev, initialOptions));
    }
  }, [initialOptions]);

  /**
   * Actualiza una propiedad específica de las opciones del core
   */
  const updateCoreOption = useCallback(<K extends keyof CoreOptions>(
    key: K,
    value: CoreOptions[K]
  ) => {
    setCoreOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Actualiza propiedades anidadas del sistema de capas
   */
  const updateLayerSystem = useCallback((
    key: string,
    value: unknown
  ) => {
    setCoreOptions(prev => {
      const updatedLayerSystem = {
        ...prev.layerSystem,
        [key]: value,
      };

      return {
        ...prev,
        layerSystem: updatedLayerSystem
      };
    });
  }, []);

  /**
   * Actualiza múltiples propiedades a la vez
   */
  const updateCoreOptions = useCallback((newOptions: Partial<CoreOptions>) => {
    setCoreOptions(prev => merge({}, prev, newOptions));
  }, []);

  /**
   * Resetea todas las opciones a sus valores predeterminados
   */
  const resetCoreOptions = useCallback(() => {
    setCoreOptions(DEFAULT_CORE_OPTIONS);
  }, []);

  return {
    coreOptions,
    updateCoreOption,
    updateLayerSystem,
    updateCoreOptions,
    resetCoreOptions
  };
}