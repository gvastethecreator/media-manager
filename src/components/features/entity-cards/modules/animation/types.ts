/**
 * Tipos para el sistema de animación de tarjetas
 */

/**
 * Configuración del sistema de animación
 */
export interface AnimationSystem {
	// Configuración general
	enabled: boolean;
	reducedMotion: boolean;
	transitionDuration: number;
	timingFunction: string;

	// Animaciones de entrada/salida
	entranceAnimation: string;
	exitAnimation: string;
	entranceDelay: number;
	loopAnimations: boolean;

	// Efectos de hover
	hoverEffect: boolean;
	hoverScale: number;
	hoverRotate: boolean;
	hoverLift: boolean;
	liftHeight: number;
	maxRotation: number;

	// Efectos de click
	clickEffect: boolean;
	activeScale: number;
	activeBrightness: number;
}

/**
 * Preset del sistema de animación
 */
export interface AnimationSystemPreset {
	id: string;
	name: string;
	description: string;
	animationSystem: AnimationSystem;
}

/**
 * Props para el componente AnimationPanel
 */
export interface AnimationPanelProps {
	animationSystem: AnimationSystem;
	onChange: (animationSystem: AnimationSystem) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Props para el componente AnimationModule
 */
export interface AnimationModuleProps {
	initialAnimationSystem?: Partial<AnimationSystem>;
	onChange?: (animationSystem: AnimationSystem) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Generador de clases CSS para animaciones
 */
export type AnimationClassesGenerator = (animationSystem: AnimationSystem) => string;

/**
 * Hook para animaciones
 */
export type UseAnimationSystemHook = (initialSystem?: Partial<AnimationSystem>) => {
	animationSystem: AnimationSystem;
	updateAnimationSystem: (update: Partial<AnimationSystem>) => void;
	resetAnimationSystem: () => void;
	generateAnimationClasses: () => string;
};
