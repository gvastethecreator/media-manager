import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicFile3DCreateInput, PublicFile3DUpdateInput } from '@/lib/api/client/file3d.client';
import type { File3DWithStats } from '@/types/entities/file3d';
import { apiClient } from './client';

export const file3dKeys = {
	all: ['file3ds'] as const,
	lists: () => [...file3dKeys.all, 'list'] as const,
	list: (filters?: Record<string, unknown>) => [...file3dKeys.lists(), filters ?? {}] as const,
	details: () => [...file3dKeys.all, 'detail'] as const,
	detail: (id: string) => [...file3dKeys.details(), id] as const,
};

export function useFile3Ds() {
	return useQuery<File3DWithStats[], Error>({
		queryKey: file3dKeys.list(),
		queryFn: () => apiClient.get<File3DWithStats[]>('/file3ds'),
		staleTime: 60_000,
	});
}

export function useFile3DById(id: string) {
	return useQuery<File3DWithStats, Error>({
		queryKey: file3dKeys.detail(id),
		queryFn: () => apiClient.get<File3DWithStats>(`/file3ds/${id}`),
		enabled: Boolean(id),
		staleTime: 60_000,
	});
}

export function useCreateFile3D() {
	const qc = useQueryClient();
	return useMutation<File3DWithStats, Error, PublicFile3DCreateInput>({
		mutationFn: (data) => apiClient.post<File3DWithStats>('/file3ds', data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: file3dKeys.lists() });
		},
	});
}

export function useUpdateFile3D() {
	const qc = useQueryClient();
	return useMutation<File3DWithStats, Error, { id: string; data: PublicFile3DUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<File3DWithStats>(`/file3ds/${id}`, data),
		onSuccess: (data) => {
			qc.invalidateQueries({ queryKey: file3dKeys.lists() });
			qc.setQueryData(file3dKeys.detail(data.id), data);
		},
	});
}

export function useDeleteFile3D() {
	const qc = useQueryClient();
	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/file3ds/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: file3dKeys.lists() });
		},
	});
}
