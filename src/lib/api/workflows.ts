import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkflowWithStats, WorkflowCreateInput, WorkflowUpdateInput } from '@/types/entities/workflow';
import { apiClient } from './client';

export const workflowKeys = {
	all: ['workflows'] as const,
	lists: () => [...workflowKeys.all, 'list'] as const,
	list: (filters?: Record<string, unknown>) => [...workflowKeys.lists(), filters ?? {}] as const,
	details: () => [...workflowKeys.all, 'detail'] as const,
	detail: (id: string) => [...workflowKeys.details(), id] as const,
};

export function useWorkflows() {
	return useQuery<WorkflowWithStats[], Error>({
		queryKey: workflowKeys.list(),
		queryFn: () => apiClient.get<WorkflowWithStats[]>('/workflows'),
		staleTime: 60_000,
	});
}

export function useCreateWorkflow() {
	const qc = useQueryClient();
	return useMutation<WorkflowWithStats, Error, WorkflowCreateInput>({
		mutationFn: (data) => apiClient.post<WorkflowWithStats>('/workflows', data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workflowKeys.lists() });
		},
	});
}

export function useUpdateWorkflow() {
	const qc = useQueryClient();
	return useMutation<WorkflowWithStats, Error, { id: string; data: WorkflowUpdateInput }>({
		mutationFn: ({ id, data }) => apiClient.put<WorkflowWithStats>(`/workflows/${id}`, data),
		onSuccess: (data) => {
			qc.invalidateQueries({ queryKey: workflowKeys.lists() });
			qc.setQueryData(workflowKeys.detail(data.id), data);
		},
	});
}

export function useDeleteWorkflow() {
	const qc = useQueryClient();
	return useMutation<void, Error, string>({
		mutationFn: (id) => apiClient.delete(`/workflows/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workflowKeys.lists() });
		},
	});
}
