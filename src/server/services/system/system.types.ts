/**
 * Tipos para el servicio del sistema
 */

/**
 * Estadísticas de navegación del sistema
 */
export interface NavigationStats {
	recentActivity: unknown[];
	topTags: Array<{ id: string; name: string; count: number }>;
	totalActivities: number;
	totalAlbums: number;
	totalCharacters: number;
	totalCollections: number;
	totalDownloads: number;
	totalFavorites: number;
	totalFolders: number;
	totalImages: number;
	totalPlaces: number;
	totalSize: number;
	totalTags: number;
	totalViews: number;
	totalWorldItems: number;
}

/**
 * Estadísticas de entidades de la base de datos para el frontend
 */
export interface DatabaseEntityStats {
	dbSize: number;
	lastBackup?: Date;
	storageAvailable: number;
	storageUsed: number;
	totalAlbums: number;
	totalAudio: number;
	totalCharacters: number;
	totalCollections: number;
	totalFolders: number;
	totalImages: number;
	totalTags: number;
	totalVideos: number;
}

/**
 * Datos completos de navegación con todas las entidades
 */
export interface NavigationData {
	albums: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	audios: Array<{ id: string; name: string; path?: string; duration?: number; itemCount?: number }>;
	characters: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	collections: Array<{ id: string; name: string; description: string; itemCount: number }>;
	concepts: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	documents: Array<{ id: string; name: string; path?: string; type?: string; itemCount?: number }>;
	file3ds: Array<{ id: string; name: string; path?: string; format?: string; itemCount?: number }>;
	folders: Array<{
		id: string;
		name: string;
		path: string;
		itemCount: number;
		parentId?: string | null;
		_count?: { images: number; videos: number };
	}>;
	groups: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	jsonFiles: Array<{ id: string; name: string; path?: string; size?: number; itemCount?: number }>;
	notes: Array<{ id: string; title: string; content?: string; itemCount?: number }>;
	places: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	prompts: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	properties: Array<{ id: string; name: string; value?: string; itemCount?: number }>;
	stats: NavigationStats;
	tags: Array<{ id: string; name: string; count?: number }>;
	videos: Array<{ id: string; name: string; path?: string; duration?: number; itemCount?: number }>;
	wildcards: Array<{ id: string; name: string; pattern?: string; itemCount?: number }>;
	workflows: Array<{ id: string; name: string; status?: string }>;
	worldItems: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
}

/**
 * Estadísticas de runtime del sistema (memoria, CPU, disco)
 */
export interface RuntimeSystemStats {
	cpu: {
		model: string;
		cores: number;
		speed: number;
	};
	disk?: {
		total: number;
		free: number;
		used: number;
		usagePercentage: number;
	};
	memory: {
		total: number;
		free: number;
		used: number;
		usagePercentage: number;
	};
	system: {
		platform: string;
		arch: string;
		nodeVersion: string;
		uptime: number;
	};
}

/**
 * Estadísticas completas del sistema (runtime + DB counts)
 */
export interface SystemRuntimeStats {
	cacheSize: number;
	cpuUsage: number;
	dbSize: number;
	hostname: string;
	memoryUsage: number;
	nodeVersion: string;
	totalEntities: number;
	uptime: number;
}

/**
 * Response genérico del sistema para operaciones (repair, reset, etc.)
 */
export interface SystemResponse {
	message: string;
	success: boolean;
	timestamp: string;
}

/**
 * Response para operaciones de settings
 */
export interface SettingsResponse {
	message: string;
	settings: unknown;
	success: boolean;
}
