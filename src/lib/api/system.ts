import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface SystemStats {
	averageFileSize?: number;
	cpuCores?: number;
	cpuModel?: string;
	cpuUsage?: number;
	databaseSize: number;
	dbSize: number;
	diskUsage?: {
		free: number;
		total: number;
		used: number;
		usedPercentage: number;
	};
	formattedDatabaseSize: string;
	hostname?: string;
	lastBackup?: string;
	memoryFree?: number;
	memoryTotal?: number;
	memoryUsage?: number;
	memoryUsed?: number;
	nodeVersion?: string;
	platform?: string;
	storageAvailable: number;
	storageUsed: number;
	totalAlbums: number;
	totalAudio: number;
	totalCharacters: number;
	totalCollections: number;
	totalConcepts?: number;
	totalDocuments: number;
	totalFile3D: number;
	totalFolders: number;
	totalImages: number;
	totalJsonFiles: number;
	totalMetadata?: number;
	totalNotes?: number;
	totalPlaces?: number;
	totalPrompts?: number;
	totalProperties?: number;
	totalTags: number;
	totalThumbnails?: number;
	totalVideos: number;
	totalWildcards?: number;
	totalWorldItems?: number;
	uptime?: number;
}

export interface SystemVersion {
	buildDate: string;
	commitHash: string;
	environment: string;
	version: string;
}

export interface SystemResponse {
	message: string;
	success: boolean;
	timestamp: string;
}

export interface Settings {
	createdAt: string;
	data: Record<string, unknown>;
	id: string;
	profileId?: string;
	updatedAt: string;
}

export interface SettingsUpdateInput {
	data: Record<string, unknown>;
}

// Query keys
export const systemKeys = {
	all: ['system'] as const,
	stats: () => [...systemKeys.all, 'stats'] as const,
	version: () => [...systemKeys.all, 'version'] as const,
	settings: () => [...systemKeys.all, 'settings'] as const,
	profileSettings: (profileId: string) => [...systemKeys.settings(), 'profile', profileId] as const,
};

// Hooks
export function useSystemStats() {
	return useQuery<SystemStats, Error>({
		queryKey: systemKeys.stats(),
		queryFn: () => apiClient.get<SystemStats>('/system/stats'),
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useSystemVersion() {
	return useQuery<SystemVersion, Error>({
		queryKey: systemKeys.version(),
		queryFn: () => apiClient.get<SystemVersion>('/system/version'),
		staleTime: 1000 * 60 * 5, // 5 minutos
	});
}

export function useSystemSettings() {
	return useQuery<Settings, Error>({
		queryKey: systemKeys.settings(),
		queryFn: () => apiClient.get<Settings>('/system/settings'),
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useProfileSettings(profileId: string) {
	return useQuery<Settings | null, Error>({
		queryKey: systemKeys.profileSettings(profileId),
		queryFn: () => apiClient.get<Settings | null>(`/system/profiles/${profileId}/settings`),
		enabled: !!profileId,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useUpdateSystemSettings() {
	const queryClient = useQueryClient();

	return useMutation<Settings, Error, SettingsUpdateInput>({
		mutationFn: (data) => apiClient.put<Settings>('/system/settings', data),
		onSuccess: (data) => {
			queryClient.setQueryData(systemKeys.settings(), data);
		},
	});
}

export function useUpdateProfileSettings() {
	const queryClient = useQueryClient();

	return useMutation<Settings, Error, { profileId: string; data: SettingsUpdateInput }>({
		mutationFn: ({ profileId, data }) => apiClient.put<Settings>(`/system/profiles/${profileId}/settings`, data),
		onSuccess: (data, { profileId }) => {
			queryClient.setQueryData(systemKeys.profileSettings(profileId), data);
		},
	});
}

export function useResetSystemSettings() {
	const queryClient = useQueryClient();

	return useMutation<Settings, Error, void>({
		mutationFn: () => apiClient.post<Settings>('/system/settings/reset'),
		onSuccess: (data) => {
			queryClient.setQueryData(systemKeys.settings(), data);
		},
	});
}

export function useResetProfileSettings() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (profileId) => apiClient.post(`/system/profiles/${profileId}/settings/reset`),
		onSuccess: (_, profileId) => {
			queryClient.removeQueries({ queryKey: systemKeys.profileSettings(profileId) });
		},
	});
}

export function useRepairSystem() {
	const queryClient = useQueryClient();

	return useMutation<SystemResponse, Error, void>({
		mutationFn: () => apiClient.post<SystemResponse>('/system/repair'),
		onSuccess: () => {
			// Invalidar stats después de reparación
			queryClient.invalidateQueries({ queryKey: systemKeys.stats() });
		},
	});
}

export function useResetDatabase() {
	const queryClient = useQueryClient();

	return useMutation<SystemResponse, Error, void>({
		mutationFn: () => apiClient.post<SystemResponse>('/system/reset-db'),
		onSuccess: () => {
			// Invalidar todo el cache después de reset
			queryClient.clear();
		},
	});
}

export function useInitServer() {
	return useMutation<SystemResponse, Error, void>({
		mutationFn: () => apiClient.post<SystemResponse>('/system/init'),
	});
}
