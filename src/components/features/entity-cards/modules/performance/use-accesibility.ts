'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PerformanceOptions } from './types';

/**
 * Configuración para la accesibilidad
 */
export interface AccesibilityConfig {
  // Modo de alto contraste
  highContrastMode: boolean;

  // Etiquetas accesibles
  useAccessibleLabels: boolean;

  // Resaltado de enfoque para navegación por teclado
  keyboardFocusHighlight: boolean;

  // Soporte para lectores de pantalla
  screenReaderFriendly: boolean;

  // Soporte para zoom de texto
  textZoomSupport: boolean;

  // Respetar preferencias del usuario (reducción de movimiento, esquema de colores, etc.)
  respectUserPreferences: boolean;

  // Tamaño mínimo para objetivos táctiles (en píxeles)
  minTouchTargetSize: number;

  // Propiedades ARIA que se deberían aplicar
  ariaProperties: Record<string, string>;
}

/**
 * Props para el hook useAccesibility
 */
export interface UseAccesibilityProps {
  options: PerformanceOptions;
  enabled?: boolean;
}

/**
 * Hook especializado para implementar características de accesibilidad en Entity Cards
 *
 * Este hook proporciona utilidades para:
 * - Implementar modo de alto contraste
 * - Añadir etiquetas accesibles
 * - Mejorar la navegación por teclado
 * - Optimizar para lectores de pantalla
 * - Respetar preferencias del usuario
 * - Garantizar tamaños mínimos para objetivos táctiles
 *
 * @param props - Propiedades para el hook
 * @returns Funciones y valores para mejorar la accesibilidad
 */
