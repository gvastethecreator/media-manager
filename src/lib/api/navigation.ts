import { type QueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

// Tipos para el sistema de navegación
export interface SystemStats {
	recentActivity: unknown[];
	topTags: Array<{ id: string; name: string; count: number }>;
	totalActivities: number;
	totalAlbums: number;
	totalAudio?: number;
	totalCharacters: number;
	totalCollections: number;
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
	// Totales adicionales (opcionales) provenientes de /stats/system
	totalVideos?: number;
	totalViews: number;
	totalWorkflows?: number;
	totalWorldItems: number;
}

export interface NavigationData {
	albums: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	audios: Array<{ id: string; name: string; duration?: number }>;
	characters: Array<{ id: string; name: string; description?: string }>;
	collections: Array<{ id: string; name: string; description: string; itemCount: number }>;
	concepts: Array<{ id: string; name: string; description?: string }>;
	documents: Array<{ id: string; name: string; type?: string }>;
	file3ds: Array<{ id: string; name: string; format?: string }>;
	folders: Array<{ id: string; name: string; path: string; itemCount: number; parentId?: string | null }>;
	groups: Array<{ id: string; name: string; description?: string }>;
	jsonFiles: Array<{ id: string; name: string; size?: number }>;
	notes: Array<{ id: string; title: string; content?: string }>;
	places: Array<{ id: string; name: string; description?: string }>;
	prompts: Array<{ id: string; name: string; description?: string }>;
	properties: Array<{ id: string; name: string; value?: string }>;
	stats: SystemStats;
	tags: Array<{ id: string; name: string; count?: number }>;
	videos: Array<{ id: string; name: string; duration?: number }>;
	wildcards: Array<{ id: string; name: string; pattern?: string }>;
	workflows: Array<{ id: string; name: string; status?: string }>;
	worldItems: Array<{ id: string; name: string; description?: string }>;
}

// Query keys
export const navigationKeys = {
	all: ['navigation'] as const,
	data: () => [...navigationKeys.all, 'data'] as const,
	stats: () => [...navigationKeys.all, 'stats'] as const,
};

export function invalidateNavigationData(queryClient: QueryClient): Promise<void> {
	return queryClient.invalidateQueries({ queryKey: navigationKeys.data() });
}

// Hook principal para obtener datos de navegación
export function useNavigationData() {
	return useQuery<NavigationData, Error>({
		queryKey: navigationKeys.data(),
		queryFn: () => apiClient.get<NavigationData>('/system/navigation'),
		staleTime: 1000 * 60 * 5, // 5 minutos
		refetchOnWindowFocus: false,
	});
}

// Hook para obtener solo las estadísticas
export function useNavigationStats() {
	return useQuery<SystemStats, Error>({
		queryKey: navigationKeys.stats(),
		queryFn: () => apiClient.get<SystemStats>('/stats/system'),
		staleTime: 1000 * 60 * 2, // 2 minutos
		refetchOnWindowFocus: false,
	});
}

// Hook para datos específicos de una categoría
export function useCategoryData<T = unknown>(category: string, enabled = true) {
	return useQuery<T[], Error>({
		queryKey: [...navigationKeys.all, 'category', category],
		queryFn: () => apiClient.get<T[]>(`/${category}`),
		enabled,
		staleTime: 1000 * 60 * 3, // 3 minutos
	});
}

// Hook para contar items de una categoría
export function useCategoryCount(category: string, enabled = true) {
	return useQuery<{ count: number }, Error>({
		queryKey: [...navigationKeys.all, 'count', category],
		queryFn: () => apiClient.get<{ count: number }>(`/${category}/count`),
		enabled,
		staleTime: 1000 * 60 * 5, // 5 minutos
	});
}
