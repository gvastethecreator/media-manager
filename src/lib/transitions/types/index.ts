/**
 * @file Tipos para el sistema de transiciones avanzadas
 * @module lib/transitions/types
 * @description Tipos TypeScript para FLIP, morphing y transiciones direccionales
 */

import type { AnimeInstance, AnimeParams } from 'animejs';

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
  /** Transformación calculada */
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
  };
  /** Estilos computados relevantes */
  styles: {
    borderRadius: string;
    opacity: number;
  };
}

/** Opciones para el motor FLIP */
export interface FlipOptions {
  /** Duración de la animación en ms */
  duration?: number;
  /** Easing de la animación */
  easing?: string;
  /** Delay antes de iniciar */
  delay?: number;
  /** Transformaciones adicionales */
  extraTransforms?: {
    /** Rotación en grados */
    rotate?: number;
    /** Opacidad final */
    opacity?: number;
  };
  /** Callbacks */
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  /** Si debe animar border-radius */
  animateBorderRadius?: boolean;
  /** Si debe animar opacidad */
  animateOpacity?: boolean;
  /** Reducir movimiento para accesibilidad */
  respectPrefersReducedMotion?: boolean;
}

/** Configuración de un elemento FLIP */
export interface FlipElementConfig {
  /** ID único del elemento */
  id: string;
  /** Referencia al elemento DOM */
  element: HTMLElement;
  /** Opciones específicas para este elemento */
  options?: Partial<FlipOptions>;
}

// ============================================================================
// Tipos Morphing
// ============================================================================

/** Configuración de morphing de formas */
export interface MorphConfig {
  /** Duración de la animación */
  duration?: number;
  /** Easing */
  easing?: string;
  /** Delay */
  delay?: number;
  /** Forma inicial (path SVG o descriptor) */
  fromShape?: string;
  /** Forma final */
  toShape?: string;
  /** Propiedades a animar */
  properties?: MorphProperty[];
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
  /** Forma actual */
  currentShape: string;
  /** Progreso (0-1) */
  progress: number;
  /** Instancia de anime.js */
  animation?: AnimeInstance;
}

// ============================================================================
// Tipos de Entrada/Salida
// ============================================================================

/** Configuración de entrada */
export interface EnterConfig {
  /** Tipo de animación de entrada */
  type?: EntryExitType;
  /** Dirección de origen */
  direction?: TransitionDirection;
  /** Distancia de desplazamiento */
  distance?: number;
  /** Escala inicial */
  initialScale?: number;
  /** Opacidad inicial */
  initialOpacity?: number;
  /** Blur inicial */
  initialBlur?: number;
  /** Duración */
  duration?: number;
  /** Delay antes de iniciar (stagger) */
  delay?: number;
  /** Easing */
  easing?: string;
}

/** Configuración de salida */
export interface ExitConfig {
  /** Tipo de animación de salida */
  type?: EntryExitType;
  /** Dirección de destino */
  direction?: TransitionDirection;
  /** Distancia de desplazamiento */
  distance?: number;
  /** Escala final */
  finalScale?: number;
  /** Opacidad final */
  finalOpacity?: number;
  /** Blur final */
  finalBlur?: number;
  /** Duración */
  duration?: number;
  /** Delay antes de iniciar */
  delay?: number;
  /** Easing */
  easing?: string;
  /** Si debe mantener el espacio mientras sale */
  keepSpace?: boolean;
}

/** Configuración combinada entrada/salida */
export interface EnterExitConfig {
  enter?: EnterConfig;
  exit?: ExitConfig;
  /** Coordenadas de origen para animación coordinada */
  origin?: {
    x: number;
    y: number;
  };
  /** Grupo al que pertenece (para stagger) */
  group?: string;
  /** Índice en el grupo */
  index?: number;
  /** Delay base para el grupo */
  staggerDelay?: number;
}

// ============================================================================
// Tipos de Elementos Compartidos
// ============================================================================

/** Configuración de elemento compartido */
export interface SharedElementConfig {
  /** ID único del elemento compartido */
  id: string;
  /** Tipo de transición */
  type?: 'morph' | 'crossfade' | 'slide' | 'scale';
  /** Duración */
  duration?: number;
  /** Si debe mantener el aspecto ratio */
  maintainAspectRatio?: boolean;
  /** Clip path durante la transición */
  clipPath?: boolean;
}

/** Estado de un elemento compartido */
export interface SharedElementState {
  id: string;
  sourceRect: DOMRect;
  targetRect: DOMRect;
  isTransitioning: boolean;
}

