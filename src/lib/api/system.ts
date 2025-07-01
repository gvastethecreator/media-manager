import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface SystemStats {
	totalImages: number;
	totalVideos: number;
	totalAudio: number;
	totalFolders: number;
	totalAlbums: number;
	totalCharacters: number;
	totalCollections: number;
	totalTags: number;
	storageUsed: number;
	storageAvailable: number;
	dbSize: number;
	lastBackup?: string;
}

export interface SystemVersion {
	version: string;
	buildDate: string;
	commitHash: string;
	environment: string;
}

export interface SystemResponse {
	success: boolean;
	message: string;
	timestamp: string;
}

export interface Settings {
	id: string;
	profileId?: string;
	data: Record<string, unknown>;
	createdAt: string;
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
		queryFn: () => api.get<SystemStats>('/system/stats'),
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useSystemVersion() {
	return useQuery<SystemVersion, Error>({
		queryKey: systemKeys.version(),
		queryFn: () => api.get<SystemVersion>('/system/version'),
		staleTime: 1000 * 60 * 5, // 5 minutos
	});
}

export function useSystemSettings() {
	return useQuery<Settings, Error>({
		queryKey: systemKeys.settings(),
		queryFn: () => api.get<Settings>('/system/settings'),
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useProfileSettings(profileId: string) {
	return useQuery<Settings | null, Error>({
		queryKey: systemKeys.profileSettings(profileId),
		queryFn: () => api.get<Settings | null>(`/system/settings/profile/${profileId}`),
		enabled: !!profileId,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useUpdateSystemSettings() {
	const queryClient = useQueryClient();

	return useMutation<Settings, Error, SettingsUpdateInput>({
		mutationFn: (data) => api.put<Settings>('/system/settings', data),
		onSuccess: (data) => {
			queryClient.setQueryData(systemKeys.settings(), data);
		},
	});
}

export function useUpdateProfileSettings() {
	const queryClient = useQueryClient();

	return useMutation<Settings, Error, { profileId: string; data: SettingsUpdateInput }>({
		mutationFn: ({ profileId, data }) => api.put<Settings>(`/system/settings/profile/${profileId}`, data),
		onSuccess: (data, { profileId }) => {
			queryClient.setQueryData(systemKeys.profileSettings(profileId), data);
		},
	});
}

export function useResetSystemSettings() {
	const queryClient = useQueryClient();

	return useMutation<Settings, Error, void>({
		mutationFn: () => api.post<Settings>('/system/settings/reset'),
		onSuccess: (data) => {
			queryClient.setQueryData(systemKeys.settings(), data);
		},
	});
}

export function useResetProfileSettings() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (profileId) => api.post(`/system/settings/profile/${profileId}/reset`),
		onSuccess: (_, profileId) => {
			queryClient.removeQueries({ queryKey: systemKeys.profileSettings(profileId) });
		},
	});
}

export function useRepairSystem() {
	const queryClient = useQueryClient();

	return useMutation<SystemResponse, Error, void>({
		mutationFn: () => api.post<SystemResponse>('/system/repair'),
		onSuccess: () => {
			// Invalidar stats después de reparación
			queryClient.invalidateQueries({ queryKey: systemKeys.stats() });
		},
	});
}

export function useResetDatabase() {
	const queryClient = useQueryClient();

	return useMutation<SystemResponse, Error, void>({
		mutationFn: () => api.post<SystemResponse>('/system/reset-database'),
		onSuccess: () => {
			// Invalidar todo el cache después de reset
			queryClient.clear();
		},
	});
}

export function useInitServer() {
	return useMutation<SystemResponse, Error, void>({
		mutationFn: () => api.post<SystemResponse>('/system/init'),
	});
}
