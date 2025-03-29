import type { Album } from '../album/album-types';
import type { Character } from '../character/character-types';
import type { Collection } from '../collection/collection-types';
import type { Concept } from '../concept/concept-types';
import type { FolderExtended } from '../folder/extended';
import type { Group } from '../group/group-types';
import type { Note } from '../note/note-types';
import type { Place } from '../place/place-types';
import type { Prompt } from '../prompt/prompt-types';
import type { Property } from '../property/property-types';
import type { Tag } from '../tag/tag-types';
import type { Wildcard } from '../wildcard/wildcard-types';
import type { WorldItem } from '../world-item/world-item-types';
import type { ImageBase, ImageMetadata, ImageStatsBase, ImageVisualConfigBase } from './base';

/**
 * Tipo extendido para Image con relaciones y propiedades de UI
 */
export interface ImageExtended extends ImageBase {
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
	fullUrl?: string;
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
 * Opciones para el visor de imágenes
 */
export interface ImageViewerOptions {
	zoomFactor?: number;
	rotationAngle?: number;
	enableFullscreen?: boolean;
	enableTransitions?: boolean;
	slideShowInterval?: number;
	initialFilter?: string;
	initialEffect?: string;
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
