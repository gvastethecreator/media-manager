/**
 * @file ViewTransitionProvider - Proveedor global de ViewTransition
 * @module providers/ViewTransitionProvider
 * @description Proveedor de contexto para ViewTransition con detección de compatibilidad
 */

import React, { createContext, type PropsWithChildren, type ReactNode, useCallback, useContext, useMemo } from 'react';
import {
	applyReducedMotionConfig,
	createViewTransitionPolyfill,
	generateViewTransitionCSS,
	injectViewTransitionStyles,
	isViewTransitionSupported,
	shouldReduceMotion,
} from '@/lib/view-transition/utils';
import {
	type TransitionNavigationFunction,
	type ViewTransitionConfig,
	type ViewTransitionContextValue,
	type ViewTransitionHook,
} from '@/types/view-transition';

/**
 * Contexto de ViewTransition
 */
const ViewTransitionContext = createContext<ViewTransitionContextValue | null>(null);

/**
 * Configuración por defecto
 */
const DEFAULT_CONFIG: ViewTransitionConfig = {
	enabled: true,
	duration: 300,
	easing: 'ease-in-out',
	reduceMotion: false,
	types: {
		navigation: { enabled: true, duration: 400, easing: 'ease-in-out' },
		enterExit: { enabled: true, duration: 300, easing: 'ease-out' },
		shared: { enabled: true, duration: 250, easing: 'ease-in-out' },
		reorder: { enabled: true, duration: 200, easing: 'ease-out' },
		hover: { enabled: true, duration: 150, easing: 'ease-out' },
		selection: { enabled: true, duration: 100, easing: 'ease-out' },
	},
	css: {
		customClasses: {},
		durations: {},
	},
};

/**
 * Props del ViewTransitionProvider
 */
interface ViewTransitionProviderProps {
	config?: Partial<ViewTransitionConfig>;
	children: ReactNode;
}

/**
 * ViewTransitionProvider - Proveedor global de ViewTransition
 */
export function ViewTransitionProvider({
	config: userConfig = {},
	children,
}: PropsWithChildren<ViewTransitionProviderProps>) {
	// Obtener configuración global de animaciones
	// const { animationConfigs } = useGlobalConfigs();
	const animationConfigs = null; // Temporal hasta encontrar el store correcto

	// Fusionar configuraciones
	const config = useMemo((): ViewTransitionConfig => {
		const baseConfig = { ...DEFAULT_CONFIG, ...userConfig };

		// Integrar con configuración global de animaciones (deshabilitado temporalmente)
		// if (animationConfigs?.transitionSpeed) {
		// 	baseConfig.duration = animationConfigs.transitionSpeed * 1000; // ms
		// }

		// if (animationConfigs?.reduced) {
		// 	baseConfig.reduceMotion = true;
		// }

		return baseConfig;
	}, [userConfig]);

	// Detectar soporte nativo
	const isNativeSupported = useMemo(() => {
		return isViewTransitionSupported();
	}, []);

	// Crear polyfill si es necesario
	const polyfill = useMemo(() => {
		if (!(isNativeSupported && config.enabled)) {
			return createViewTransitionPolyfill();
		}
		return null;
	}, [isNativeSupported, config.enabled]);

	// Función para iniciar ViewTransition
	const startViewTransition = useCallback<ViewTransitionHook>(
		async (callback, options = {}) => {
			if (!config.enabled) {
				callback();
				return;
			}

			// Aplicar configuración de reducción de movimiento
			const effectiveConfig = shouldReduceMotion()
				? applyReducedMotionConfig({
						duration: options.duration ?? config.duration,
						easing: options.easing ?? config.easing,
					})
				: {
						duration: options.duration ?? config.duration,
						easing: options.easing ?? config.easing,
					};

			// Inyectar estilos CSS si es necesario
			if (options.className) {
				const css = generateViewTransitionCSS({
					duration: effectiveConfig.duration,
					easing: effectiveConfig.easing,
					className: options.className,
				});
				injectViewTransitionStyles(css, `vt-${options.className}`);
			}

			// Debug logging
			// if (config.debug) {
			// 	console.log('🎬 ViewTransition:', {
			// 		native: isNativeSupported,
			// 		config: effectiveConfig,
			// 		options,
			// 	});
			// }

			try {
				if (isNativeSupported && 'startViewTransition' in document) {
					// Usar API nativo del browser
					const transition = (document as any).startViewTransition(callback);
					await transition.finished;
				} else if (polyfill) {
					// Usar polyfill
					await polyfill.startViewTransition(callback);
				} else {
					// Fallback simple
					callback();
				}
			} catch (error) {
				// if (config.debug) {
				// 	console.warn('🎬 ViewTransition falló, ejecutando callback directo:', error);
				// }
				callback();
			}
		},
		[config, isNativeSupported, polyfill]
	);

	// Función para navegación con transición
	const transitionNavigation = useCallback<TransitionNavigationFunction>(
		(navigationFn, options = {}) => {
			return startViewTransition(navigationFn, {
				duration: 400, // Navegación ligeramente más lenta
				easing: 'ease-in-out',
				...options,
			});
		},
		[startViewTransition]
	);

	// Valor del contexto
	const contextValue = useMemo((): ViewTransitionContextValue => {
		return {
			config,
			isSupported: isNativeSupported,
			startTransition: startViewTransition,
			transitionNavigation,
		};
	}, [config, isNativeSupported, startViewTransition, transitionNavigation]);

	return <ViewTransitionContext.Provider value={contextValue}>{children}</ViewTransitionContext.Provider>;
}

