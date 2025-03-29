/**
 * @file Extensiones del tipo Image
 * @module types/entities/image/extended
 */

import type { Album } from '../album/album-types';
import type { Character } from '../character/types';
import type { Collection } from '../collection/types';
import type { Concept } from '../concept/types';
import type { FolderExtended } from '../folder/extended';
import type { Group } from '../group/types';
import type { Note } from '../note/types';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Property } from '../property/types';
import type { Tag } from '../tag/types';
import type { Wildcard } from '../wildcard/types';
import type { WorldItem } from '../world-item/types';
import type { ImageBase, ImageMetadata, ImageStatsBase, ImageVisualConfigBase } from './base';

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
	// Propiedades calculadas
	thumbUrl?: string;
	fullUrl?: string;
	displayName?: string;
	isProcessed?: boolean;
	parsedMetadata?: ImageMetadataExtended;
	parsedTags?: string[];

	// Relaciones cargadas
	folder?: FolderExtended;
	visualConfig?: ImageVisualConfigExtended | null;
	stats?: ImageStatsExtended | null;

	// Relaciones básicas
	uploadedImages?: any[];
	activities?: any[];

	// Relaciones con entidades principales
	tags?: Tag[];
	albums?: Album[];
	collections?: Collection[];
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	prompts?: Prompt[];
	notes?: Note[];
	wildcards?: Wildcard[];
	properties?: Property[];
	groups?: Group[];

	// Propiedades adicionales de UI
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