export function useAccesibility({ options, enabled = true }: UseAccesibilityProps) {
  // Estados
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean | null>(null);
  const [prefersDarkMode, setPrefersDarkMode] = useState<boolean | null>(null);
  const [prefersHighContrast, setPrefersHighContrast] = useState<boolean | null>(null);

  // Configuración derivada de las opciones
  const config = useMemo<AccesibilityConfig>(
    () => ({
      highContrastMode: enabled && (options.highContrastMode ?? false),
      useAccessibleLabels: enabled && (options.useAccessibleLabels ?? true),
      keyboardFocusHighlight: enabled && (options.keyboardFocusHighlight ?? true),
      screenReaderFriendly: enabled && (options.screenReaderFriendly ?? true),
      textZoomSupport: enabled && (options.textZoomSupport ?? true),
      respectUserPreferences: enabled && (options.respectUserPreferences ?? true),
      minTouchTargetSize: options.minTouchTargetSize ?? 44,
      ariaProperties: {},
    }),
    [
      enabled,
      options.highContrastMode,
      options.useAccessibleLabels,
      options.keyboardFocusHighlight,
      options.screenReaderFriendly,
      options.textZoomSupport,
      options.respectUserPreferences,
      options.minTouchTargetSize,
    ]
  );

  // Detectar preferencias del usuario al montar
  useEffect(() => {
    if (typeof window === 'undefined' || !config.respectUserPreferences) return;

    // Detectar preferencia de reducción de movimiento
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Detectar preferencia de modo oscuro
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDarkMode(darkModeQuery.matches);

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setPrefersDarkMode(e.matches);
    };
    darkModeQuery.addEventListener('change', handleDarkModeChange);

    // Detectar preferencia de alto contraste (Windows)
    const highContrastQuery = window.matchMedia('(forced-colors: active)');
    setPrefersHighContrast(highContrastQuery.matches);

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, [config.respectUserPreferences]);

  /**
   * Determinar si se debe aplicar el modo de alto contraste
   */
  const shouldUseHighContrast = useMemo(() => {
    if (config.highContrastMode) return true;
    if (config.respectUserPreferences && prefersHighContrast) return true;
    return false;
  }, [config.highContrastMode, config.respectUserPreferences, prefersHighContrast]);

  /**
   * Determinar si se debe reducir el movimiento
   */
  const shouldReduceMotion = useMemo(() => {
    if (options.reducedMotion) return true;
    if (config.respectUserPreferences && prefersReducedMotion) return true;
    return false;
  }, [options.reducedMotion, config.respectUserPreferences, prefersReducedMotion]);

  /**
   * Obtener etiquetas de accesibilidad para un elemento
   */
  const getAccessibleLabels = useCallback(
    (elementType: string, data: Record<string, unknown>) => {
      if (!config.useAccessibleLabels) {
        return {};
      }

      const labels: Record<string, string> = {};

      switch (elementType) {
        case 'card':
          labels['aria-label'] = `Tarjeta: ${data.title || 'Sin título'}`;
          labels.role = 'article';
          break;
        case 'button':
          labels['aria-label'] = `${data.label || 'Botón'}`;
          labels.role = 'button';
          break;
        case 'image':
          labels['aria-label'] = data.alt as string || `Imagen: ${data.title || 'Sin descripción'}`;
          labels.role = 'img';
          break;
        case 'modal':
          labels['aria-modal'] = 'true';
          labels.role = 'dialog';
          labels['aria-labelledby'] = data.titleId as string || 'modal-title';
          break;
        default:
          break;
      }

      return labels;
    },
    [config.useAccessibleLabels]
  );

  /**
   * Obtener propiedades para la navegación por teclado
   */
  const getKeyboardProps = useCallback(
    (elementType: string) => {
      if (!config.keyboardFocusHighlight) {
        return {};
      }

      const props: Record<string, unknown> = {
        tabIndex: 0,
      };

      if (elementType === 'card' || elementType === 'button') {
        props.onKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            (e.target as HTMLElement).click();
            e.preventDefault();
          }
        };
      }

      return props;
    },
    [config.keyboardFocusHighlight]
  );

  /**
   * Obtener propiedades CSS para mejorar accesibilidad
   */
  const getAccessibilityStyles = useCallback(() => {
    const styles: Record<string, string> = {};

    // Alto contraste
    if (shouldUseHighContrast) {
      styles['--card-contrast-mode'] = 'high';
      styles['--card-border-width'] = '2px';
      styles['--card-focus-outline-width'] = '3px';
      styles['--card-title-color'] = 'HighlightText';
      styles['--card-body-color'] = 'HighlightText';
      styles['--card-background'] = 'Canvas';
    }

    // Reducción de movimiento
    if (shouldReduceMotion) {
      styles['--hover-transition-duration'] = '0s';
      styles['--card-animation-duration'] = '0s';
      styles['--card-hover-lift'] = '0';
      styles['--card-hover-rotate'] = '0';
    }

    // Tamaños mínimos para objetivos táctiles
    if (config.minTouchTargetSize > 0) {
      styles['--min-touch-target-size'] = `${config.minTouchTargetSize}px`;
    }

    // Soporte para zoom de texto
    if (config.textZoomSupport) {
      styles['--card-title-size'] = 'max(var(--card-base-title-size), 1em)';
      styles['--card-body-size'] = 'max(var(--card-base-body-size), 1em)';
      styles['font-size'] = '100%';
    }

    return styles;
  }, [
    shouldUseHighContrast,
    shouldReduceMotion,
    config.minTouchTargetSize,
    config.textZoomSupport,
  ]);

  /**
   * Aplicar propiedades de accesibilidad a un elemento DOM
   */
  const applyAccessibilityProps = useCallback(
    (
      element: HTMLElement | null,
      elementType: string,
      data: Record<string, unknown> = {}
    ) => {
      if (!element || !config.screenReaderFriendly) return;

      // Obtener etiquetas accesibles
      const ariaLabels = getAccessibleLabels(elementType, data);

      // Aplicar atributos ARIA
      for (const [key, value] of Object.entries(ariaLabels)) {
        element.setAttribute(key, value);
      }

      // Aplicar propiedades CSS
      const styles = getAccessibilityStyles();
      for (const [key, value] of Object.entries(styles)) {
        element.style.setProperty(key, value);
      }

      // Asegurar tamaño mínimo para objetivos táctiles
      if (
        (elementType === 'button' || elementType === 'link' || elementType === 'input') &&
        config.minTouchTargetSize > 0
      ) {
        element.style.minWidth = `${config.minTouchTargetSize}px`;
        element.style.minHeight = `${config.minTouchTargetSize}px`;
      }

      // Añadir clase para resaltado de enfoque si está habilitado
      if (config.keyboardFocusHighlight) {
        element.classList.add('keyboard-focus-highlight');
      }
    },
    [
      config.screenReaderFriendly,
      config.keyboardFocusHighlight,
      config.minTouchTargetSize,
      getAccessibleLabels,
      getAccessibilityStyles,
    ]
  );

  return {
    // Estado y configuración
    config,
    prefersReducedMotion,
    prefersDarkMode,
    prefersHighContrast,

    // Valores derivados
    shouldUseHighContrast,
    shouldReduceMotion,

    // Funciones principales
    getAccessibleLabels,
    getKeyboardProps,
    getAccessibilityStyles,
    applyAccessibilityProps,
  };
}