/**
 * Hook para usar ViewTransition
 */
export function useViewTransition(): ViewTransitionContextValue {
	const context = useContext(ViewTransitionContext);

	if (!context) {
		throw new Error('useViewTransition debe usarse dentro de ViewTransitionProvider');
	}

	return context;
}

/**
 * Hook para navegación con transición
 */
export function useTransitionNavigation() {
	const { transitionNavigation, isSupported } = useViewTransition();

	return {
		navigate: transitionNavigation,
		isSupported,
	};
}

/**
 * Hook para transiciones simples
 */
export function useSimpleTransition() {
	const { startTransition, isSupported } = useViewTransition();

	const transition = useCallback(
		(callback: () => void, duration = 300) => {
			return startTransition(callback, { duration });
		},
		[startTransition]
	);

	return {
		transition,
		isSupported,
	};
}

/**
 * HOC para wrappear componentes con ViewTransition
 */
export function withViewTransition<P extends object>(
	Component: React.ComponentType<P>,
	transitionOptions?: { duration?: number; easing?: ViewTransitionConfig['easing'] }
) {
	return function WrappedComponent(props: P) {
		const { startTransition } = useViewTransition();
		const [isTransitioning, setIsTransitioning] = React.useState(false);

		const handleTransition = useCallback(
			async (callback: () => void) => {
				setIsTransitioning(true);
				try {
					await startTransition(callback, transitionOptions);
				} finally {
					setIsTransitioning(false);
				}
			},
			[startTransition, transitionOptions]
		);

		// Agregar props de transición al componente
		const enhancedProps = {
			...props,
			onTransition: handleTransition,
			isTransitioning,
		} as P & { onTransition: typeof handleTransition; isTransitioning: boolean };

		return <Component {...enhancedProps} />;
	};
}

/**
 * Exportar provider y hooks
 */
export { ViewTransitionContext, type ViewTransitionProviderProps, type ViewTransitionContextValue };

/**
 * Hook personalizado para elementos con nombre de transición
 */
export function useTransitionElement(name?: string) {
	const elementRef = React.useRef<HTMLElement>(null);

	React.useEffect(() => {
		if (elementRef.current && name) {
			elementRef.current.style.viewTransitionName = name;

			return () => {
				if (elementRef.current) {
					elementRef.current.style.viewTransitionName = '';
				}
			};
		}
	}, [name]);

	return elementRef;
}

/**
 * Hook para transiciones condicionales basadas en estado
 */
export function useConditionalTransition<T>(
	value: T,
	predicate: (current: T, previous: T) => boolean = (a, b) => a !== b
) {
	const { startTransition } = useViewTransition();
	const previousValue = React.useRef<T>(value);
	const [isTransitioning, setIsTransitioning] = React.useState(false);

	const updateValue = useCallback(
		async (newValue: T, callback?: () => void) => {
			const shouldTransition = predicate(newValue, previousValue.current);

			if (shouldTransition) {
				setIsTransitioning(true);
				try {
					await startTransition(() => {
						previousValue.current = newValue;
						callback?.();
					});
				} finally {
					setIsTransitioning(false);
				}
			} else {
				previousValue.current = newValue;
				callback?.();
			}
		},
		[startTransition, predicate]
	);

	return {
		currentValue: previousValue.current,
		updateValue,
		isTransitioning,
	};
}
