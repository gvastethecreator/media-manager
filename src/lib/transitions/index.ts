/**
 * @file Exportaciones del sistema de transiciones
 * @module lib/transitions
 * @description Sistema completo de transiciones para React
 */

// ============================================================================
// Motores Core
// ============================================================================

export {
	combineDirections,
	DirectionTracker,
	destroyDirectionTracker,
	getDirectionTracker,
	getOppositeDirection,
	isDiagonalDirection,
	predictPosition,
} from './core/direction-tracker';
export {
	destroyEnterExitCoordinator,
	EnterExitCoordinator,
	getEnterExitCoordinator,
} from './core/enter-exit-coordinator';
export {
	calculateOptimalDirection,
	destroyFlipEngine,
	distanceToViewportCenter,
	FlipEngine,
	getFlipEngine,
	isElementInViewport,
} from './core/flip-engine';
export {
	createContractToPoint,
	createExpandFromPoint,
	createLiquidMorph,
	destroyMorphEngine,
	generateBorderRadius,
	generateClipPath,
	getMorphEngine,
	MorphEngine,
} from './core/morph-engine';

// ============================================================================
// Animaciones
// ============================================================================

export {
	contextualEasings,
	customEasings,
	getDurationByDistance,
	getEasingByMovement,
	getOptimalVelocityCurve,
	springConfigs,
	springToCubicBezier,
	velocityCurves,
} from './animations/easings';

export {
	allPresets,
	applyPreset,
	compositePresets,
	enterPresets,
	exitPresets,
	getAnimationConfig,
	getDirectionalEnterPreset,
	getDirectionalExitPreset,
	statePresets,
} from './animations/presets';

// ============================================================================
// Tipos
// ============================================================================

export type {
	AnimationSequence,
	AnimationState,
	AnimationStep,
	EnterConfig,
	EnterExitConfig,
	EntryExitType,
	ExitConfig,
	FlipContainerProps,
	FlipElementConfig,
	FlipOptions,
	FlipState,
	MorphConfig,
	MorphElementProps,
	MorphProperty,
	MorphState,
	PerformanceMetrics,
	PerformanceOptions,
	Point2D,
	SharedElementConfig,
	SharedElementState,
	TransformAxis,
	TransformedRect,
	TransitionDirection,
	TransitionEvent,
	TransitionGroupConfig,
	TransitionGroupProps,
	TransitionsContextValue,
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
