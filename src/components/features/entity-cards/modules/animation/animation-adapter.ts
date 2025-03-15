'use client';

import type { AnimationSystem } from './types';

/**
 * Tipo para las opciones de animación del sistema antiguo
 */
interface LegacyAnimationOptions {
	enabled: boolean;
	duration: number;
	easing: string;
	delay: number;

	// Opciones de hover
	hoverEffect: string;
	hoverScale: number;
	hoverRotation: number;

	// Opciones de clic
	clickEffect: string;
	clickScale: number;
	clickTransform: string;

	// Opciones de intro
	introAnimation: boolean;
	introDuration: number;
	introEffect: string;

	// Opciones de parallax
	parallaxEffect: boolean;
	parallaxIntensity: number;
}

/**
 * Tipo para las opciones de cartas del sistema antiguo
 */
interface LegacyCardOptions {
	animation?: LegacyAnimationOptions;
	[key: string]: unknown;
}

/**
 * Convierte las opciones de animación del sistema antiguo al nuevo sistema
 */
export function legacyToAnimationSystem(legacyOptions: LegacyCardOptions): AnimationSystem {
	const animation = (legacyOptions.animation || {}) as Partial<LegacyAnimationOptions>;

	return {
		// Configuración general
		enabled: animation.enabled ?? true,
		reducedMotion: false,
		transitionDuration: animation.duration ? animation.duration * 1000 : 300, // Convertir segundos a ms
		timingFunction: mapEasing(animation.easing || 'ease-in-out'),

		// Animaciones de entrada/salida
		entranceAnimation: mapIntroEffect(animation.introEffect || 'fade-in'),
		exitAnimation: 'fade-out',
		entranceDelay: animation.delay ? animation.delay * 1000 : 0, // Convertir segundos a ms
		loopAnimations: false,

		// Efectos de hover
		hoverEffect: animation.hoverEffect !== 'none',
		hoverScale: animation.hoverScale || 1.05,
		hoverRotate: animation.hoverRotation ? animation.hoverRotation > 0 : false,
		hoverLift: animation.hoverEffect === 'lift' || animation.hoverEffect === 'scale-and-lift',
		liftHeight: 5,
		maxRotation: animation.hoverRotation || 5,

		// Efectos de click
		clickEffect: animation.clickEffect !== 'none',
		activeScale: animation.clickScale || 0.95,
		activeBrightness: 1.05,
	};
}

/**
 * Convierte el sistema de animación a las opciones de animación antiguas
 */
export function animationSystemToLegacy(animationSystem: AnimationSystem): LegacyAnimationOptions {
	return {
		enabled: animationSystem.enabled,
		duration: animationSystem.transitionDuration / 1000, // Convertir ms a segundos
		easing: mapTimingFunction(animationSystem.timingFunction),
		delay: animationSystem.entranceDelay / 1000, // Convertir ms a segundos

		// Opciones de hover
		hoverEffect: animationSystem.hoverEffect ? (animationSystem.hoverLift ? 'scale-and-lift' : 'scale') : 'none',
		hoverScale: animationSystem.hoverScale,
		hoverRotation: animationSystem.hoverRotate ? animationSystem.maxRotation : 0,

		// Opciones de clic
		clickEffect: animationSystem.clickEffect ? 'pulse' : 'none',
		clickScale: animationSystem.activeScale,
		clickTransform: animationSystem.activeScale < 1 ? 'scale-down' : 'scale-up',

		// Opciones de intro
		introAnimation: animationSystem.entranceAnimation !== 'none',
		introDuration: animationSystem.transitionDuration / 1000, // Convertir ms a segundos
		introEffect: mapEntranceAnimation(animationSystem.entranceAnimation),

		// Opciones de parallax
		parallaxEffect: animationSystem.hoverRotate,
		parallaxIntensity: 0.2, // Valor predeterminado ya que no hay equivalencia directa
	};
}

/**
 * Mapea la función de timing antigua a la nueva
 */
function mapTimingFunction(timingFunction: string): string {
	const map: Record<string, string> = {
		ease: 'ease',
		'ease-in': 'ease-in',
		'ease-out': 'ease-out',
		'ease-in-out': 'ease-in-out',
		linear: 'linear',
	};

	return map[timingFunction] || 'ease-in-out';
}

/**
 * Mapea la función de easing antigua a la nueva
 */
function mapEasing(easing: string): string {
	const map: Record<string, string> = {
		ease: 'ease',
		'ease-in': 'ease-in',
		'ease-out': 'ease-out',
		'ease-in-out': 'ease-in-out',
		linear: 'linear',
		'cubic-bezier': 'cubic-bezier(0.4, 0, 0.2, 1)',
	};

	return map[easing] || 'ease-in-out';
}

/**
 * Mapea el efecto de intro antiguo al nuevo
 */
function mapIntroEffect(introEffect: string): string {
	const map: Record<string, string> = {
		'fade-in': 'fade-in',
		'slide-up': 'slide-up',
		'slide-down': 'slide-down',
		'zoom-in': 'zoom-in',
		bounce: 'bounce',
		none: 'none',
	};

	return map[introEffect] || 'fade-in';
}

/**
 * Mapea la animación de entrada nueva a la antigua
 */
function mapEntranceAnimation(entranceAnimation: string): string {
	const map: Record<string, string> = {
		'fade-in': 'fade-in',
		'slide-up': 'slide-up',
		'slide-down': 'slide-down',
		'zoom-in': 'zoom-in',
		bounce: 'bounce',
		none: 'none',
	};

	return map[entranceAnimation] || 'fade-in';
}
