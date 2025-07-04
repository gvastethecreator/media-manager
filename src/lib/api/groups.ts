import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GroupWithStats } from '@/types/entities/group';
import type { ImageWithStats } from '@/types/entities/image';
import { apiClient } from './client';

export interface GroupFilters {
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'imageCount';
	sortOrder?: 'asc' | 'desc';
}

export interface GroupCreateInput {
	name: string;
	description?: string;
	color?: string;
	emoji?: string;
	isPrivate?: boolean;
}

export interface GroupUpdateInput {
	name?: string;
	description?: string;
	color?: string;
	emoji?: string;
	isPrivate?: boolean;
}

export interface GroupsResponse {
	data: GroupWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const groupKeys = {
	all: ['groups'] as const,
	lists: () => [...groupKeys.all, 'list'] as const,
	list: (filters: GroupFilters) => [...groupKeys.lists(), filters] as const,
	details: () => [...groupKeys.all, 'detail'] as const,
	detail: (id: string) => [...groupKeys.details(), id] as const,
	images: (id: string) => [...groupKeys.detail(id), 'images'] as const,
};

// Hooks
export function useGroups(filters: GroupFilters = {}) {
	return useQuery<GroupsResponse, Error>({
		queryKey: groupKeys.list(filters),
		queryFn: () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			return apiClient.get<GroupsResponse>(`/groups?${params.toString()}`);
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useGroup(id: string) {
	return useQuery<GroupWithStats, Error>({
		queryKey: groupKeys.detail(id),
		queryFn: () => apiClient.get<GroupWithStats>(`/groups/${id}`),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useGroupImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: groupKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/groups/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreateGroup() {
	const queryClient = useQueryClient();

	return useMutation<GroupWithStats, Error, GroupCreateInput>({
		mutationFn: (data) => apiClient.post<GroupWithStats>('/groups', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
		},
	});
}

export function useUpdateGroup() {
	const queryClient = useQueryClient();

	return useMutation<GroupWithStats, Error, { id: string; data: GroupUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<GroupWithStats>(`/groups/${id}`, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
			queryClient.setQueryData(groupKeys.detail(data.id), data);
		},
	});
}

export function useDeleteGroup() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/groups/${id}`),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
			queryClient.removeQueries({ queryKey: groupKeys.detail(id) });
			queryClient.removeQueries({ queryKey: groupKeys.images(id) });
		},
	});
}

export function useRecentGroupMedia(groupId: string, limit = 6) {
	return useQuery<
		Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; isVideo?: boolean }>,
		Error
	>({
		queryKey: [...groupKeys.detail(groupId), 'media', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; isVideo?: boolean }>>(
				`/groups/${groupId}/media?limit=${limit}`
			),
		enabled: !!groupId,
	});
}

export function useGroupCardData(groupId: string) {
	return useQuery<GroupWithStats, Error>({
		queryKey: [...groupKeys.detail(groupId), 'card-data'],
		queryFn: () => apiClient.get<GroupWithStats>(`/groups/${groupId}/card-data`),
		enabled: !!groupId,
	});
}
