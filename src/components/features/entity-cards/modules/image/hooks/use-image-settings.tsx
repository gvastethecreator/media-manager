'use client';

import merge from 'lodash/merge';
import set from 'lodash/set';
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_IMAGE_OPTIONS, type ImageOptions } from '../types';

/**
 * 🪝 Hook para gestionar la configuración de imágenes
 *
 * Proporciona funcionalidades para gestionar todas las opciones
 * relacionadas con la visualización y efectos de imágenes.
 *
 * @param initialOptions - Opciones iniciales de imagen
 * @returns Objeto con estado y funciones para manipular la configuración de imagen
 */
export function useImageSettings(initialOptions?: Partial<ImageOptions>) {
  // Combinar opciones predeterminadas con las proporcionadas
  const [imageOptions, setImageOptions] = useState<ImageOptions>(
    merge({}, DEFAULT_IMAGE_OPTIONS, initialOptions || {})
  );

  // Actualizar opciones cuando cambian las iniciales
  useEffect(() => {
    if (initialOptions) {
      setImageOptions(prev => merge({}, prev, initialOptions));
    }
  }, [initialOptions]);

  /**
   * Actualiza una propiedad específica de las opciones de imagen
   */
  const updateImageOption = useCallback(<K extends keyof ImageOptions>(
    key: K,
    value: ImageOptions[K]
  ) => {
    setImageOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Actualiza una propiedad del subsistema de diseño
   */
  const updateDesignSystem = useCallback((
    key: string,
    value: unknown
  ) => {
    setImageOptions(prev => {
      const newOptions = { ...prev };
      if (!newOptions.designSystem) {
        newOptions.designSystem = {};
      }

      newOptions.designSystem = {
        ...newOptions.designSystem,
        [key]: value
      };

      return newOptions;
    });
  }, []);

  /**
   * Actualiza una propiedad anidada de efectos
   */
  const updateEffect = useCallback((
    section: string,
    key: string,
    value: unknown
  ) => {
    setImageOptions(prev => {
      const newOptions = { ...prev };
      const path = `effects.${section}.${key}`;

      return set({ ...newOptions }, path, value);
    });
  }, []);

  /**
   * Actualiza una propiedad de rendimiento
   */
  const updatePerformance = useCallback((
    key: string,
    value: unknown
  ) => {
    setImageOptions(prev => {
      const newOptions = { ...prev };
      if (!newOptions.performance) {
        newOptions.performance = {};
      }

      newOptions.performance = {
        ...newOptions.performance,
        [key]: value
      };

      return newOptions;
    });
  }, []);

  /**
   * Actualiza múltiples propiedades a la vez
   */
  const updateImageOptions = useCallback((newOptions: Partial<ImageOptions>) => {
    setImageOptions(prev => merge({}, prev, newOptions));
  }, []);

  /**
   * Resetea todas las opciones a sus valores predeterminados
   */
  const resetImageOptions = useCallback(() => {
    setImageOptions(DEFAULT_IMAGE_OPTIONS);
  }, []);

  return {
    imageOptions,
    updateImageOption,
    updateDesignSystem,
    updateEffect,
    updatePerformance,
    updateImageOptions,
    resetImageOptions
  };
}