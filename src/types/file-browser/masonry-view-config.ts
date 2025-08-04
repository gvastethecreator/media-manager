/**
 * @file Tipos de configuración para MasonryView
 * @description Configuración avanzada para vista masonry tipo Pinterest
 */

import type { AnyEntityWithStats } from '@/types/entities';

/**
 * Algoritmos de posicionamiento disponibles
 */
export type MasonryAlgorithm = 'shortest-column' | 'balanced' | 'left-to-right';

/**
 * Configuración de espaciado y dimensiones
 */
export interface MasonrySpacingConfig {
	/** Espaciado entre elementos */
	gap: number;
	/** Padding del contenedor */
	padding: number;
	/** Ancho mínimo de columna */
	minColumnWidth: number;
	/** Ancho máximo de columna */
	maxColumnWidth: number;
	/** Número mínimo de columnas */
	minColumns: number;
	/** Número máximo de columnas */
	maxColumns: number;
}

/**
 * Configuración de altura dinámica
 */
export interface MasonryHeightConfig {
	/** Altura base para elementos sin dimensiones conocidas */
	baseHeight: number;
	/** Altura mínima permitida */
	minHeight: number;
	/** Altura máxima permitida */
	maxHeight: number;
	/** Usar dimensiones reales cuando estén disponibles */
	useRealDimensions: boolean;
	/** Factor de variación para contenido dinámico */
	variationFactor: number;
	/** Aspect ratios por defecto por tipo de entidad */
	defaultAspectRatios: Record<string, number>;
}

/**
 * Configuración de optimización de layout
 */
export interface MasonryOptimizationConfig {
	/** Algoritmo de posicionamiento */
	algorithm: MasonryAlgorithm;
	/** Rebalancear columnas automáticamente */
	autoRebalance: boolean;
	/** Intentar minimizar espacios vacíos */
	minimizeGaps: boolean;
	/** Considerar aspect ratio de contenido */
	respectAspectRatio: boolean;
	/** Batch size para renderizado */
	batchSize: number;
	/** Debounce para recálculos en ms */
	recalculateDebounce: number;
}

/**
 * Configuración completa de MasonryView
 */
export interface MasonryViewConfig {
	/** Configuración de espaciado */
	spacing: MasonrySpacingConfig;
	/** Configuración de alturas */
	height: MasonryHeightConfig;
	/** Configuración de optimización */
	optimization: MasonryOptimizationConfig;
	/** Animaciones habilitadas */
	animationsEnabled: boolean;
	/** Duración de animaciones en ms */
	animationDuration: number;
	/** Efecto hover habilitado */
	hoverEffects: boolean;
	/** Mostrar sombras */
	showShadows: boolean;
	/** Bordes redondeados */
	roundedCorners: boolean;
	/** Permitir selección múltiple */
	allowMultiSelect: boolean;
	/** Mostrar indicadores de selección */
	showSelectionIndicators: boolean;
}

/**
 * Configuración por defecto para MasonryView
 */
export const DEFAULT_MASONRY_CONFIG: MasonryViewConfig = {
	spacing: {
		gap: 16,
		padding: 24,
		minColumnWidth: 200,
		maxColumnWidth: 400,
		minColumns: 1,
		maxColumns: 8,
	},
	height: {
		baseHeight: 240,
		minHeight: 120,
		maxHeight: 600,
		useRealDimensions: true,
		variationFactor: 0.3,
		defaultAspectRatios: {
			image: 1.25,
			video: 0.5625, // 16:9
			folder: 1.0,
			audio: 2.0,
			document: 1.414, // A4 ratio
			default: 1.2,
		},
	},
	optimization: {
		algorithm: 'shortest-column',
		autoRebalance: true,
		minimizeGaps: true,
		respectAspectRatio: true,
		batchSize: 50,
		recalculateDebounce: 150,
	},
	animationsEnabled: true,
	animationDuration: 300,
	hoverEffects: true,
	showShadows: true,
	roundedCorners: true,
	allowMultiSelect: true,
	showSelectionIndicators: true,
};

/**
 * Presets predefinidos para diferentes usos
 */
