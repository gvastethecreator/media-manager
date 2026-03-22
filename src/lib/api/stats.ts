import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface GeneralStats {
	averageFileSize: number;
	diskUsage?: {
		total: number;
		used: number;
		free: number;
		usedPercentage: number;
	};
	freeSpace?: number;
	// Estadísticas calculadas
	storageUsed: number;
	totalActivities: number;
	totalAlbums: number;
	totalAudio: number;
	totalCharacters: number;
	totalCollections: number;
	totalConcepts: number;
	totalDocuments: number;
	totalFavorites: number;
	totalFile3D: number;
	totalFolders: number;
	totalImages: number;
	totalJsonFiles: number;
	totalMetadata: number;
	totalNotes: number;
	totalPlaces: number;
	totalPrompts: number;
	totalProperties: number;
	totalTags: number;
	totalThumbnails: number;
	totalVideos: number;
	totalWildcards: number;
	totalWorkflows: number;
	totalWorldItems: number;
	// Información de espacio
	usedSpace?: number;
}

export interface RecentActivity {
	details?: Record<string, unknown>;
	entityId: string;
	entityName: string;
	entityType: string;
	id: string;
	timestamp: string;
	type: 'create' | 'update' | 'delete';
	userId?: string;
}

export interface TopTag {
	color?: string;
	emoji?: string;
	id: string;
	imageCount: number;
	name: string;
	percentage: number;
}

export interface StorageBreakdown {
	audio: { count: number; size: number; percentage: number };
	documents: { count: number; size: number; percentage: number };
	images: { count: number; size: number; percentage: number };
	other: { count: number; size: number; percentage: number };
	thumbnails: { count: number; size: number; percentage: number };
	videos: { count: number; size: number; percentage: number };
}

export interface SystemStatsExtended extends GeneralStats {
	lastUpdated: string;
	recentActivity: RecentActivity[];
	storageBreakdown: StorageBreakdown;
	topTags: TopTag[];
}

export interface StatsFilters {
	entityType?: string;
	limit?: number;
	period?: 'day' | 'week' | 'month' | 'year';
}

// Query keys
export const statsKeys = {
	all: ['stats'] as const,
	general: () => [...statsKeys.all, 'general'] as const,
	extended: () => [...statsKeys.all, 'extended'] as const,
	activity: (filters: StatsFilters) => [...statsKeys.all, 'activity', filters] as const,
	topTags: (limit: number) => [...statsKeys.all, 'top-tags', limit] as const,
	storage: () => [...statsKeys.all, 'storage'] as const,
};

// Hooks
export function useGeneralStats() {
	return useQuery<GeneralStats, Error>({
		queryKey: statsKeys.general(),
		queryFn: () => apiClient.get<GeneralStats>('/stats/general'),
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useSystemStatsExtended() {
	return useQuery<SystemStatsExtended, Error>({
		queryKey: statsKeys.extended(),
		queryFn: () => apiClient.get<SystemStatsExtended>('/stats/extended'),
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useRecentActivity(filters: StatsFilters = {}) {
	return useQuery<RecentActivity[], Error>({
		queryKey: statsKeys.activity(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			// Validación null-safe para evitar errores de Object.entries
			if (filters && typeof filters === 'object') {
				for (const [key, value] of Object.entries(filters)) {
					if (value !== undefined && value !== null) {
						params.append(key, String(value));
					}
				}
			}
			return apiClient.get<RecentActivity[]>(`/stats/activity?${params.toString()}`);
		},
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useTopTags(limit = 10) {
	return useQuery<TopTag[], Error>({
		queryKey: statsKeys.topTags(limit),
		queryFn: () => apiClient.get<TopTag[]>(`/stats/top-tags?limit=${limit}`),
		staleTime: 1000 * 60 * 5, // 5 minutos
	});
}

export function useStorageBreakdown() {
	return useQuery<StorageBreakdown, Error>({
		queryKey: statsKeys.storage(),
		queryFn: () => apiClient.get<StorageBreakdown>('/stats/storage'),
		staleTime: 1000 * 60 * 5, // 5 minutos
	});
}
