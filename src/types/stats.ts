/**
 * @file Tipos para estadísticas del sistema
 * @module types/stats
 */

export interface BaseStats {
	total: number;
	processed: number;
	errors: number;
}

export interface ThumbnailStats extends BaseStats {
	totalSize: number;
}

export interface TagStats {
	totalRelations: number;
	usageDiversity: number;
	popularity: number;
	completenessScore: number;
}

export interface EntityStats {
	count: number;
	recentlyAdded: number;
	recentlyUpdated: number;
	withImages: number;
	withoutImages: number;
}

export interface SystemStats {
	images: EntityStats;
	tags: EntityStats;
	collections: EntityStats;
	albums: EntityStats;
	characters: EntityStats;
	places: EntityStats;
	worldItems: EntityStats;
	concepts: EntityStats;
	prompts: EntityStats;
	notes: EntityStats;
	groups: EntityStats;
	properties: EntityStats;
	wildcards: EntityStats;
	thumbnails: ThumbnailStats;
}

export interface PerformanceStats {
	memoryUsage: {
		used: number;
		total: number;
		percentage: number;
	};
	diskUsage: {
		used: number;
		total: number;
		percentage: number;
	};
	databaseSize: number;
	lastUpdated: Date;
}

export interface GeneralStats {
	totalImages: number;
	totalFolders: number;
	totalCollections: number;
	totalTags: number;
	totalAlbums: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalFavorites: number;
	totalViews: number;
	totalDownloads: number;
	totalSize: number;
	totalActivities: number;
	// Campos adicionales para el panel de estadísticas
	totalDocuments?: number;
	totalAudio?: number;
	totalJsonFiles?: number;
	totalWorkflows?: number;
	totalFile3D?: number;
	topTags?: TopTag[];
	recentActivity?: RecentActivity[];
}

export interface TagSummaryStats {
	id: string;
	name: string;
	count: number;
	percentage: number;
}

export interface ActivityStats {
	id: string;
	type: string;
	description: string;
	createdAt: Date;
	entityType?: string;
	entityId?: string;
}

export interface TopTag {
	id: string;
	name: string;
	color?: string;
	count: number;
	percentage?: number;
}

export interface RecentActivity {
	id: string;
	type: string;
	description: string;
	entityType: string;
	entityId: string;
	createdAt: Date;
	metadata?: Record<string, any>;
	image?: {
		id: string;
		name: string;
		thumbnail: Uint8Array | null;
	} | null;
}

export interface StorageBreakdown {
	images: number;
	videos: number;
	audio: number;
	documents: number;
	thumbnails: number;
	cache: number;
	other: number;
	total: number;
}

/**
 * 🔄 Función de transformación para convertir SystemStats a GeneralStats
 * Resuelve la incompatibilidad entre las dos interfaces
 */
export function transformSystemStatsToGeneralStats(systemStats: SystemStats): GeneralStats {
	return {
		totalImages: systemStats.images.count,
		totalFolders: 0, // No disponible en SystemStats, se debe obtener por separado
		totalCollections: systemStats.collections.count,
		totalTags: systemStats.tags.count,
		totalAlbums: systemStats.albums.count,
		totalCharacters: systemStats.characters.count,
		totalPlaces: systemStats.places.count,
		totalWorldItems: systemStats.worldItems.count,
		totalFavorites: 0, // Se debe calcular por separado
		totalViews: 0, // Se debe calcular por separado
		totalDownloads: 0, // Se debe calcular por separado
		totalSize: systemStats.thumbnails.totalSize,
		totalActivities: 0, // Se debe calcular por separado
		// Campos opcionales
		totalDocuments: 0,
		totalAudio: 0,
		totalJsonFiles: 0,
		totalWorkflows: 0,
		totalFile3D: 0,
		topTags: [],
		recentActivity: [],
	};
}

/**
 * 🔄 Función para crear GeneralStats vacío con valores por defecto
 */
export function createEmptyGeneralStats(): GeneralStats {
	return {
		totalImages: 0,
		totalFolders: 0,
		totalCollections: 0,
		totalTags: 0,
		totalAlbums: 0,
		totalCharacters: 0,
		totalPlaces: 0,
		totalWorldItems: 0,
		totalFavorites: 0,
		totalViews: 0,
		totalDownloads: 0,
		totalSize: 0,
		totalActivities: 0,
		totalDocuments: 0,
		totalAudio: 0,
		totalJsonFiles: 0,
		totalWorkflows: 0,
		totalFile3D: 0,
		topTags: [],
		recentActivity: [],
	};
}
