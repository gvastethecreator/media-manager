/**
 * @file Exportaciones del sistema de transiciones
 * @module lib/transitions
 * @description Sistema completo de transiciones para React
 */

// ============================================================================
// Motores Core
// ============================================================================

export {
  FlipEngine,
  getFlipEngine,
  destroyFlipEngine,
  calculateOptimalDirection,
  isElementInViewport,
  distanceToViewportCenter,
} from './core/flip-engine';

export {
  MorphEngine,
  getMorphEngine,
  destroyMorphEngine,
  generateClipPath,
  generateBorderRadius,
  createLiquidMorph,
  createExpandFromPoint,
  createContractToPoint,
} from './core/morph-engine';

export {
  DirectionTracker,
  getDirectionTracker,
  destroyDirectionTracker,
  isDiagonalDirection,
  getOppositeDirection,
  combineDirections,
  predictPosition,
} from './core/direction-tracker';

export {
  EnterExitCoordinator,
  getEnterExitCoordinator,
  destroyEnterExitCoordinator,
} from './core/enter-exit-coordinator';

// ============================================================================
// Animaciones
// ============================================================================

export {
  customEasings,
  contextualEasings,
  springConfigs,
  springToCubicBezier,
  getDurationByDistance,
  getEasingByMovement,
  velocityCurves,
  getOptimalVelocityCurve,
} from './animations/easings';

export {
  enterPresets,
  exitPresets,
  statePresets,
  compositePresets,
  allPresets,
  getDirectionalEnterPreset,
  getDirectionalExitPreset,
  applyPreset,
  getAnimeConfig,
} from './animations/presets';

// ============================================================================
// Tipos
// ============================================================================

export type {
  TransitionDirection,
  TransformAxis,
  EntryExitType,
  FlipState,
  FlipOptions,
  FlipElementConfig,
  MorphConfig,
  MorphProperty,
  MorphState,
  EnterConfig,
  ExitConfig,
  EnterExitConfig,
  SharedElementConfig,
  SharedElementState,
  TransitionGroupConfig,
  AnimationSequence,
  AnimationStep,
  PerformanceOptions,
  PerformanceMetrics,
  FlipContainerProps,
  MorphElementProps,
  TransitionGroupProps,
  TransitionsContextValue,
  Point2D,
  TransformedRect,
  AnimationState,
  TransitionEvent,
} from './types';

// ============================================================================
// Configuración por Defecto
// ============================================================================

/** Duración por defecto para transiciones */
export const DEFAULT_DURATION = 400;

/** Easing por defecto */
export const DEFAULT_EASING = 'easeOutExpo';

/** Delay de stagger por defecto */
export const DEFAULT_STAGGER_DELAY = 50;

/** Distancia de desplazamiento por defecto */
export const DEFAULT_DISTANCE = 30;

// ============================================================================
// Utilidades
// ============================================================================

/**
 * Verifica si el navegador soporta las APIs necesarias
 */
export function checkBrowserSupport(): {
  flip: boolean;
  morph: boolean;
  webAnimations: boolean;
  clipPath: boolean;
} {
  return {
    flip: typeof window !== 'undefined' && 'getBoundingClientRect' in document.documentElement,
    morph: typeof window !== 'undefined',
    webAnimations: typeof document !== 'undefined' && 'animate' in document.documentElement,
    clipPath: typeof document !== 'undefined' && CSS.supports('clip-path', 'inset(0)'),
  };
}

/**
 * Verifica si se debe reducir el movimiento
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Obtiene duración ajustada según preferencias
 */
export function getAdjustedDuration(preferredDuration: number): number {
  if (shouldReduceMotion()) {
    return Math.min(preferredDuration, 150);
  }
  return preferredDuration;
}

// ============================================================================
// Debug
// ============================================================================

let debugEnabled = false;

export function enableTransitionsDebug(): void {
  debugEnabled = true;
  console.log('[Transitions] Debug enabled');
}

export function disableTransitionsDebug(): void {
  debugEnabled = false;
  console.log('[Transitions] Debug disabled');
}

export function logTransition(message: string, data?: unknown): void {
  if (debugEnabled) {
    console.log(`[Transitions] ${message}`, data);
  }
}
