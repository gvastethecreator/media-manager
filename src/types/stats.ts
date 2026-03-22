/**
 * @file Tipos para estadísticas del sistema
 * @module types/stats
 */

export interface BaseStats {
	errors: number;
	processed: number;
	total: number;
}

export interface ThumbnailStats extends BaseStats {
	// errors heredado de BaseStats
	lastProcessed?: Date;
	pending: number;
	successRate?: number;
	totalFiles: number;
	totalSize: number;
}

export interface TagStats {
	completenessScore: number;
	popularity: number;
	totalRelations: number;
	usageDiversity: number;
}

export interface EntityStats {
	count: number;
	recentlyAdded: number;
	recentlyUpdated: number;
	withImages: number;
	withoutImages: number;
}

export interface SystemStats {
	albums: EntityStats;
	characters: EntityStats;
	collections: EntityStats;
	concepts: EntityStats;
	groups: EntityStats;
	images: EntityStats;
	notes: EntityStats;
	places: EntityStats;
	prompts: EntityStats;
	properties: EntityStats;
	tags: EntityStats;
	thumbnails: ThumbnailStats;
	wildcards: EntityStats;
	worldItems: EntityStats;
}

/**
 * Datos del sistema con métricas de rendimiento
 */
export interface SystemData {
	cacheSize: number;
	cpuUsage: number;
	hostname: string;
	lastUpdated?: Date;
	memoryUsage: number;
	nodeVersion: string;
	totalEntities: number;
	uptime: number;
}

export interface PerformanceStats {
	databaseSize: number;
	diskUsage: {
		used: number;
		total: number;
		percentage: number;
	};
	lastUpdated: Date;
	memoryUsage: {
		used: number;
		total: number;
		percentage: number;
	};
}

export interface GeneralStats {
	recentActivity?: RecentActivity[];
	topTags?: TopTag[];
	totalActivities: number;
	totalAlbums: number;
	totalAudio?: number;
	totalCharacters: number;
	totalCollections: number;
	// Campos adicionales para el panel de estadísticas
	totalDocuments?: number;
	totalDownloads: number;
	totalFavorites: number;
	totalFile3D?: number;
	totalFolders: number;
	totalImages: number;
	totalJsonFiles?: number;
	totalPlaces: number;
	totalSize: number;
	totalTags: number;
	totalViews: number;
	totalWorldItems: number;
}

export interface TagSummaryStats {
	count: number;
	id: string;
	name: string;
	percentage: number;
}

export interface ActivityStats {
	createdAt: Date;
	description: string;
	entityId?: string;
	entityType?: string;
	id: string;
	type: string;
}

export interface TopTag {
	color?: string;
	count: number;
	id: string;
	name: string;
	percentage?: number;
}

export interface RecentActivity {
	createdAt: Date;
	description: string;
	entityId: string;
	entityType: string;
	id: string;
	image?: {
		id: string;
		name: string;
		thumbnail: Uint8Array | null;
	} | null;
	metadata?: Record<string, unknown>;
	type: string;
}

export interface StorageBreakdown {
	audio: number;
	cache: number;
	documents: number;
	images: number;
	other: number;
	thumbnails: number;
	total: number;
	videos: number;
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
		totalFile3D: 0,
		topTags: [],
		recentActivity: [],
	};
}