// ============================================================================
// Tipos de Grupos y Secuencias
// ============================================================================

/** Configuración de grupo de transiciones */
export interface TransitionGroupConfig {
  /** ID del grupo */
  id: string;
  /** Tipo de stagger */
  staggerType?: 'equal' | 'start' | 'end' | 'center';
  /** Delay entre elementos */
  staggerDelay?: number;
  /** Delay máximo total */
  maxStaggerDelay?: number;
  /** Dirección del stagger */
  staggerDirection?: 'forward' | 'reverse' | 'random';
}

/** Secuencia de animaciones */
export interface AnimationSequence {
  /** ID de la secuencia */
  id: string;
  /** Pasos de la secuencia */
  steps: AnimationStep[];
  /** Si debe ejecutarse en paralelo o secuencial */
  mode?: 'sequential' | 'parallel';
  /** Callback al completar */
  onComplete?: () => void;
}

/** Paso de animación */
export interface AnimationStep {
  /** ID del paso */
  id: string;
  /** Elementos a animar */
  elements: string[];
  /** Configuración de animación */
  animation: Partial<AnimeParams>;
  /** Delay antes de este paso */
  delay?: number;
  /** Offset desde el paso anterior (para timeline) */
  offset?: number | string;
}

// ============================================================================
// Tipos de Rendimiento
// ============================================================================

/** Opciones de optimización */
export interface PerformanceOptions {
  /** Usar will-change */
  useWillChange?: boolean;
  /** Usar contain: layout */
  useContainment?: boolean;
  /** Limitar framerate */
  maxFPS?: number;
  /** Usar transform3d para GPU acceleration */
  useGPUAcceleration?: boolean;
  /** Reducir calidad en dispositivos lentos */
  adaptiveQuality?: boolean;
}

/** Métricas de rendimiento */
export interface PerformanceMetrics {
  /** Tiempo de inicio */
  startTime: number;
  /** Tiempo de fin */
  endTime?: number;
  /** Duración real */
  actualDuration?: number;
  /** Frames renderizados */
  framesRendered?: number;
  /** Frame rate promedio */
  averageFPS?: number;
  /** Jank detectado */
  jankDetected?: boolean;
}

// ============================================================================
// Tipos de Props de Componentes
// ============================================================================

/** Props para componente FlipContainer */
export interface FlipContainerProps {
  /** ID único */
  flipId: string;
  /** Si está habilitado */
  enabled?: boolean;
  /** Opciones FLIP */
  options?: FlipOptions;
  /** Clases CSS */
  className?: string;
  /** Contenido */
  children: React.ReactNode;
  /** Callbacks */
  onStart?: () => void;
  onComplete?: () => void;
}

/** Props para componente MorphElement */
export interface MorphElementProps {
  /** ID único */
  morphId: string;
  /** Forma actual */
  shape: string;
  /** Configuración de morphing */
  config?: MorphConfig;
  /** Clases CSS */
  className?: string;
  /** Contenido */
  children: React.ReactNode;
}

/** Props para TransitionGroup */
export interface TransitionGroupProps {
  /** Configuración del grupo */
  config: TransitionGroupConfig;
  /** Clases CSS */
  className?: string;
  /** Contenido */
  children: React.ReactNode;
}

// ============================================================================
// Tipos de Contexto
// ============================================================================

/** Valor del contexto de transiciones */
export interface TransitionsContextValue {
  /** Registra un elemento para FLIP */
  registerFlipElement: (config: FlipElementConfig) => void;
  /** Desregistra un elemento FLIP */
  unregisterFlipElement: (id: string) => void;
  /** Ejecuta transición FLIP */
  executeFlip: (ids?: string[]) => Promise<void>;
  /** Registra un elemento compartido */
  registerSharedElement: (config: SharedElementConfig) => void;
  /** Inicia transición de elemento compartido */
  transitionSharedElement: (id: string, targetElement: HTMLElement) => Promise<void>;
  /** Ejecuta secuencia de animaciones */
  runSequence: (sequence: AnimationSequence) => Promise<void>;
  /** Si hay transiciones activas */
  isTransitioning: boolean;
  /** Configuración global */
  globalConfig: {
    duration: number;
    easing: string;
    reducedMotion: boolean;
  };
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
  type: 'start' | 'update' | 'complete' | 'cancel';
  id: string;
  timestamp: number;
  progress?: number;
}
