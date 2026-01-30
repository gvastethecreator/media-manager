import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AudioCreateInput, AudioUpdateInput, AudioWithStats } from '@/types/entities/audio';
import { apiClient } from './client';

export const audioKeys = {
	all: ['audio'] as const,
	lists: () => [...audioKeys.all, 'list'] as const,
	list: (filters?: Record<string, unknown>) => [...audioKeys.lists(), filters ?? {}] as const,
	details: () => [...audioKeys.all, 'detail'] as const,
	detail: (id: string) => [...audioKeys.details(), id] as const,
};

export function useAudios() {
	return useQuery<AudioWithStats[], Error>({
		queryKey: audioKeys.list(),
		queryFn: () => apiClient.get<AudioWithStats[]>('/audio'),
		staleTime: 60_000,
	});
}

export function useCreateAudio() {
	const qc = useQueryClient();
	return useMutation<AudioWithStats, Error, AudioCreateInput>({
		mutationFn: (data) => apiClient.post<AudioWithStats>('/audio', data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: audioKeys.lists() });
		},
	});
}

export function useUpdateAudio() {
	const qc = useQueryClient();
	return useMutation<AudioWithStats, Error, { id: string; data: AudioUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<AudioWithStats>(`/audio/${id}`, data),
		onSuccess: (data) => {
			qc.invalidateQueries({ queryKey: audioKeys.lists() });
			qc.setQueryData(audioKeys.detail(data.id), data);
		},
	});
}

export function useDeleteAudio() {
	const qc = useQueryClient();
	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/audio/${id}`),
		onSuccess: (_, _id) => {
			qc.invalidateQueries({ queryKey: audioKeys.lists() });
		},
	});
}
