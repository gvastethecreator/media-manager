import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DocumentCreateInput, DocumentUpdateInput, DocumentWithStats } from '@/types/entities/document';
import { apiClient } from './client';

export const documentKeys = {
	all: ['documents'] as const,
	lists: () => [...documentKeys.all, 'list'] as const,
	list: (filters?: Record<string, unknown>) => [...documentKeys.lists(), filters ?? {}] as const,
	details: () => [...documentKeys.all, 'detail'] as const,
	detail: (id: string) => [...documentKeys.details(), id] as const,
};

export function useDocuments() {
	return useQuery<DocumentWithStats[], Error>({
		queryKey: documentKeys.list(),
		queryFn: () => apiClient.get<DocumentWithStats[]>('/documents'),
		staleTime: 60_000,
	});
}

export function useDocumentById(id: string) {
	return useQuery<DocumentWithStats, Error>({
		queryKey: documentKeys.detail(id),
		queryFn: () => apiClient.get<DocumentWithStats>(`/documents/${id}`),
		enabled: Boolean(id),
		staleTime: 60_000,
	});
}

export function useCreateDocument() {
	const qc = useQueryClient();
	return useMutation<DocumentWithStats, Error, DocumentCreateInput>({
		mutationFn: (data) => apiClient.post<DocumentWithStats>('/documents', data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: documentKeys.lists() });
		},
	});
}

export function useUpdateDocument() {
	const qc = useQueryClient();
	return useMutation<DocumentWithStats, Error, { id: string; data: DocumentUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<DocumentWithStats>(`/documents/${id}`, data),
		onSuccess: (data) => {
			qc.invalidateQueries({ queryKey: documentKeys.lists() });
			qc.setQueryData(documentKeys.detail(data.id), data);
		},
	});
}

export function useDeleteDocument() {
	const qc = useQueryClient();
	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/documents/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: documentKeys.lists() });
		},
	});
}
