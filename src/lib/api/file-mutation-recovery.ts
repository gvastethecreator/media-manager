import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export type StartupFileMutationRecoveryState = 'clean' | 'pending' | 'resolved' | 'manual_review_required';

export interface StartupFileMutationRecovery {
	completed: number;
	manual: number;
	pending: number;
	state: StartupFileMutationRecoveryState;
}

interface StartupFileMutationRecoveryResponse {
	data: { recovery: StartupFileMutationRecovery };
	success: true;
}

export const fileMutationRecoveryKeys = {
	startup: ['file-mutation-recovery', 'startup'] as const,
};

export function useStartupFileMutationRecovery() {
	return useQuery({
		queryKey: fileMutationRecoveryKeys.startup,
		queryFn: async () => {
			const response = await apiClient.get<StartupFileMutationRecoveryResponse>('/files/recovery-status');
			return response.data.recovery;
		},
		refetchOnWindowFocus: false,
		retry: 1,
		staleTime: 30_000,
	});
}

export function useRetryFileMutationRecovery() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const response = await apiClient.post<StartupFileMutationRecoveryResponse>('/files/recovery/reconcile');
			return response.data.recovery;
		},
		onSuccess: (recovery) => {
			queryClient.setQueryData(fileMutationRecoveryKeys.startup, recovery);
		},
	});
}
