/**
 * Tipos para el servicio del sistema
 */

/**
 * Estadísticas de navegación del sistema
 */
export type NavigationStats = {
	totalImages: number;
	totalFolders: number;
	totalCollections: number;
	totalTags: number;
	totalAlbums: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalFavorites: number;
	totalActivities: number;
	totalSize: number;
	totalViews: number;
	totalDownloads: number;
	topTags: Array<{ id: string; name: string; count: number }>;
	recentActivity: unknown[];
};

/**
 * Datos completos de navegación con todas las entidades
 */
export interface NavigationData {
	folders: Array<{
		id: string;
		name: string;
		path: string;
		itemCount: number;
		parentId?: string | null;
		_count?: { images: number; videos: number };
	}>;
	collections: Array<{ id: string; name: string; description: string; itemCount: number }>;
	tags: Array<{ id: string; name: string; count?: number }>;
	albums: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	characters: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	places: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	worldItems: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	concepts: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	prompts: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	notes: Array<{ id: string; title: string; content?: string; itemCount?: number }>;
	groups: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	properties: Array<{ id: string; name: string; value?: string; itemCount?: number }>;
	wildcards: Array<{ id: string; name: string; pattern?: string; itemCount?: number }>;
	audios: Array<{ id: string; name: string; duration?: number; itemCount?: number }>;
	documents: Array<{ id: string; name: string; type?: string; itemCount?: number }>;
	jsonFiles: Array<{ id: string; name: string; size?: number; itemCount?: number }>;
	file3ds: Array<{ id: string; name: string; format?: string; itemCount?: number }>;
	videos: Array<{ id: string; name: string; duration?: number; itemCount?: number }>;
	stats: NavigationStats;
}

/**
 * Estadísticas de runtime del sistema (memoria, CPU, disco)
 */
export interface RuntimeSystemStats {
	system: {
		platform: string;
		arch: string;
		nodeVersion: string;
		uptime: number;
	};
	memory: {
		total: number;
		free: number;
		used: number;
		usagePercentage: number;
	};
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
}

/**
 * Estadísticas completas del sistema (runtime + DB counts)
 */
export interface SystemRuntimeStats {
	memory: {
		total: number;
		free: number;
		used: number;
		percentage: number;
	};
	cpu: {
		cores: number;
		usage: number;
	};
	uptime: number;
	platform: string;
	nodeVersion: string;
}

/**
 * Response genérico del sistema para operaciones (repair, reset, etc.)
 */
export interface SystemResponse {
	success: boolean;
	message: string;
	timestamp: string;
}

/**
 * Response para operaciones de settings
 */
export interface SettingsResponse {
	success: boolean;
	message: string;
	settings: unknown;
}
