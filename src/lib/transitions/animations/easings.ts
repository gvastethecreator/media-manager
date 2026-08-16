/**
 * @file Curvas de Easing Personalizadas
 * @module lib/transitions/animations/easings
 * @description Curvas de easing optimizadas para transiciones fluidas y naturales
 *
 * Estas curvas están diseñadas para:
 * - Evitar sensaciones de "roboticidad"
 * - Proporcionar aceleración y desaceleración orgánicas
 * - Optimizar la percepción de velocidad
 * - Mantener coherencia visual
 */

// ============================================================================
// Easings Suaves y Naturales
// ============================================================================

/**
 * Easing personalizados para transiciones de UI
 */
export const customEasings = {
	/**
	 * Salida súper suave - ideal para elementos que se estabilizan
	 */
	easeOutSuper: 'cubicBezier(0.16, 1, 0.3, 1)',

	/**
	 * Entrada súper suave - ideal para elementos que aparecen
	 */
	easeInSuper: 'cubicBezier(0.7, 0, 0.84, 0)',

	/**
	 * Entrada-salida suave - balance perfecto
	 */
	easeInOutSuper: 'cubicBezier(0.87, 0, 0.13, 1)',

	/**
	 * Efecto elástico sutil - para elementos interactivos
	 */
	elasticSubtle: 'cubicBezier(0.68, -0.15, 0.265, 1.15)',

	/**
	 * Efecto elástico medio - para llamadas de atención
	 */
	elasticMedium: 'cubicBezier(0.68, -0.3, 0.265, 1.3)',

	/**
	 * Rebote sutil - para elementos que "aterrizan"
	 */
	bounceSubtle: 'cubicBezier(0.34, 1.56, 0.64, 1)',

	/**
	 * Desaceleración rápida - para transiciones breves
	 */
	quickSlow: 'cubicBezier(0.4, 0, 0.2, 1)',

	/**
	 * Aceleración exponencial - para elementos que se van
	 */
	expoOut: 'cubicBezier(0.19, 1, 0.22, 1)',

	/**
	 * Entrada exponencial - para elementos que llegan
	 */
	expoIn: 'cubicBezier(0.95, 0.05, 0.795, 0.035)',

	/**
	 * Efecto magnético - para elementos que "pegan"
	 */
	magnetic: 'cubicBezier(0.25, 0.46, 0.45, 0.94)',

	/**
	 * Efecto slide suave - para paneles y drawers
	 */
	slideSmooth: 'cubicBezier(0.4, 0, 0, 1)',

	/**
	 * Efecto scale orgánico - para transformaciones de tamaño
	 */
	scaleOrganic: 'cubicBezier(0.34, 1.2, 0.64, 1)',

	/**
	 * Efecto de "respiración" - para pulsaciones sutiles
	 */
	breathe: 'cubicBezier(0.45, 0.05, 0.55, 0.95)',

	/**
	 * Entrada dramática - para elementos importantes
	 */
	dramaticIn: 'cubicBezier(0.6, 0.04, 0.98, 0.335)',

	/**
	 * Salida dramática - para elementos que desaparecen
	 */
	dramaticOut: 'cubicBezier(0.075, 0.82, 0.165, 1)',

	/**
	 * Efecto de snap - para elementos que encajan
	 */
	snap: 'cubicBezier(0.68, -0.55, 0.265, 1.55)',

	/**
	 * Movimiento líquido - para morphing
	 */
	liquid: 'cubicBezier(0.25, 0.1, 0.25, 1)',

	/**
	 * Efecto de gravedad - para elementos que caen
	 */
	gravity: 'cubicBezier(0.333, 0, 0.667, 1)',

	/**
	 * Efecto de levitación - para elementos que suben
	 */
	levitate: 'cubicBezier(0.4, 0, 0.2, 1)',
} as const;

export type CustomEasing = keyof typeof customEasings;

// ============================================================================
// Easings Contextuales
// ============================================================================

/**
 * Easings recomendados según el tipo de transición
 */
