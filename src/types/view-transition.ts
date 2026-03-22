/**
 * @file Tipos TypeScript para ViewTransition API
 * @module types/view-transition
 * @description Definiciones de tipos para la implementación de ViewTransition
 */

/**
 * Configuración de ViewTransition para diferentes tipos de animación
 */
export interface ViewTransitionConfig {
	/** Configuraciones de CSS personalizadas */
	css: {
		/** Clases CSS personalizadas para diferentes tipos */
		customClasses: Record<string, string>;
		/** Duraciones específicas por elemento */
		durations: Record<string, number>;
	};
	/** Duración por defecto de las transiciones (ms) */
	duration: number;
	/** Función de easing por defecto */
	easing: ViewTransitionEasing;
	/** Habilitar ViewTransition globalmente */
	enabled: boolean;
	/** Reducir movimiento para usuarios con sensibilidad vestibular */
	reduceMotion: boolean;
	/** Configuraciones específicas por tipo */
	types: {
		/** Transiciones de navegación entre vistas */
		navigation: ViewTransitionTypeConfig;
		/** Transiciones de entrada/salida de elementos */
		enterExit: ViewTransitionTypeConfig;
		/** Transiciones de elementos compartidos */
		shared: ViewTransitionTypeConfig;
		/** Transiciones de reordenamiento */
		reorder: ViewTransitionTypeConfig;
		/** Transiciones de hover */
		hover: ViewTransitionTypeConfig;
		/** Transiciones de selección */
		selection: ViewTransitionTypeConfig;
	};
}

/**
 * Configuración específica para un tipo de transición
 */
export interface ViewTransitionTypeConfig {
	/** Clase CSS personalizada */
	className?: string;
	/** Duración específica (sobrescribe la global) */
	duration?: number;
	/** Easing específico (sobrescribe el global) */
	easing?: ViewTransitionEasing;
	/** Habilitar este tipo de transición */
	enabled: boolean;
	/** Configuración adicional específica del tipo */
	options?: Record<string, unknown>;
}

/**
 * Tipos de easing soportados
 */
export type ViewTransitionEasing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';

/**
 * Opciones para iniciar una transición
 */
export interface ViewTransitionOptions {
	className?: string;
	duration?: number;
	easing?: ViewTransitionEasing;
	type?: ViewTransitionType;
}

/**
 * Hook para ViewTransition
 */
export type ViewTransitionHook = (callback: () => void, options?: ViewTransitionOptions) => Promise<void>;

/**
 * Función para navegación con transición
 */
export type TransitionNavigationFunction = (navigationFn: () => void, options?: ViewTransitionOptions) => Promise<void>;

/**
 * Tipos de transición disponibles
 */
export type ViewTransitionType =
	| 'navigation'
	| 'enter'
	| 'exit'
	| 'shared'
	| 'reorder'
	| 'update'
	| 'hover'
	| 'selection'
	| 'modal'
	| 'drawer'
	| 'back'
	| 'forward';

/**
 * Props para el componente ViewTransition
 */
export interface ViewTransitionProps {
	/** Contenido a animar */
	children: React.ReactNode;
	/** Clase CSS adicional */
	className?: string;
	/** Configuración específica para esta transición */
	config?: Partial<ViewTransitionTypeConfig>;
	/** Nombre único para transiciones compartidas */
	name?: string;
	/** Callback cuando la transición es cancelada */
	onTransitionCancel?: () => void;
	/** Callback cuando la transición termina */
	onTransitionEnd?: () => void;
	/** Callback cuando la transición comienza */
	onTransitionStart?: () => void;
	/** Tipo de transición */
	type?: ViewTransitionType;
}

/**
 * Estado de una transición activa
 */
export interface ViewTransitionState {
	/** Duración estimada */
	duration: number;
	/** ID único de la transición */
	id: string;
	/** Progreso (0-1) */
	progress: number;
	/** Timestamp de inicio */
	startTime: number;
	/** Estado actual */
	status: 'idle' | 'preparing' | 'running' | 'finished' | 'cancelled';
	/** Tipo de transición */
	type: ViewTransitionType;
}

/**
 * Contexto del ViewTransition Provider
 */
export interface ViewTransitionContextValue {
	/** Configuración actual */
	config: ViewTransitionConfig;
	/** Verificar si ViewTransition está soportado */
	isSupported: boolean;
	/** Iniciar una transición manualmente */
	startTransition: ViewTransitionHook;
	/** Navegación con transición */
	transitionNavigation: TransitionNavigationFunction;
}

/**
 * Opciones para el hook useViewTransition
 */
export interface UseViewTransitionOptions {
	/** Auto-detectar cambios en el contenido */
	autoDetect?: boolean;
	/** Configuración específica */
	config?: Partial<ViewTransitionTypeConfig>;
	/** Nombre para transiciones compartidas */
	name?: string;
	/** Callback cuando la transición falla */
	onError?: (error: Error) => void;
	/** Callback cuando la transición es exitosa */
	onSuccess?: () => void;
	/** Tipo de transición por defecto */
	type?: ViewTransitionType;
}

/**
 * Resultado del hook useViewTransition
 */
export interface UseViewTransitionResult {
	/** Si ViewTransition está soportado y habilitado */
	canTransition: boolean;
	/** Configuración efectiva */
	effectiveConfig: ViewTransitionTypeConfig;
	/** Si hay una transición en progreso */
	isTransitioning: boolean;
	/** Función para iniciar la transición */
	startTransition: (callback: () => void) => Promise<void>;
	/** Estado actual de la transición */
	state: ViewTransitionState | null;
}

/**
 * Configuración por defecto para ViewTransition
 */
export const DEFAULT_VIEW_TRANSITION_CONFIG: ViewTransitionConfig = {
	enabled: true,
	duration: 300,
	easing: 'ease-out',
	reduceMotion: false,
	types: {
		navigation: {
			enabled: true,
			duration: 400,
			className: 'view-transition-navigation',
		},
		enterExit: {
			enabled: true,
			duration: 250,
			className: 'view-transition-enter-exit',
		},
		shared: {
			enabled: true,
			duration: 300,
			className: 'view-transition-shared',
		},
		reorder: {
			enabled: true,
			duration: 200,
			className: 'view-transition-reorder',
		},
		hover: {
			enabled: true,
			duration: 150,
			className: 'view-transition-hover',
		},
		selection: {
			enabled: true,
			duration: 200,
			className: 'view-transition-selection',
		},
	},
	css: {
		customClasses: {},
		durations: {},
	},
};

/**
 * Tipos para la integración con React experimental
 */
export interface ReactViewTransitionAPI {
	addTransitionType: (type: string) => void;
	startTransition: (callback: () => void) => void;
	ViewTransition: React.ComponentType<{
		children: React.ReactNode;
		name?: string;
		enter?: string | object;
		exit?: string | object;
		update?: string | object;
		share?: string | object;
		default?: string | object;
		onEnter?: (element: Element, types: string[]) => void;
		onExit?: (element: Element, types: string[]) => void;
		onShare?: (element: Element, types: string[]) => void;
		onUpdate?: (element: Element, types: string[]) => void;
	}>;
}

/**
 * Shim/Polyfill para compatibilidad con versiones de React que no soportan ViewTransition
 */
export interface ViewTransitionPolyfill {
	addTransitionType: (type: string) => void;
	isNative: boolean;
	startViewTransition: (callback: () => void) => Promise<void>;
}