export const MASONRY_PRESETS: Record<string, Partial<MasonryViewConfig>> = {
	compact: {
		spacing: {
			gap: 8,
			padding: 16,
			minColumnWidth: 150,
			maxColumnWidth: 250,
			minColumns: 2,
			maxColumns: 6,
		},
		height: {
			baseHeight: 180,
			minHeight: 100,
			maxHeight: 300,
			useRealDimensions: true,
			variationFactor: 0.2,
			defaultAspectRatios: {
				image: 1.0,
				video: 0.5625,
				folder: 0.8,
				audio: 1.5,
				document: 1.2,
				default: 1.0,
			},
		},
		hoverEffects: false,
		showShadows: false,
	},

	gallery: {
		spacing: {
			gap: 20,
			padding: 30,
			minColumnWidth: 250,
			maxColumnWidth: 350,
			minColumns: 1,
			maxColumns: 5,
		},
		height: {
			baseHeight: 300,
			minHeight: 200,
			maxHeight: 800,
			useRealDimensions: true,
			variationFactor: 0.4,
			defaultAspectRatios: {
				image: 1.5,
				video: 0.5625,
				folder: 1.2,
				audio: 2.5,
				document: 1.414,
				default: 1.3,
			},
		},
		optimization: {
			algorithm: 'balanced',
			autoRebalance: true,
			minimizeGaps: true,
			respectAspectRatio: true,
			batchSize: 30,
			recalculateDebounce: 200,
		},
		animationDuration: 400,
		hoverEffects: true,
		showShadows: true,
	},

	pinterest: {
		spacing: {
			gap: 16,
			padding: 24,
			minColumnWidth: 200,
			maxColumnWidth: 300,
			minColumns: 2,
			maxColumns: 6,
		},
		height: {
			baseHeight: 260,
			minHeight: 150,
			maxHeight: 500,
			useRealDimensions: true,
			variationFactor: 0.5,
			defaultAspectRatios: {
				image: 1.4,
				video: 0.5625,
				folder: 1.1,
				audio: 2.2,
				document: 1.5,
				default: 1.3,
			},
		},
		optimization: {
			algorithm: 'shortest-column',
			autoRebalance: false,
			minimizeGaps: false,
			respectAspectRatio: true,
			batchSize: 40,
			recalculateDebounce: 100,
		},
		animationDuration: 250,
		hoverEffects: true,
		showShadows: true,
		roundedCorners: true,
	},

	minimal: {
		spacing: {
			gap: 12,
			padding: 20,
			minColumnWidth: 180,
			maxColumnWidth: 280,
			minColumns: 2,
			maxColumns: 8,
		},
		height: {
			baseHeight: 200,
			minHeight: 120,
			maxHeight: 400,
			useRealDimensions: false,
			variationFactor: 0.1,
			defaultAspectRatios: {
				image: 1.0,
				video: 1.0,
				folder: 1.0,
				audio: 1.0,
				document: 1.0,
				default: 1.0,
			},
		},
		optimization: {
			algorithm: 'left-to-right',
			autoRebalance: false,
			minimizeGaps: true,
			respectAspectRatio: false,
			batchSize: 100,
			recalculateDebounce: 50,
		},
		animationsEnabled: false,
		hoverEffects: false,
		showShadows: false,
		roundedCorners: false,
	},
};

/**
 * Item posicionado en el layout masonry
 */
export interface MasonryLayoutItem {
	/** Entidad del item */
	item: AnyEntityWithStats;
	/** Posición X */
	x: number;
	/** Posición Y */
	y: number;
	/** Ancho del item */
	width: number;
	/** Alto del item */
	height: number;
	/** Índice de columna */
	columnIndex: number;
	/** Aspect ratio calculado o estimado */
	aspectRatio: number;
}

/**
 * Resultado del cálculo de layout
 */
export interface MasonryLayoutResult {
	/** Items posicionados */
	items: MasonryLayoutItem[];
	/** Altura total del contenedor */
	totalHeight: number;
	/** Número de columnas */
	columns: number;
	/** Ancho de cada columna */
	columnWidth: number;
	/** Altura de cada columna */
	columnHeights: number[];
	/** Métricas de balance */
	balance: {
		/** Diferencia entre columna más alta y más baja */
		heightDifference: number;
		/** Desviación estándar de alturas */
		standardDeviation: number;
		/** Factor de balance (0-1, donde 1 es perfectamente balanceado) */
		balanceFactor: number;
	};
}

/**
 * Helper para obtener aspect ratio de una entidad
 */
export function getEntityAspectRatio(entity: AnyEntityWithStats, config: MasonryViewConfig): number {
	// Intentar obtener dimensiones reales
	if (config.height.useRealDimensions) {
		if ('width' in entity && 'height' in entity && entity.width && entity.height) {
			return entity.width / entity.height;
		}

		if ('metadata' in entity && entity.metadata) {
			const metadata = entity.metadata as any;
			if (metadata.width && metadata.height) {
				return metadata.width / metadata.height;
			}
		}
	}

	// Usar aspect ratio por defecto según tipo
	const entityType = 'entityType' in entity ? entity.entityType : 'default';
	return config.height.defaultAspectRatios[entityType] || config.height.defaultAspectRatios.default;
}

/**
 * Helper para calcular altura de una entidad
 */
export function calculateEntityHeight(
	entity: AnyEntityWithStats,
	columnWidth: number,
	config: MasonryViewConfig
): number {
	const aspectRatio = getEntityAspectRatio(entity, config);
	let height = Math.round(columnWidth / aspectRatio);

	// Aplicar variación si está habilitada
	if (config.height.variationFactor > 0) {
		const variation = config.height.variationFactor;
		const randomFactor = 1 + (Math.random() - 0.5) * variation * 2;
		height = Math.round(height * randomFactor);
	}

	// Aplicar límites
	height = Math.max(config.height.minHeight, Math.min(height, config.height.maxHeight));

	return height;
}
