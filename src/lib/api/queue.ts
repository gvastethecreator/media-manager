import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	cancelQueueJob,
	countCompletedJobs,
	countFailedJobs,
	countTotalJobs,
	createQueueJob,
	deleteQueueJob,
	findProcessingTimes,
	findQueueJobs,
	findQueueJobsByStatus,
	findRecentQueueJobs,
	getQueueJobById,
	getQueueStats,
	getQueueStatsByQueue,
	retryQueueJob,
	updateQueueJob,
} from '@/services/queue-job/queue-job.service';
import type {
	CreateQueueJobInput,
	PaginatedQueueJobs,
	QueueJobExtended,
	QueueJobFilters,
	QueueJobPaginationOptions,
	QueueStats,
	UpdateQueueJobInput,
} from '@/types/entities/queue-job';

// Query keys
export const queueKeys = {
	all: ['queue'] as const,
	lists: () => [...queueKeys.all, 'list'] as const,
	list: (filters: QueueJobFilters, pagination: QueueJobPaginationOptions) =>
		[...queueKeys.lists(), filters, pagination] as const,
	details: () => [...queueKeys.all, 'detail'] as const,
	detail: (id: string) => [...queueKeys.details(), id] as const,
	stats: () => [...queueKeys.all, 'stats'] as const,
	statsByQueue: (queue: string) => [...queueKeys.stats(), queue] as const,
	recent: (limit: number) => [...queueKeys.all, 'recent', limit] as const,
	byStatus: (status: string, limit: number) => [...queueKeys.all, 'byStatus', status, limit] as const,
	counts: (type: string, since: Date) => [...queueKeys.all, 'counts', type, since] as const,
	processingTimes: (since: Date) => [...queueKeys.all, 'processingTimes', since] as const,
};

// Hooks
export function useQueueJobs(filters: QueueJobFilters = {}, pagination: QueueJobPaginationOptions = {}) {
	return useQuery<PaginatedQueueJobs, Error>({
		queryKey: queueKeys.list(filters, pagination),
		queryFn: () => findQueueJobs(filters, pagination),
		staleTime: 1000 * 10, // 10 segundos
	});
}

export function useQueueJob(id: string) {
	return useQuery<QueueJobExtended | null, Error>({
		queryKey: queueKeys.detail(id),
		queryFn: () => getQueueJobById(id),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function useCreateQueueJob() {
	const queryClient = useQueryClient();

	return useMutation<QueueJobExtended, Error, CreateQueueJobInput>({
		mutationFn: (data) => createQueueJob(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queueKeys.lists() });
			queryClient.invalidateQueries({ queryKey: queueKeys.stats() });
		},
	});
}

export function useUpdateQueueJob() {
	const queryClient = useQueryClient();

	return useMutation<QueueJobExtended, Error, { id: string; data: UpdateQueueJobInput }>({
		mutationFn: ({ id, data }) => updateQueueJob(id, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: queueKeys.lists() });
			queryClient.invalidateQueries({ queryKey: queueKeys.stats() });
			queryClient.setQueryData(queueKeys.detail(data.id), data);
		},
	});
}

export function useDeleteQueueJob() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: (id) => deleteQueueJob(id),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: queueKeys.lists() });
			queryClient.invalidateQueries({ queryKey: queueKeys.stats() });
			queryClient.removeQueries({ queryKey: queueKeys.detail(id) });
		},
	});
}

export function useCancelQueueJob() {
	const queryClient = useQueryClient();

	return useMutation<QueueJobExtended, Error, string>({
		mutationFn: (id) => cancelQueueJob(id),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: queueKeys.lists() });
			queryClient.invalidateQueries({ queryKey: queueKeys.stats() });
			queryClient.setQueryData(queueKeys.detail(data.id), data);
		},
	});
}

export function useRetryQueueJob() {
	const queryClient = useQueryClient();

	return useMutation<QueueJobExtended, Error, string>({
		mutationFn: (id) => retryQueueJob(id),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: queueKeys.lists() });
			queryClient.invalidateQueries({ queryKey: queueKeys.stats() });
			queryClient.setQueryData(queueKeys.detail(data.id), data);
		},
	});
}

export function useQueueStats() {
	return useQuery<QueueStats, Error>({
		queryKey: queueKeys.stats(),
		queryFn: () => getQueueStats(),
		staleTime: 1000 * 5, // 5 segundos
	});
}

export function useRecentQueueJobs(limit = 5) {
	return useQuery<QueueJobExtended[], Error>({
		queryKey: queueKeys.recent(limit),
		queryFn: () => findRecentQueueJobs(limit),
		staleTime: 1000 * 10,
	});
}

export function useQueueJobsByStatus(status: string, limit = 10) {
	return useQuery<QueueJobExtended[], Error>({
		queryKey: queueKeys.byStatus(status, limit),
		queryFn: () => findQueueJobsByStatus(status, limit),
		staleTime: 1000 * 10,
	});
}

export function useQueueStatsByQueue(queue: string) {
	return useQuery<QueueStats, Error>({
		queryKey: queueKeys.statsByQueue(queue),
		queryFn: () => getQueueStatsByQueue(queue),
		staleTime: 1000 * 10,
		enabled: !!queue,
	});
}

export function useCountCompletedJobs(since: Date) {
	return useQuery<number, Error>({
		queryKey: queueKeys.counts('completed', since),
		queryFn: () => countCompletedJobs(since),
		staleTime: 1000 * 60 * 5, // 5 minutos
	});
}

export function useCountFailedJobs(since: Date) {
	return useQuery<number, Error>({
		queryKey: queueKeys.counts('failed', since),
		queryFn: () => countFailedJobs(since),
		staleTime: 1000 * 60 * 5,
	});
}

export function useCountTotalJobs(since: Date) {
	return useQuery<number, Error>({
		queryKey: queueKeys.counts('total', since),
		queryFn: () => countTotalJobs(since),
		staleTime: 1000 * 60 * 5,
	});
}

export function useFindProcessingTimes(since: Date) {
	return useQuery<number[], Error>({
		queryKey: queueKeys.processingTimes(since),
		queryFn: () => findProcessingTimes(since),
		staleTime: 1000 * 60 * 5,
	});
}
