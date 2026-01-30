/**
 * @file Tipos de configuración para GridView
 * @description Configuración avanzada para vista de grid con aspect ratios y overlays
 */

import type { AnyEntityWithStats } from '@/types/entities';

/**
 * Opciones de aspect ratio para items de grid
 */
export type GridAspectRatio = 'auto' | 'square' | '4:3' | '16:9' | 'custom';

/**
 * Niveles de información en hover overlay
 */
export type GridHoverInfo = 'none' | 'basic' | 'detailed';

/**
 * Posicionamiento de labels
 */
export type GridLabelPosition = 'bottom' | 'top' | 'overlay' | 'none';

/**
 * Estilo de grid layout
 */
export type GridLayoutStyle = 'packed' | 'uniform' | 'masonry';

/**
 * Configuración de una overlay de información
 */
export interface GridHoverOverlay {
	/** Si mostrar nombre del archivo */
	showName: boolean;
	/** Si mostrar tamaño del archivo */
	showSize: boolean;
	/** Si mostrar fecha de modificación */
	showDate: boolean;
	/** Si mostrar tipo de archivo */
	showType: boolean;
	/** Si mostrar dimensiones (para imágenes/videos) */
	showDimensions: boolean;
	/** Si mostrar duración (para videos/audio) */
	showDuration: boolean;
	/** Si mostrar etiquetas */
	showTags: boolean;
	/** Posición del overlay */
	position: 'center' | 'bottom' | 'top';
	/** Si mostrar fondo semi-transparente */
	showBackground: boolean;
}

/**
 * Configuración de labels para items
 */
export interface GridLabelConfig {
	/** Posición de los labels */
	position: GridLabelPosition;
	/** Si mostrar nombre completo o truncado */
	showFullName: boolean;
	/** Si mostrar información adicional */
	showMetadata: boolean;
	/** Máximo número de líneas para el nombre */
	maxLines: number;
	/** Si mostrar en tooltip el nombre completo */
	showTooltip: boolean;
}

/**
 * Configuración completa del GridView
 */
export interface GridViewConfig {
	/** Aspect ratio para todos los items */
	aspectRatio: GridAspectRatio;
	/** Aspect ratio personalizado (width:height) */
	customAspectRatio?: { width: number; height: number };
	/** Configuración de hover overlay */
	hoverInfo: GridHoverInfo;
	/** Configuración detallada del overlay */
	hoverOverlay: GridHoverOverlay;
	/** Configuración de labels */
	labelConfig: GridLabelConfig;
	/** Tamaño mínimo de items en pixels */
	minItemSize: number;
	/** Tamaño máximo de items en pixels */
	maxItemSize: number;
	/** Espaciado entre items */
	gap: number;
	/** Padding del contenedor */
	padding: number;
	/** Estilo de layout */
	layoutStyle: GridLayoutStyle;
	/** Si mostrar thumbnails */
	showThumbnails: boolean;
	/** Si permitir selección múltiple con Ctrl/Shift */
	allowMultiSelect: boolean;
	/** Si mostrar indicadores de selección */
	showSelectionIndicators: boolean;
	/** Animaciones habilitadas */
	animationsEnabled: boolean;
	/** Duración de animaciones en ms */
	animationDuration: number;
}

/**
 * Configuración por defecto para GridView
 */
export const DEFAULT_GRID_CONFIG: GridViewConfig = {
	aspectRatio: 'square',
	hoverInfo: 'basic',
	hoverOverlay: {
		showName: true,
		showSize: true,
		showDate: false,
		showType: true,
		showDimensions: true,
		showDuration: true,
		showTags: false,
		position: 'bottom',
		showBackground: true,
	},
	labelConfig: {
		position: 'bottom',
		showFullName: false,
		showMetadata: false,
		maxLines: 2,
		showTooltip: true,
	},
	minItemSize: 100,
	maxItemSize: 400,
	gap: 12,
	padding: 20,
	layoutStyle: 'uniform',
	showThumbnails: true,
	allowMultiSelect: true,
	showSelectionIndicators: true,
	animationsEnabled: true,
	animationDuration: 200,
};

/**
 * Configuraciones predefinidas para diferentes usos
 */
export const GRID_PRESETS: Record<string, Partial<GridViewConfig>> = {
	compact: {
		aspectRatio: 'square',
		minItemSize: 80,
		maxItemSize: 120,
		gap: 8,
		padding: 12,
		hoverInfo: 'basic',
		labelConfig: {
			position: 'none',
			showFullName: false,
			showMetadata: false,
			maxLines: 1,
			showTooltip: true,
		},
	},

	detailed: {
		aspectRatio: 'auto',
		minItemSize: 150,
		maxItemSize: 250,
		gap: 16,
		padding: 24,
		hoverInfo: 'detailed',
		labelConfig: {
			position: 'bottom',
			showFullName: true,
			showMetadata: true,
			maxLines: 3,
			showTooltip: false,
		},
		hoverOverlay: {
			showName: true,
			showSize: true,
			showDate: true,
			showType: true,
			showDimensions: true,
			showDuration: true,
			showTags: true,
			position: 'center',
			showBackground: true,
		},
	},

	gallery: {
		aspectRatio: 'auto',
		minItemSize: 200,
		maxItemSize: 350,
		gap: 20,
		padding: 30,
		hoverInfo: 'basic',
		layoutStyle: 'masonry',
		labelConfig: {
			position: 'overlay',
			showFullName: false,
			showMetadata: false,
			maxLines: 1,
			showTooltip: true,
		},
	},

	thumbnails: {
		aspectRatio: 'square',
		minItemSize: 60,
		maxItemSize: 80,
		gap: 4,
		padding: 8,
		hoverInfo: 'none',
		labelConfig: {
			position: 'none',
			showFullName: false,
			showMetadata: false,
			maxLines: 0,
			showTooltip: true,
		},
		animationDuration: 100,
	},
};

/**
 * Helper para obtener aspect ratio como número
 */
export function getAspectRatioValue(config: GridViewConfig): number {
	switch (config.aspectRatio) {
		case 'square':
			return 1;
		case '4:3':
			return 4 / 3;
		case '16:9':
			return 16 / 9;
		case 'custom':
			return config.customAspectRatio ? config.customAspectRatio.width / config.customAspectRatio.height : 1;
		default:
			return 0; // 0 significa usar aspect ratio natural del contenido
	}
}

/**
 * Helper para calcular dimensiones de item
 */
export function calculateItemDimensions(
	config: GridViewConfig,
	itemSize: number,
	entity?: AnyEntityWithStats
): { width: number; height: number } {
	const aspectRatio = getAspectRatioValue(config);

	if (aspectRatio === 0 && entity) {
		// Usar aspect ratio natural si está disponible
		const dimensions = (entity as any).dimensions;
		if (dimensions?.width && dimensions?.height) {
			const naturalRatio = dimensions.width / dimensions.height;
			return {
				width: itemSize,
				height: Math.round(itemSize / naturalRatio),
			};
		}
	}

	if (aspectRatio > 0) {
		return {
			width: itemSize,
			height: Math.round(itemSize / aspectRatio),
		};
	}

	// Fallback a cuadrado
	return {
		width: itemSize,
		height: itemSize,
	};
}
