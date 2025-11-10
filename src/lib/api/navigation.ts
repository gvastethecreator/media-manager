import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

// Tipos para el sistema de navegación
export interface SystemStats {
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
	// Totales adicionales (opcionales) provenientes de /stats/system
	totalVideos?: number;
	totalAudio?: number;
	totalDocuments?: number;
	totalJsonFiles?: number;
	totalFile3D?: number;
	totalWorkflows?: number;
	// Entidades abstractas
	totalPrompts?: number;
	totalNotes?: number;
	totalProperties?: number;
	totalWildcards?: number;
	totalConcepts?: number;
	totalGroups?: number;
	topTags: Array<{ id: string; name: string; count: number }>;
	recentActivity: unknown[];
}

export interface NavigationData {
	folders: Array<{ id: string; name: string; path: string; itemCount: number; parentId?: string | null }>;
	collections: Array<{ id: string; name: string; description: string; itemCount: number }>;
	tags: Array<{ id: string; name: string; count?: number }>;
	albums: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	characters: Array<{ id: string; name: string; description?: string }>;
	places: Array<{ id: string; name: string; description?: string }>;
	worldItems: Array<{ id: string; name: string; description?: string }>;
	concepts: Array<{ id: string; name: string; description?: string }>;
	prompts: Array<{ id: string; name: string; description?: string }>;
	notes: Array<{ id: string; title: string; content?: string }>;
	groups: Array<{ id: string; name: string; description?: string }>;
	properties: Array<{ id: string; name: string; value?: string }>;
	wildcards: Array<{ id: string; name: string; pattern?: string }>;
	audios: Array<{ id: string; name: string; duration?: number }>;
	documents: Array<{ id: string; name: string; type?: string }>;
	jsonFiles: Array<{ id: string; name: string; size?: number }>;
	file3ds: Array<{ id: string; name: string; format?: string }>;
	videos: Array<{ id: string; name: string; duration?: number }>;
	workflows: Array<{ id: string; name: string; status?: string }>;
	stats: SystemStats;
}

// Query keys
export const navigationKeys = {
	all: ['navigation'] as const,
	data: () => [...navigationKeys.all, 'data'] as const,
	stats: () => [...navigationKeys.all, 'stats'] as const,
};

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
