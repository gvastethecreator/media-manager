/**
 * Tipos para el sistema de animación de tarjetas
 */

/**
 * Interfaz para el sistema de animación
 */
export interface AnimationSystem {
	// Configuración general
	enabled: boolean;
	reducedMotion: boolean;
	transitionDuration: number; // en milisegundos
	timingFunction: string;

	// Animaciones de entrada/salida
	entranceAnimation: string;
	exitAnimation: string;
	entranceDelay: number; // en milisegundos
	loopAnimations: boolean;

	// Efectos de hover
	hoverEffect: boolean;
	hoverScale: number;
	hoverRotate: boolean;
	hoverLift: boolean;
	liftHeight: number; // en píxeles
	maxRotation: number; // en grados

	// Efectos de click
	clickEffect: boolean;
	activeScale: number;
	activeBrightness: number;
}

/**
 * Interfaz para presets del sistema de animación
 */
export interface AnimationSystemPreset {
	id: string;
	name: string;
	description: string;
	animationSystem: AnimationSystem;
}

/**
 * Props para el panel de animación
 */
export interface AnimationPanelProps {
	animationSystem: AnimationSystem;
	onChange: (updatedSystem: AnimationSystem) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Props para el módulo de animación
 */
export interface AnimationModuleProps {
	initialAnimationSystem?: Partial<AnimationSystem>;
	onChange?: (updatedSystem: AnimationSystem) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Tipo para el hook useAnimationSystem
 */
export interface UseAnimationSystemHook {
	animationSystem: AnimationSystem;
	updateAnimationSystem: (update: Partial<AnimationSystem>) => void;
	resetAnimationSystem: () => void;
	applyCustomTimingFunction: (x1: number, y1: number, x2: number, y2: number) => void;
	getAnimationClasses: () => string;
	getAnimationVariables: () => Record<string, string>;
	getAnimationStyles: () => React.CSSProperties;
}
