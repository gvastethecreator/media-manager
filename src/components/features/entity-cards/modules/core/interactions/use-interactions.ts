'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_INTERACTION_OPTIONS, type InteractionOptions } from './interaction-module';

export interface UseInteractionsProps {
  initialOptions?: Partial<InteractionOptions>;
}

export interface UseInteractionsResult {
  options: InteractionOptions;
  updateOption: <K extends keyof InteractionOptions>(key: K, value: InteractionOptions[K]) => void;
  updateOptions: (options: Partial<InteractionOptions>) => void;
  resetOptions: () => void;
  isEnabled: () => boolean;
  isHoverEnabled: () => boolean;
  isClickEnabled: () => boolean;
  isTouchEnabled: () => boolean;
  isDraggable: () => boolean;
  isSelectable: () => boolean;
  getClickAction: () => string;
  getHoverAction: () => string;
  getTouchBehavior: () => string;
}

/**
 * Hook personalizado para gestionar interacciones
 * @param props - Configuración inicial
 * @returns Funciones y estado para gestionar interacciones
 */
export function useInteractions(props?: UseInteractionsProps): UseInteractionsResult {
  // 🏗️ Estado inicial con valores por defecto
  const [options, setOptions] = useState<InteractionOptions>({
    ...DEFAULT_INTERACTION_OPTIONS,
    ...props?.initialOptions
  });

  /**
   * Actualiza una opción específica de interacción
   * @param key - Clave de la opción a actualizar
   * @param value - Nuevo valor para la opción
   */
  const updateOption = useCallback(<K extends keyof InteractionOptions>(
    key: K,
    value: InteractionOptions[K]
  ) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Actualiza múltiples opciones de interacción a la vez
   * @param newOptions - Objeto parcial con las opciones a actualizar
   */
  const updateOptions = useCallback((newOptions: Partial<InteractionOptions>) => {
    setOptions(prev => ({
      ...prev,
      ...newOptions
    }));
  }, []);

  /**
   * Restablece todas las opciones a sus valores por defecto
   */
  const resetOptions = useCallback(() => {
    setOptions(DEFAULT_INTERACTION_OPTIONS);
  }, []);

  /**
   * Verifica si las interacciones están habilitadas globalmente
   * @returns true si las interacciones están habilitadas
   */
  const isEnabled = useCallback(() => {
    return options.enabled === true;
  }, [options.enabled]);

  /**
   * Verifica si las interacciones de hover están habilitadas
   * @returns true si el hover está habilitado
   */
  const isHoverEnabled = useCallback(() => {
    return options.enabled === true && options.hoverEnabled === true;
  }, [options.enabled, options.hoverEnabled]);

  /**
   * Verifica si las interacciones de clic están habilitadas
   * @returns true si el clic está habilitado
   */
  const isClickEnabled = useCallback(() => {
    return options.enabled === true && options.clickEnabled === true;
  }, [options.enabled, options.clickEnabled]);

  /**
   * Verifica si las interacciones táctiles están habilitadas
   * @returns true si las interacciones táctiles están habilitadas
   */
  const isTouchEnabled = useCallback(() => {
    return options.enabled === true && options.touchEnabled === true;
  }, [options.enabled, options.touchEnabled]);

  /**
   * Verifica si el arrastre está habilitado
   * @returns true si el arrastre está habilitado
   */
  const isDraggable = useCallback(() => {
    return options.enabled === true && options.draggable === true;
  }, [options.enabled, options.draggable]);

  /**
   * Verifica si la selección está habilitada
   * @returns true si la selección está habilitada
   */
  const isSelectable = useCallback(() => {
    return options.enabled === true && options.selectable === true;
  }, [options.enabled, options.selectable]);

  /**
   * Obtiene la acción de clic configurada
   * @returns Tipo de acción para el clic
   */
  const getClickAction = useCallback(() => {
    if (!isClickEnabled()) return 'none';
    return options.clickAction || DEFAULT_INTERACTION_OPTIONS.clickAction || 'none';
  }, [options.clickAction, isClickEnabled]);

  /**
   * Obtiene la acción de hover configurada
   * @returns Tipo de acción para el hover
   */
  const getHoverAction = useCallback(() => {
    if (!isHoverEnabled()) return 'none';
    return options.hoverAction || DEFAULT_INTERACTION_OPTIONS.hoverAction || 'none';
  }, [options.hoverAction, isHoverEnabled]);

  /**
   * Obtiene el comportamiento táctil configurado
   * @returns Tipo de comportamiento táctil
   */
  const getTouchBehavior = useCallback(() => {
    if (!isTouchEnabled()) return 'tap';
    return options.touchBehavior || DEFAULT_INTERACTION_OPTIONS.touchBehavior || 'tap';
  }, [options.touchBehavior, isTouchEnabled]);

  return {
    options,
    updateOption,
    updateOptions,
    resetOptions,
    isEnabled,
    isHoverEnabled,
    isClickEnabled,
    isTouchEnabled,
    isDraggable,
    isSelectable,
    getClickAction,
    getHoverAction,
    getTouchBehavior
  };
}