export const contextualEasings = {
	/** Para navegación entre páginas/vistas */
	navigation: {
		enter: customEasings.easeOutSuper,
		exit: customEasings.expoOut,
		back: customEasings.slideSmooth,
	},

	/** Para elementos que aparecen/desaparecen */
	element: {
		enter: customEasings.easeOutSuper,
		exit: customEasings.easeInSuper,
		update: customEasings.quickSlow,
	},

	/** Para modales y overlays */
	modal: {
		backdrop: customEasings.quickSlow,
		content: customEasings.easeOutSuper,
		close: customEasings.expoOut,
	},

	/** Para listas y grids */
	list: {
		reorder: customEasings.elasticSubtle,
		add: customEasings.scaleOrganic,
		remove: customEasings.expoOut,
		filter: customEasings.liquid,
	},

	/** Para interacciones táctiles */
	touch: {
		tap: customEasings.snap,
		longPress: customEasings.breathe,
		swipe: customEasings.slideSmooth,
		pinch: customEasings.magnetic,
	},

	/** Para elementos compartidos */
	shared: {
		morph: customEasings.liquid,
		expand: customEasings.easeOutSuper,
		contract: customEasings.expoOut,
	},

	/** Para feedback visual */
	feedback: {
		success: customEasings.elasticMedium,
		error: customEasings.snap,
		warning: customEasings.bounceSubtle,
		info: customEasings.quickSlow,
	},

	/** Para indicadores de progreso */
	progress: {
		indeterminate: customEasings.breathe,
		determinate: customEasings.quickSlow,
		complete: customEasings.elasticSubtle,
	},
} as const;

// ============================================================================
// Funciones de Spring (Físicas)
// ============================================================================

/**
 * Configuraciones de spring físico
 */
export const springConfigs = {
	/** Spring suave - para elementos delicados */
	soft: {
		mass: 1,
		stiffness: 100,
		damping: 15,
		velocity: 0,
	},

	/** Spring medio - balance entre velocidad y rebote */
	medium: {
		mass: 1,
		stiffness: 300,
		damping: 25,
		velocity: 0,
	},

	/** Spring fuerte - para elementos sólidos */
	stiff: {
		mass: 1,
		stiffness: 500,
		damping: 35,
		velocity: 0,
	},

	/** Spring elástico - para efectos de rebote */
	elastic: {
		mass: 1,
		stiffness: 400,
		damping: 10,
		velocity: 0,
	},

	/** Spring lento - para movimientos deliberados */
	slow: {
		mass: 2,
		stiffness: 150,
		damping: 20,
		velocity: 0,
	},

	/** Spring rápido - para micro-interacciones */
	fast: {
		mass: 0.5,
		stiffness: 600,
		damping: 30,
		velocity: 0,
	},

	/** Spring para elementos que aparecen */
	enter: {
		mass: 1,
		stiffness: 250,
		damping: 20,
		velocity: 0,
	},

	/** Spring para elementos que desaparecen */
	exit: {
		mass: 0.8,
		stiffness: 400,
		damping: 40,
		velocity: 0,
	},
} as const;

export type SpringConfig = (typeof springConfigs)[keyof typeof springConfigs];

/**
 * Convierte configuración de spring a cubic-bezier aproximado
 * Esto es útil cuando no se puede usar spring nativo
 */
export function springToCubicBezier(mass: number, stiffness: number, damping: number): string {
	// Aproximación simplificada
	const w0 = Math.sqrt(stiffness / mass);
	const zeta = damping / (2 * Math.sqrt(stiffness * mass));

	if (zeta < 1) {
		// Underdamped - tiene oscilación
		const wd = w0 * Math.sqrt(1 - zeta * zeta);
		const decay = zeta * w0;

		// Calcular puntos de control para aproximar
		const x1 = 0.5;
		const y1 = 1 + Math.exp(-decay * 0.5) * Math.sin(wd * 0.5);
		const x2 = 0.8;
		const y2 = 1 + Math.exp(-decay * 0.8) * Math.sin(wd * 0.8);

		return `cubicBezier(${x1.toFixed(3)}, ${y1.toFixed(3)}, ${x2.toFixed(3)}, ${y2.toFixed(3)})`;
	}

	// Overdamped o critically damped
	return 'cubicBezier(0.4, 0, 0.2, 1)';
}

