'use client';

import type React from 'react';
import { type CSSProperties, createContext, useContext } from 'react';

export interface CoreConfig {
	// Sistema de capas
	layerSystem?: {
		order?: string[];
		layerBlending?: 'normal' | 'multiply' | 'screen' | 'overlay';
		layerSpacing?: number;
	};

	// Interactividad
	interactiveMode?: 'hover' | 'click' | 'none';
	hoverDelay?: number;
	touchBehavior?: 'tap' | 'longPress' | 'doubleTap';
	pointerPrecision?: 'low' | 'medium' | 'high';
	motionReduction?: boolean;

	// Rendimiento
	performanceMode?: 'performance' | 'balanced' | 'quality';
	enableCache?: boolean;
	loadingStrategy?: 'eager' | 'lazy' | 'progressive';
	enablePreloading?: boolean;

	// Feedback y Respuesta
	enableHaptics?: boolean;
	hapticIntensity?: number;
	enableSounds?: boolean;
	soundVolume?: number;
	soundTheme?: string;

	// Contenido
	contentArrangement?: 'standard' | 'compact' | 'expanded' | 'minimal';
	enableAutoHeight?: boolean;
	maxLines?: number;
	textTruncation?: 'ellipsis' | 'fade' | 'scroll';
	mediaFit?: 'cover' | 'contain' | 'fill';
}

export interface CoreHandlers {
	onInteraction?: (type: 'hover' | 'click' | 'touch', data?: Record<string, unknown>) => void;
	onLoad?: (status: 'loading' | 'loaded' | 'error', data?: Record<string, unknown>) => void;
	onPreload?: () => void;
	onMount?: () => void;
	onUnmount?: () => void;
	onResize?: (dimensions: { width: number; height: number }) => void;
	onVisibilityChange?: (isVisible: boolean) => void;
}

export const DEFAULT_CORE_CONFIG: CoreConfig = {
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	interactiveMode: 'hover',
	hoverDelay: 100,
	touchBehavior: 'tap',
	pointerPrecision: 'medium',
	motionReduction: false,
	performanceMode: 'balanced',
	enableCache: true,
	loadingStrategy: 'progressive',
	enablePreloading: true,
	enableHaptics: false,
	hapticIntensity: 0.5,
	enableSounds: false,
	soundVolume: 0.5,
	soundTheme: 'minimal',
	contentArrangement: 'standard',
	enableAutoHeight: true,
	textTruncation: 'ellipsis',
	mediaFit: 'cover',
};

export interface CoreProviderProps {
	config?: CoreConfig;
	handlers?: CoreHandlers;
	children: React.ReactNode;
}

// Contexto para la configuración central
export const CoreContext = createContext<{
	config: CoreConfig;
	handlers?: CoreHandlers;
}>({
	config: DEFAULT_CORE_CONFIG,
});

export const useCoreConfig = () => useContext(CoreContext);

export function CoreProvider({ config = DEFAULT_CORE_CONFIG, handlers, children }: CoreProviderProps) {
	return <CoreContext.Provider value={{ config, handlers }}>{children}</CoreContext.Provider>;
}

// Hook personalizado para interactividad basada en la configuración core
export function useCardInteractivity(customConfig?: Partial<CoreConfig>) {
	const { config: contextConfig } = useCoreConfig();
	const config = { ...contextConfig, ...customConfig };

	const getInteractivityProps = (): Record<string, unknown> => {
		const props: Record<string, unknown> = {};

		if (config.interactiveMode === 'hover') {
			props.onMouseEnter = () => {
				// Lógica de hover
			};
			props.onMouseLeave = () => {
				// Lógica de hover out
			};

			if (config.hoverDelay && config.hoverDelay > 0) {
				// Implementar lógica de retraso si es necesario
			}
		}

		if (config.interactiveMode === 'click' || config.touchBehavior === 'tap') {
			props.onClick = () => {
				// Lógica de click
			};
		}

		return props;
	};

	return {
		getInteractivityProps,
		config,
	};
}

// Hook personalizado para rendimiento basado en la configuración core
export function useCardPerformance(customConfig?: Partial<CoreConfig>) {
	const { config: contextConfig } = useCoreConfig();
	const config = { ...contextConfig, ...customConfig };

	// Determinar estrategia de carga
	const getLoadingStrategy = () => {
		return {
			loading: config.loadingStrategy || 'progressive',
			preload: config.enablePreloading,
			cache: config.enableCache,
		};
	};

	// Optimizaciones basadas en el modo de rendimiento
	const getPerformanceOptimizations = (): Record<string, unknown> => {
		const optimizations: Record<string, unknown> = {};

		switch (config.performanceMode) {
			case 'performance':
				optimizations.useHardwareAcceleration = true;
				optimizations.disableAnimations = config.motionReduction;
				optimizations.debounceEvents = true;
				optimizations.lowQualityEffects = true;
				break;
			case 'balanced':
				optimizations.useHardwareAcceleration = true;
				optimizations.disableAnimations = config.motionReduction;
				optimizations.debounceEvents = false;
				optimizations.lowQualityEffects = false;
				break;
			case 'quality':
				optimizations.useHardwareAcceleration = true;
				optimizations.disableAnimations = false;
				optimizations.debounceEvents = false;
				optimizations.lowQualityEffects = false;
				break;
		}

		return optimizations;
	};

	return {
		getLoadingStrategy,
		getPerformanceOptimizations,
		config,
	};
}

// Hook personalizado para la gestión de contenido basado en la configuración core
export function useCardContent(customConfig?: Partial<CoreConfig>) {
	const { config: contextConfig } = useCoreConfig();
	const config = { ...contextConfig, ...customConfig };

	// Obtener estilos para contenido
	const getContentStyles = (): CSSProperties => {
		const styles: CSSProperties = {};

		// Ajuste automático de altura
		if (config.enableAutoHeight) {
			styles.height = 'auto';
		}

		// Ajuste de objeto multimedia
		if (config.mediaFit) {
			styles.objectFit = config.mediaFit as CSSProperties['objectFit'];
		}

		// Truncamiento de texto
		if (config.textTruncation === 'ellipsis') {
			styles.textOverflow = 'ellipsis';
			styles.whiteSpace = 'nowrap';
			styles.overflow = 'hidden';
		}

		return styles;
	};

	// Formatear contenido según la configuración
	const formatContent = (content: string, maxLines?: number): string => {
		let formattedContent = content;

		// Limitar a número máximo de líneas si está definido
		if (maxLines || config.maxLines) {
			const lineLimit = maxLines || config.maxLines || 3;
			const lines = content.split('\n');

			if (lines.length > lineLimit) {
				formattedContent = `${lines.slice(0, lineLimit).join('\n')}...`;
			}
		}

		return formattedContent;
	};

	return {
		getContentStyles,
		formatContent,
		config,
	};
}
