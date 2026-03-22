/**
 * @file Tipos para el sistema de transiciones avanzadas
 * @module lib/transitions/types
 * @description Tipos TypeScript para FLIP, morphing y transiciones direccionales
 */

import type { AnimationInstance, AnimationParams } from '@/lib/animation';

// ============================================================================
// Tipos Básicos
// ============================================================================

/** Dirección de movimiento para transiciones */
export type TransitionDirection =
	| 'top'
	| 'bottom'
	| 'left'
	| 'right'
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right'
	| 'center'
	| 'auto';

/** Eje de transformación */
export type TransformAxis = 'x' | 'y' | 'both';

/** Tipo de entrada/salida */
export type EntryExitType = 'slide' | 'scale' | 'clip' | 'morph' | 'blur';

// ============================================================================
// Tipos FLIP
// ============================================================================

/** Estado de un elemento para FLIP */
export interface FlipState {
	/** Rectángulo del elemento en estado inicial */
	rect: DOMRect;
	/** Estilos computados relevantes */
	styles: {
		borderRadius: string;
		opacity: number;
	};
	/** Transformación calculada */
	transform: {
		x: number;
		y: number;
		scaleX: number;
		scaleY: number;
	};
}

/** Opciones para el motor FLIP */
export interface FlipOptions {
	/** Si debe animar border-radius */
	animateBorderRadius?: boolean;
	/** Si debe animar opacidad */
	animateOpacity?: boolean;
	/** Delay antes de iniciar */
	delay?: number;
	/** Duración de la animación en ms */
	duration?: number;
	/** Easing de la animación */
	easing?: string;
	/** Transformaciones adicionales */
	extraTransforms?: {
		/** Rotación en grados */
		rotate?: number;
		/** Opacidad final */
		opacity?: number;
	};
	onComplete?: () => void;
	/** Callbacks */
	onStart?: () => void;
	onUpdate?: (progress: number) => void;
	/** Reducir movimiento para accesibilidad */
	respectPrefersReducedMotion?: boolean;
}

/** Configuración de un elemento FLIP */
export interface FlipElementConfig {
	/** Referencia al elemento DOM */
	element: HTMLElement;
	/** ID único del elemento */
	id: string;
	/** Opciones específicas para este elemento */
	options?: Partial<FlipOptions>;
}

// ============================================================================
// Tipos Morphing
// ============================================================================

/** Configuración de morphing de formas */
export interface MorphConfig {
	/** Delay */
	delay?: number;
	/** Duración de la animación */
	duration?: number;
	/** Easing */
	easing?: string;
	/** Forma inicial (path SVG o descriptor) */
	fromShape?: string;
	/** Propiedades a animar */
	properties?: MorphProperty[];
	/** Forma final */
	toShape?: string;
}

/** Propiedades que pueden morpharse */
export type MorphProperty =
	| 'borderRadius'
	| 'clipPath'
	| 'width'
	| 'height'
	| 'backgroundColor'
	| 'transform'
	| 'boxShadow';

/** Estado de morphing */
export interface MorphState {
	/** Instancia de animación compatible */
	animation?: AnimationInstance;
	/** Forma actual */
	currentShape: string;
	/** Progreso (0-1) */
	progress: number;
}

// ============================================================================
// Tipos de Entrada/Salida
// ============================================================================

/** Configuración de entrada */
export interface EnterConfig {
	/** Delay antes de iniciar (stagger) */
	delay?: number;
	/** Dirección de origen */
	direction?: TransitionDirection;
	/** Distancia de desplazamiento */
	distance?: number;
	/** Duración */
	duration?: number;
	/** Easing */
	easing?: string;
	/** Blur inicial */
	initialBlur?: number;
	/** Opacidad inicial */
	initialOpacity?: number;
	/** Escala inicial */
	initialScale?: number;
	/** Tipo de animación de entrada */
	type?: EntryExitType;
}

/** Configuración de salida */
export interface ExitConfig {
	/** Delay antes de iniciar */
	delay?: number;
	/** Dirección de destino */
	direction?: TransitionDirection;
	/** Distancia de desplazamiento */
	distance?: number;
	/** Duración */
	duration?: number;
	/** Easing */
	easing?: string;
	/** Blur final */
	finalBlur?: number;
	/** Opacidad final */
	finalOpacity?: number;
	/** Escala final */
	finalScale?: number;
	/** Si debe mantener el espacio mientras sale */
	keepSpace?: boolean;
	/** Tipo de animación de salida */
	type?: EntryExitType;
}

/** Configuración combinada entrada/salida */
export interface EnterExitConfig {
	enter?: EnterConfig;
	exit?: ExitConfig;
	/** Grupo al que pertenece (para stagger) */
	group?: string;
	/** Índice en el grupo */
	index?: number;
	/** Coordenadas de origen para animación coordinada */
	origin?: {
		x: number;
		y: number;
	};
	/** Delay base para el grupo */
	staggerDelay?: number;
}

// ============================================================================
// Tipos de Elementos Compartidos
// ============================================================================

/** Configuración de elemento compartido */
export interface SharedElementConfig {
	/** Clip path durante la transición */
	clipPath?: boolean;
	/** Duración */
	duration?: number;
	/** ID único del elemento compartido */
	id: string;
	/** Si debe mantener el aspecto ratio */
	maintainAspectRatio?: boolean;
	/** Tipo de transición */
	type?: 'morph' | 'crossfade' | 'slide' | 'scale';
}

