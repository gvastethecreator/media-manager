/**
 * @file Extensiones del tipo Image
 * @module types/entities/image/extended
 */

import type { ImageBase, ImageMetadata, ImageStatsBase, ImageVisualConfigBase } from './types';

/**
 * Interfaz para metadatos extendidos de imagen
 */
export interface ImageMetadataExtended {
	width: number;
	height: number;
	size: number;
	format: string;
	colorSpace?: string;
	hasAlpha?: boolean;
	isAnimated?: boolean;
	framerate?: number;
	duration?: number;
	location?: {
		latitude: number;
		longitude: number;
		altitude?: number;
	};
	camera?: {
		make: string;
		model: string;
		software?: string;
	};
	exif?: Record<string, any>;
}

/**
 * Interfaz para opciones del visor de imágenes
 */
export interface ImageViewerOptions {
	enableZoom: boolean;
	enablePan: boolean;
	enableRotate: boolean;
	enableFullscreen: boolean;
	initialZoom: number;
}

/**
 * Tipo extendido para Image con propiedades adicionales
 */
export interface ImageExtended extends ImageBase {
	// Relaciones extendidas y campos enriquecidos
	tags?: any[];
	collections?: any[];
	albums?: any[];
	characters?: any[];
	places?: any[];
	worldItems?: any[];
	concepts?: any[];
	prompts?: any[];
	notes?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];
	stats?: any;
	folder?: any;
	// metadata sigue siendo string | null | undefined para compatibilidad
	metadata?: ImageMetadata;
	thumbnailUrl?: string;
	selected?: boolean;
	loading?: boolean;
	thumbnailLoading?: boolean;
	isExpanded?: boolean;
	aspectRatio?: number;

	// Indicadores de estado
	hasMetadata?: boolean;
	hasThumbnail?: boolean;
	hasError?: boolean;
	isInViewport?: boolean;
}

/**
 * Tipo extendido para ImageVisualConfig con propiedades de UI
 */
export interface ImageVisualConfigExtended extends ImageVisualConfigBase {
	// Propiedades de UI para la visualización
	effectsEnabled?: boolean;
	layersConfig?: Record<string, unknown>;
	viewerOptions?: ImageViewerOptions;
}

/**
 * Tipo extendido para ImageStats con métricas adicionales
 */
export interface ImageStatsExtended extends ImageStatsBase {
	// Métricas adicionales
	totalTagsCount?: number;
	totalAlbumsCount?: number;
	totalCollectionsCount?: number;
	averageTimeViewed?: number;
	popularityScore?: number;
	recentActivity?: {
		lastViewDate?: Date;
		viewsLast7Days?: number;
		viewsLast30Days?: number;
	};
}