// ============================================================================
// Utilidades de Easing
// ============================================================================

/**
 * Interpola entre dos easings en un punto dado
 * Útil para transiciones complejas
 */
export function interpolateEasings(easing1: string, easing2: string, progress: number): string {
	// Por simplicidad, retornamos un easing intermedio
	// En una implementación completa, se interpolarían los puntos de control
	if (progress < 0.5) return easing1;
	return easing2;
}

/**
 * Obtiene la duración recomendada según la distancia
 */
export function getDurationByDistance(distance: number, baseDuration = 300, maxDuration = 800): number {
	// Ajustar duración según distancia (más distancia = más tiempo, pero con límite)
	const adjusted = baseDuration + Math.sqrt(distance) * 2;
	return Math.min(adjusted, maxDuration);
}

/**
 * Obtiene el easing recomendado según el tipo de movimiento
 */
export function getEasingByMovement(
	type: 'enter' | 'exit' | 'update' | 'hover' | 'press',
	emphasis: 'subtle' | 'medium' | 'strong' = 'medium'
): string {
	const emphasisMap = {
		subtle: {
			enter: customEasings.quickSlow,
			exit: customEasings.easeInSuper,
			update: customEasings.quickSlow,
			hover: customEasings.magnetic,
			press: customEasings.snap,
		},
		medium: {
			enter: customEasings.easeOutSuper,
			exit: customEasings.expoOut,
			update: customEasings.liquid,
			hover: customEasings.elasticSubtle,
			press: customEasings.bounceSubtle,
		},
		strong: {
			enter: customEasings.elasticMedium,
			exit: customEasings.dramaticOut,
			update: customEasings.elasticSubtle,
			hover: customEasings.scaleOrganic,
			press: customEasings.snap,
		},
	};

	return emphasisMap[emphasis][type];
}

// ============================================================================
// Curvas de Velocidad
// ============================================================================

/**
 * Configuraciones de velocidad para diferentes dispositivos/capacidades
 */
export const velocityCurves = {
	/** Para dispositivos de bajo rendimiento */
	lowPower: {
		duration: 200,
		easing: 'linear',
		useTransformOnly: true,
		disableBlur: true,
	},

	/** Para dispositivos estándar */
	standard: {
		duration: 350,
		easing: customEasings.quickSlow,
		useTransformOnly: false,
		disableBlur: false,
	},

	/** Para dispositivos de alto rendimiento */
	highEnd: {
		duration: 500,
		easing: customEasings.easeOutSuper,
		useTransformOnly: false,
		disableBlur: false,
	},
} as const;

/**
 * Detecta la capacidad del dispositivo y retorna curva apropiada
 */
export function getOptimalVelocityCurve(): {
	duration: number;
	easing: string;
	useTransformOnly: boolean;
	disableBlur: boolean;
} {
	if (typeof window === 'undefined') return velocityCurves.standard;

	// Detectar capacidades
	const memory = (navigator as any).deviceMemory;
	const cores = navigator.hardwareConcurrency;
	const connection = (navigator as any).connection;

	// Criterios para dispositivos de baja potencia
	if (
		(memory && memory < 4) ||
		(cores && cores < 4) ||
		(connection && (connection.saveData || connection.effectiveType === '2g'))
	) {
		return velocityCurves.lowPower;
	}

	// Criterios para dispositivos de alta gama
	if (memory && memory >= 8 && cores && cores >= 6) {
		return velocityCurves.highEnd;
	}

	return velocityCurves.standard;
}

// ============================================================================
// Exportaciones por Defecto
// ============================================================================

export default {
	custom: customEasings,
	contextual: contextualEasings,
	spring: springConfigs,
	velocity: velocityCurves,
};
