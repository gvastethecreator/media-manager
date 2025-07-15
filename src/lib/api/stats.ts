import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface GeneralStats {
	totalImages: number;
	totalVideos: number;
	totalAudio: number;
	totalDocuments: number;
	totalFolders: number;
	totalAlbums: number;
	totalCharacters: number;
	totalCollections: number;
	totalTags: number;
	totalPlaces: number;
	totalConcepts: number;
	totalNotes: number;
	totalWorldItems: number;
	totalPrompts: number;
	totalWildcards: number;
	storageUsed: number;
	averageFileSize: number;
}

export interface RecentActivity {
	id: string;
	type: 'create' | 'update' | 'delete';
	entityType: string;
	entityId: string;
	entityName: string;
	userId?: string;
	timestamp: string;
	details?: Record<string, unknown>;
}

export interface TopTag {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	imageCount: number;
	percentage: number;
}

export interface StorageBreakdown {
	images: { count: number; size: number; percentage: number };
	videos: { count: number; size: number; percentage: number };
	audio: { count: number; size: number; percentage: number };
	documents: { count: number; size: number; percentage: number };
	thumbnails: { count: number; size: number; percentage: number };
	other: { count: number; size: number; percentage: number };
}

export interface SystemStatsExtended extends GeneralStats {
	recentActivity: RecentActivity[];
	topTags: TopTag[];
	storageBreakdown: StorageBreakdown;
	lastUpdated: string;
}

export interface StatsFilters {
	period?: 'day' | 'week' | 'month' | 'year';
	entityType?: string;
	limit?: number;
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
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
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
