/**
 * @file Presets de Animación
 * @module lib/transitions/animations/presets
 * @description Configuraciones predefinidas para transiciones comunes
 *
 * Cada preset define:
 * - Transformaciones iniciales y finales
 * - Easing y duración
 * - Propiedades a animar
 * - Optimizaciones específicas
 */

import type { AnimeParams } from '@/lib/anime';
import type { TransitionDirection } from '../types';
import { contextualEasings, customEasings } from './easings';

// ============================================================================
// Configuración Base
// ============================================================================

interface AnimationPreset {
	name: string;
	description: string;
	params: Partial<AnimeParams>;
	initialStyles?: Partial<CSSStyleDeclaration>;
	finalStyles?: Partial<CSSStyleDeclaration>;
	useWillChange?: string[];
	useGPU?: boolean;
}

// ============================================================================
// Presets de Entrada
// ============================================================================

export const enterPresets: Record<string, AnimationPreset> = {
	/** Entrada suave desde cualquier dirección */
	slideIn: {
		name: 'slideIn',
		description: 'Entrada deslizante suave',
		params: {
			duration: 400,
			easing: customEasings.easeOutSuper,
		},
		initialStyles: {
			opacity: '0',
			transform: 'translateY(20px)',
		},
		finalStyles: {
			opacity: '1',
			transform: 'translateY(0)',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},

	/** Entrada con efecto de escala */
	scaleIn: {
		name: 'scaleIn',
		description: 'Entrada con crecimiento desde el centro',
		params: {
			duration: 350,
			easing: customEasings.scaleOrganic,
		},
		initialStyles: {
			opacity: '0',
			transform: 'scale(0.8)',
		},
		finalStyles: {
			opacity: '1',
			transform: 'scale(1)',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},

	/** Entrada con blur */
	blurIn: {
		name: 'blurIn',
		description: 'Entrada con desenfoque que se enfoca',
		params: {
			duration: 450,
			easing: customEasings.quickSlow,
		},
		initialStyles: {
			opacity: '0',
			filter: 'blur(10px)',
			transform: 'scale(1.05)',
		},
		finalStyles: {
			opacity: '1',
			filter: 'blur(0px)',
			transform: 'scale(1)',
		},
		useWillChange: ['transform', 'opacity', 'filter'],
		useGPU: true,
	},

	/** Entrada con clip-path */
	clipIn: {
		name: 'clipIn',
		description: 'Entrada revelando con clip-path',
		params: {
			duration: 500,
			easing: customEasings.expoOut,
		},
		initialStyles: {
			clipPath: 'inset(100% 0 0 0)',
		},
		finalStyles: {
			clipPath: 'inset(0% 0 0 0)',
		},
		useWillChange: ['clip-path'],
		useGPU: true,
	},

	/** Entrada elástica */
	elasticIn: {
		name: 'elasticIn',
		description: 'Entrada con rebote elástico',
		params: {
			duration: 600,
			easing: customEasings.elasticSubtle,
		},
		initialStyles: {
			opacity: '0',
			transform: 'scale(0.5)',
		},
		finalStyles: {
			opacity: '1',
			transform: 'scale(1)',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},

	/** Entrada desde lejos (zoom in) */
	zoomIn: {
		name: 'zoomIn',
		description: 'Entrada con zoom desde lejos',
		params: {
			duration: 500,
			easing: customEasings.easeOutSuper,
		},
		initialStyles: {
			opacity: '0',
			transform: 'scale(1.5) translateZ(-200px)',
		},
		finalStyles: {
			opacity: '1',
			transform: 'scale(1) translateZ(0)',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},

	/** Entrada 3D flip */
	flipIn: {
		name: 'flipIn',
		description: 'Entrada con volteo 3D',
		params: {
			duration: 500,
			easing: customEasings.easeOutSuper,
		},
		initialStyles: {
			opacity: '0',
			transform: 'perspective(1000px) rotateX(-90deg)',
			transformOrigin: 'top center',
		},
		finalStyles: {
			opacity: '1',
			transform: 'perspective(1000px) rotateX(0deg)',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},

	/** Entrada por caracter (para texto) */
	typewriter: {
		name: 'typewriter',
		description: 'Entrada letra por letra',
		params: {
			duration: 50,
			easing: 'linear',
			delay: (el: HTMLElement, i: number) => i * 30,
		},
		initialStyles: {
			opacity: '0',
		},
		finalStyles: {
			opacity: '1',
		},
		useWillChange: ['opacity'],
		useGPU: false,
	},
};

// ============================================================================
// Presets de Salida
// ============================================================================

export const exitPresets: Record<string, AnimationPreset> = {
	/** Salida suave */
	slideOut: {
		name: 'slideOut',
		description: 'Salida deslizante hacia abajo',
		params: {
			duration: 300,
			easing: customEasings.easeInSuper,
		},
		initialStyles: {
			opacity: '1',
			transform: 'translateY(0)',
		},
		finalStyles: {
			opacity: '0',
			transform: 'translateY(-20px)',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},

	/** Salida con escala */
	scaleOut: {
		name: 'scaleOut',
		description: 'Salida con reducción de escala',
		params: {
			duration: 250,
			easing: customEasings.expoOut,
		},
		initialStyles: {
			opacity: '1',
			transform: 'scale(1)',
		},
		finalStyles: {
			opacity: '0',
			transform: 'scale(0.9)',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},

	/** Salida con blur */
	blurOut: {
		name: 'blurOut',
		description: 'Salida desenfocándose',
		params: {
			duration: 350,
			easing: customEasings.easeInSuper,
		},
		initialStyles: {
			opacity: '1',
			filter: 'blur(0px)',
			transform: 'scale(1)',
		},
		finalStyles: {
			opacity: '0',
			filter: 'blur(10px)',
			transform: 'scale(0.95)',
		},
		useWillChange: ['transform', 'opacity', 'filter'],
		useGPU: true,
	},

	/** Salida con clip-path */
	clipOut: {
		name: 'clipOut',
		description: 'Salida ocultando con clip-path',
		params: {
			duration: 400,
			easing: customEasings.expoIn,
		},
		initialStyles: {
			clipPath: 'inset(0% 0 0 0)',
		},
		finalStyles: {
			clipPath: 'inset(0 0 100% 0)',
		},
		useWillChange: ['clip-path'],
		useGPU: true,
	},

	/** Salida hacia lejos */
	zoomOut: {
		name: 'zoomOut',
		description: 'Salida con zoom hacia lejos',
		params: {
			duration: 400,
			easing: customEasings.expoOut,
		},
		initialStyles: {
			opacity: '1',
			transform: 'scale(1) translateZ(0)',
		},
		finalStyles: {
			opacity: '0',
			transform: 'scale(0.5) translateZ(-200px)',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},

	/** Colapso hacia un punto */
	collapseToPoint: {
		name: 'collapseToPoint',
		description: 'Colapso hacia el centro',
		params: {
			duration: 350,
			easing: customEasings.expoOut,
		},
		initialStyles: {
			opacity: '1',
			transform: 'scale(1)',
		},
		finalStyles: {
			opacity: '0',
			transform: 'scale(0)',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},

	/** Salida 3D flip */
	flipOut: {
		name: 'flipOut',
		description: 'Salida con volteo 3D',
		params: {
			duration: 400,
			easing: customEasings.expoOut,
		},
		initialStyles: {
			opacity: '1',
			transform: 'perspective(1000px) rotateX(0deg)',
		},
		finalStyles: {
			opacity: '0',
			transform: 'perspective(1000px) rotateX(90deg)',
			transformOrigin: 'bottom center',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},
};

// ============================================================================
// Presets de Estados
// ============================================================================

export const statePresets: Record<string, AnimationPreset> = {
	/** Hover sutil */
	hover: {
		name: 'hover',
		description: 'Efecto hover sutil',
		params: {
			duration: 200,
			easing: customEasings.magnetic,
		},
		initialStyles: {
			transform: 'translateY(0) scale(1)',
		},
		finalStyles: {
			transform: 'translateY(-2px) scale(1.02)',
		},
		useWillChange: ['transform'],
		useGPU: true,
	},

	/** Press/Active */
	press: {
		name: 'press',
		description: 'Efecto de presión',
		params: {
			duration: 100,
			easing: customEasings.snap,
		},
		initialStyles: {
			transform: 'scale(1)',
		},
		finalStyles: {
			transform: 'scale(0.97)',
		},
		useWillChange: ['transform'],
		useGPU: true,
	},

	/** Selección */
	select: {
		name: 'select',
		description: 'Efecto de selección',
		params: {
			duration: 200,
			easing: customEasings.elasticSubtle,
		},
		initialStyles: {
			transform: 'scale(1)',
			boxShadow: '0 0 0 0 rgba(var(--primary), 0)',
		},
		finalStyles: {
			transform: 'scale(1.02)',
			boxShadow: '0 0 0 3px rgba(var(--primary), 0.3)',
		},
		useWillChange: ['transform', 'box-shadow'],
		useGPU: true,
	},

	/** Loading/Pulse */
	pulse: {
		name: 'pulse',
		description: 'Efecto de pulso/pulsación',
		params: {
			duration: 1500,
			easing: customEasings.breathe,
			loop: true,
			direction: 'alternate',
		},
		initialStyles: {
			transform: 'scale(1)',
			opacity: '1',
		},
		finalStyles: {
			transform: 'scale(1.05)',
			opacity: '0.8',
		},
		useWillChange: ['transform', 'opacity'],
		useGPU: true,
	},

	/** Shake/Error */
	shake: {
		name: 'shake',
		description: 'Efecto de sacudida para errores',
		params: {
			duration: 500,
			easing: customEasings.snap,
		},
		initialStyles: {
			transform: 'translateX(0)',
		},
		finalStyles: {
			transform: 'translateX(0)',
		},
		useWillChange: ['transform'],
		useGPU: true,
	},

	/** Success/Bounce */
	success: {
		name: 'success',
		description: 'Efecto de éxito con rebote',
		params: {
			duration: 600,
			easing: customEasings.elasticMedium,
		},
		initialStyles: {
			transform: 'scale(1)',
		},
		finalStyles: {
			transform: 'scale(1.1)',
		},
		useWillChange: ['transform'],
		useGPU: true,
	},
};

// ============================================================================
// Presets de Transiciones Compuestas
// ============================================================================

export const compositePresets = {
	/** Tarjeta que se expande */
	cardExpand: {
		name: 'cardExpand',
		description: 'Expansión de tarjeta a vista detalle',
		stages: [
			{ preset: enterPresets.scaleIn, duration: 0.3 },
			{ preset: enterPresets.blurIn, duration: 0.4, delay: 0.1 },
		],
	},

	/** Modal que aparece */
	modalAppear: {
		name: 'modalAppear',
		description: 'Aparición de modal con backdrop',
		backdrop: enterPresets.fadeIn,
		content: enterPresets.scaleIn,
	},

	/** Navegación entre páginas */
	pageTransition: {
		name: 'pageTransition',
		description: 'Transición entre páginas',
		exit: exitPresets.slideOut,
		enter: enterPresets.slideIn,
		overlap: 0.1,
	},

	/** Lista que se reordena */
	listReorder: {
		name: 'listReorder',
		description: 'Reordenamiento de lista',
		easing: contextualEasings.list.reorder,
		stagger: 30,
		maxStagger: 300,
	},
};

// ============================================================================
// Presets por Dirección
// ============================================================================

/**
 * Genera presets de entrada según dirección
 */
export function getDirectionalEnterPreset(direction: TransitionDirection, distance = 50): AnimationPreset {
	const base = enterPresets.slideIn;

	const transforms: Record<TransitionDirection, string> = {
		top: `translateY(-${distance}px)`,
		bottom: `translateY(${distance}px)`,
		left: `translateX(-${distance}px)`,
		right: `translateX(${distance}px)`,
		'top-left': `translate(-${distance * 0.7}px, -${distance * 0.7}px)`,
		'top-right': `translate(${distance * 0.7}px, -${distance * 0.7}px)`,
		'bottom-left': `translate(-${distance * 0.7}px, ${distance * 0.7}px)`,
		'bottom-right': `translate(${distance * 0.7}px, ${distance * 0.7}px)`,
		center: 'scale(0.8)',
		auto: `translateY(${distance}px)`,
	};

	return {
		...base,
		name: `slideIn-${direction}`,
		initialStyles: {
			...base.initialStyles,
			transform: transforms[direction],
		},
	};
}

/**
 * Genera presets de salida según dirección
 */
export function getDirectionalExitPreset(direction: TransitionDirection, distance = 50): AnimationPreset {
	const base = exitPresets.slideOut;

	const transforms: Record<TransitionDirection, string> = {
		top: `translateY(-${distance}px)`,
		bottom: `translateY(${distance}px)`,
		left: `translateX(-${distance}px)`,
		right: `translateX(${distance}px)`,
		'top-left': `translate(-${distance * 0.7}px, -${distance * 0.7}px)`,
		'top-right': `translate(${distance * 0.7}px, -${distance * 0.7}px)`,
		'bottom-left': `translate(-${distance * 0.7}px, ${distance * 0.7}px)`,
		'bottom-right': `translate(${distance * 0.7}px, ${distance * 0.7}px)`,
		center: 'scale(0.8)',
		auto: `translateY(${distance}px)`,
	};

	return {
		...base,
		name: `slideOut-${direction}`,
		finalStyles: {
			...base.finalStyles,
			transform: transforms[direction],
		},
	};
}

// ============================================================================
// Funciones de Aplicación
// ============================================================================

/**
 * Aplica un preset a un elemento
 */
export function applyPreset(element: HTMLElement, preset: AnimationPreset, reverse = false): void {
	// Aplicar estilos iniciales
	const initialStyles = reverse ? preset.finalStyles : preset.initialStyles;
	if (initialStyles) {
		Object.assign(element.style, initialStyles);
	}

	// Aplicar will-change
	if (preset.useWillChange) {
		element.style.willChange = preset.useWillChange.join(', ');
	}

	// Forzar reflow
	// biome-ignore lint/complexity/noVoid: reflow pattern
	void element.offsetHeight;
}

/**
 * Obtiene configuración de anime.js desde un preset
 */
export function getAnimeConfig(preset: AnimationPreset, overrides: Partial<AnimeParams> = {}): Partial<AnimeParams> {
	return {
		...preset.params,
		...overrides,
	};
}

// ============================================================================
// Exportaciones
// ============================================================================

export const allPresets = {
	enter: enterPresets,
	exit: exitPresets,
	state: statePresets,
	composite: compositePresets,
};

export default allPresets;