/** Estado de un elemento compartido */
export interface SharedElementState {
	id: string;
	isTransitioning: boolean;
	sourceRect: DOMRect;
	targetRect: DOMRect;
}

// ============================================================================
// Tipos de Grupos y Secuencias
// ============================================================================

/** Configuración de grupo de transiciones */
export interface TransitionGroupConfig {
	/** ID del grupo */
	id: string;
	/** Delay máximo total */
	maxStaggerDelay?: number;
	/** Delay entre elementos */
	staggerDelay?: number;
	/** Dirección del stagger */
	staggerDirection?: 'forward' | 'reverse' | 'random';
	/** Tipo de stagger */
	staggerType?: 'equal' | 'start' | 'end' | 'center';
}

/** Secuencia de animaciones */
export interface AnimationSequence {
	/** ID de la secuencia */
	id: string;
	/** Si debe ejecutarse en paralelo o secuencial */
	mode?: 'sequential' | 'parallel';
	/** Callback al completar */
	onComplete?: () => void;
	/** Pasos de la secuencia */
	steps: AnimationStep[];
}

/** Paso de animación */
export interface AnimationStep {
	/** Configuración de animación */
	animation: Partial<AnimationParams>;
	/** Delay antes de este paso */
	delay?: number;
	/** Elementos a animar */
	elements: string[];
	/** ID del paso */
	id: string;
	/** Offset desde el paso anterior (para timeline) */
	offset?: number | string;
}

// ============================================================================
// Tipos de Rendimiento
// ============================================================================

/** Opciones de optimización */
export interface PerformanceOptions {
	/** Reducir calidad en dispositivos lentos */
	adaptiveQuality?: boolean;
	/** Limitar framerate */
	maxFPS?: number;
	/** Usar contain: layout */
	useContainment?: boolean;
	/** Usar transform3d para GPU acceleration */
	useGPUAcceleration?: boolean;
	/** Usar will-change */
	useWillChange?: boolean;
}

/** Métricas de rendimiento */
export interface PerformanceMetrics {
	/** Duración real */
	actualDuration?: number;
	/** Frame rate promedio */
	averageFPS?: number;
	/** Tiempo de fin */
	endTime?: number;
	/** Frames renderizados */
	framesRendered?: number;
	/** Jank detectado */
	jankDetected?: boolean;
	/** Tiempo de inicio */
	startTime: number;
}

// ============================================================================
// Tipos de Props de Componentes
// ============================================================================

/** Props para componente FlipContainer */
export interface FlipContainerProps {
	/** Contenido */
	children: React.ReactNode;
	/** Clases CSS */
	className?: string;
	/** Si está habilitado */
	enabled?: boolean;
	/** ID único */
	flipId: string;
	onComplete?: () => void;
	/** Callbacks */
	onStart?: () => void;
	/** Opciones FLIP */
	options?: FlipOptions;
}

/** Props para componente MorphElement */
export interface MorphElementProps {
	/** Contenido */
	children: React.ReactNode;
	/** Clases CSS */
	className?: string;
	/** Configuración de morphing */
	config?: MorphConfig;
	/** ID único */
	morphId: string;
	/** Forma actual */
	shape: string;
}

/** Props para TransitionGroup */
export interface TransitionGroupProps {
	/** Contenido */
	children: React.ReactNode;
	/** Clases CSS */
	className?: string;
	/** Configuración del grupo */
	config: TransitionGroupConfig;
}

// ============================================================================
// Tipos de Contexto
// ============================================================================

/** Valor del contexto de transiciones */
export interface TransitionsContextValue {
	/** Ejecuta transición FLIP */
	executeFlip: (ids?: string[]) => Promise<void>;
	/** Configuración global */
	globalConfig: {
		duration: number;
		easing: string;
		reducedMotion: boolean;
	};
	/** Si hay transiciones activas */
	isTransitioning: boolean;
	/** Registra un elemento para FLIP */
	registerFlipElement: (config: FlipElementConfig) => void;
	/** Registra un elemento compartido */
	registerSharedElement: (config: SharedElementConfig) => void;
	/** Ejecuta secuencia de animaciones */
	runSequence: (sequence: AnimationSequence) => Promise<void>;
	/** Inicia transición de elemento compartido */
	transitionSharedElement: (id: string, targetElement: HTMLElement) => Promise<void>;
	/** Desregistra un elemento FLIP */
	unregisterFlipElement: (id: string) => void;
}

// ============================================================================
// Utilidades de Tipo
// ============================================================================

/** Coordenadas 2D */
export interface Point2D {
	x: number;
	y: number;
}

/** Rectángulo con transformación */
export interface TransformedRect extends DOMRect {
	transform: {
		x: number;
		y: number;
		scaleX: number;
		scaleY: number;
		rotate: number;
	};
}

/** Estado de animación */
export type AnimationState = 'idle' | 'preparing' | 'running' | 'completed' | 'cancelled';

/** Evento de transición */
export interface TransitionEvent {
	id: string;
	progress?: number;
	timestamp: number;
	type: 'start' | 'update' | 'complete' | 'cancel';
}
