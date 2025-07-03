import { type ProfileBase, type ProfileExtended } from '@/types/entities/profile';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Tipos para la API
interface CreateProfileData {
	name: string;
	theme?: 'light' | 'dark' | 'system';
	language?: string;
}

interface UpdateProfileData {
	name?: string;
	theme?: 'light' | 'dark' | 'system';
	language?: string;
}

interface GetProfilesParams {
	page?: number;
	limit?: number;
	search?: string;
}

interface ProfilesResponse {
	data: ProfileBase[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
	timestamp: string;
}

interface ProfileResponse {
	data: ProfileExtended;
	timestamp: string;
}

// API functions
const profilesApi = {
	async getActiveProfile(): Promise<ProfileExtended> {
		const response = await fetch('/api/profiles/active');

		if (!response.ok) {
			throw new Error(`Error ${response.status}: ${response.statusText}`);
		}

		const result: ProfileResponse = await response.json();
		return result.data;
	},

	async getProfiles(params: GetProfilesParams = {}): Promise<ProfilesResponse> {
		const searchParams = new URLSearchParams();

		if (params.page) searchParams.set('page', params.page.toString());
		if (params.limit) searchParams.set('limit', params.limit.toString());
		if (params.search) searchParams.set('search', params.search);

		const response = await fetch(`/api/profiles?${searchParams.toString()}`);

		if (!response.ok) {
			throw new Error(`Error ${response.status}: ${response.statusText}`);
		}

		return response.json();
	},

	async createProfile(data: CreateProfileData): Promise<ProfileBase> {
		const response = await fetch('/api/profiles', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`Error ${response.status}: ${response.statusText}`);
		}

		const result: ProfileResponse = await response.json();
		return result.data;
	},

	async updateProfile(id: string, data: UpdateProfileData): Promise<ProfileBase> {
		const response = await fetch(`/api/profiles/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`Error ${response.status}: ${response.statusText}`);
		}

		const result: ProfileResponse = await response.json();
		return result.data;
	},

	async activateProfile(id: string): Promise<ProfileBase> {
		const response = await fetch(`/api/profiles/${id}/activate`, {
			method: 'POST',
		});

		if (!response.ok) {
			throw new Error(`Error ${response.status}: ${response.statusText}`);
		}

		const result: ProfileResponse = await response.json();
		return result.data;
	},

	async deleteProfile(id: string): Promise<void> {
		const response = await fetch(`/api/profiles/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`Error ${response.status}: ${response.statusText}`);
		}
	},
};

// React Query hooks
export function useActiveProfile() {
	return useQuery({
		queryKey: ['profiles', 'active'],
		queryFn: profilesApi.getActiveProfile,
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
	});
}

export function useProfiles(params: GetProfilesParams = {}) {
	return useQuery({
		queryKey: ['profiles', 'list', params],
		queryFn: () => profilesApi.getProfiles(params),
		staleTime: 2 * 60 * 1000, // 2 minutos
		gcTime: 5 * 60 * 1000, // 5 minutos
	});
}

export function useCreateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: profilesApi.createProfile,
		onSuccess: () => {
			// Invalidar las consultas de profiles para refrescar la lista
			queryClient.invalidateQueries({ queryKey: ['profiles'] });
		},
	});
}

export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateProfileData }) =>
			profilesApi.updateProfile(id, data),
		onSuccess: (updatedProfile) => {
			// Actualizar el cache del perfil específico
			queryClient.setQueryData(['profiles', 'active'], updatedProfile);
			// Invalidar las consultas de profiles
			queryClient.invalidateQueries({ queryKey: ['profiles'] });
		},
	});
}

export function useActivateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: profilesApi.activateProfile,
		onSuccess: (activatedProfile) => {
			// Actualizar el cache del perfil activo
			queryClient.setQueryData(['profiles', 'active'], activatedProfile);
			// Invalidar las consultas de profiles
			queryClient.invalidateQueries({ queryKey: ['profiles'] });
		},
	});
}

export function useDeleteProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: profilesApi.deleteProfile,
		onSuccess: () => {
			// Invalidar las consultas de profiles para refrescar la lista
			queryClient.invalidateQueries({ queryKey: ['profiles'] });
		},
	});
}