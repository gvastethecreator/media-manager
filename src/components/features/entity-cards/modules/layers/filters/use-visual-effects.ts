'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_VISUAL_EFFECTS, type VisualEffectsOptions } from './visual-effects-module';

export interface UseVisualEffectsProps {
  initialEffects?: Partial<VisualEffectsOptions>;
}

export interface UseVisualEffectsResult {
  effects: VisualEffectsOptions;
  updateEffect: <K extends keyof VisualEffectsOptions>(key: K, value: VisualEffectsOptions[K]) => void;
  updateEffects: (effects: Partial<VisualEffectsOptions>) => void;
  resetEffects: () => void;
  hasActiveEffects: () => boolean;
  generateCssFilters: (isHovering?: boolean) => string;
  generateBackdropCssFilters: (isHovering?: boolean) => string;
}

/**
 * Hook personalizado para gestionar efectos visuales
 * @param props - Configuración inicial
 * @returns Funciones y estado para gestionar efectos visuales
 */
export function useVisualEffects(props?: UseVisualEffectsProps): UseVisualEffectsResult {
  // 🏗️ Estado inicial con valores por defecto
  const [effects, setEffects] = useState<VisualEffectsOptions>({
    ...DEFAULT_VISUAL_EFFECTS,
    ...props?.initialEffects
  });

  /**
   * Actualiza una propiedad específica del efecto
   * @param key - Clave de la propiedad a actualizar
   * @param value - Nuevo valor para la propiedad
   */
  const updateEffect = useCallback(<K extends keyof VisualEffectsOptions>(
    key: K,
    value: VisualEffectsOptions[K]
  ) => {
    setEffects(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Actualiza múltiples propiedades de efectos a la vez
   * @param newEffects - Objeto parcial con las propiedades a actualizar
   */
  const updateEffects = useCallback((newEffects: Partial<VisualEffectsOptions>) => {
    setEffects(prev => ({
      ...prev,
      ...newEffects
    }));
  }, []);

  /**
   * Restablece todos los efectos a sus valores por defecto
   */
  const resetEffects = useCallback(() => {
    setEffects(DEFAULT_VISUAL_EFFECTS);
  }, []);

  /**
   * Verifica si hay algún efecto activo (diferente del valor predeterminado)
   * @returns true si al menos un efecto está activo
   */
  const hasActiveEffects = useCallback(() => {
    const {
      brightness, contrast, saturate, hueRotate,
      grayscale, sepia, invert, opacity,
      blur, dropShadow,
      backdropBlur, backdropBrightness, backdropSaturate, backdropOpacity
    } = effects;

    return (
      brightness !== 100 ||
      contrast !== 100 ||
      saturate !== 100 ||
      hueRotate !== 0 ||
      grayscale !== 0 ||
      sepia !== 0 ||
      invert !== 0 ||
      opacity !== 100 ||
      blur !== 0 ||
      dropShadow === true ||
      backdropBlur !== 0 ||
      backdropBrightness !== 100 ||
      backdropSaturate !== 100 ||
      backdropOpacity !== 100
    );
  }, [effects]);

  /**
   * Genera los filtros CSS para aplicar a un elemento
   * @param isHovering - Indica si el elemento está en estado hover
   * @returns String con las propiedades CSS de filtro
   */
  const generateCssFilters = useCallback((isHovering?: boolean): string => {
    const {
      brightness, contrast, saturate, hueRotate,
      grayscale, sepia, invert, opacity,
      blur, dropShadow
    } = effects;

    // Si no hay efectos activos, devuelve una cadena vacía
    if (!hasActiveEffects()) return '';

    // 🎭 Construir la cadena de filtros CSS
    const filters = [];

    if (brightness !== 100) filters.push(`brightness(${brightness / 100})`);
    if (contrast !== 100) filters.push(`contrast(${contrast / 100})`);
    if (saturate !== 100) filters.push(`saturate(${saturate / 100})`);
    if (hueRotate !== 0) filters.push(`hue-rotate(${hueRotate}deg)`);
    if (grayscale !== 0) filters.push(`grayscale(${grayscale / 100})`);
    if (sepia !== 0) filters.push(`sepia(${sepia / 100})`);
    if (invert !== 0) filters.push(`invert(${invert / 100})`);
    if (opacity !== 100) filters.push(`opacity(${opacity / 100})`);
    if (blur !== 0) filters.push(`blur(${blur}px)`);
    if (dropShadow) filters.push(`drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25))`);

    return filters.join(' ');
  }, [effects, hasActiveEffects]);

  /**
   * Genera los filtros CSS para fondos (backdrop-filter)
   * @param isHovering - Indica si el elemento está en estado hover
   * @returns String con las propiedades CSS de backdrop-filter
   */
  const generateBackdropCssFilters = useCallback((isHovering?: boolean): string => {
    const {
      backdropBlur, backdropBrightness, backdropSaturate, backdropOpacity
    } = effects;

    // Si no hay efectos de fondo activos, devuelve una cadena vacía
    if (
      backdropBlur === 0 &&
      backdropBrightness === 100 &&
      backdropSaturate === 100 &&
      backdropOpacity === 100
    ) {
      return '';
    }

    // 🎭 Construir la cadena de filtros de fondo CSS
    const filters = [];

    if (backdropBlur !== 0) filters.push(`blur(${backdropBlur}px)`);
    if (backdropBrightness !== 100) filters.push(`brightness(${backdropBrightness / 100})`);
    if (backdropSaturate !== 100) filters.push(`saturate(${backdropSaturate / 100})`);
    if (backdropOpacity !== 100) filters.push(`opacity(${backdropOpacity / 100})`);

    return filters.join(' ');
  }, [effects]);

  return {
    effects,
    updateEffect,
    updateEffects,
    resetEffects,
    hasActiveEffects,
    generateCssFilters,
    generateBackdropCssFilters
  };
}