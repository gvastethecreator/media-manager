import { QueryClient } from '@tanstack/react-query';
import { shouldRetryApiError } from '@/lib/api/client';
import { serverLogger } from '@/lib/logger/server-logger';

const _queryLogger = serverLogger.withContext('ReactQuery');

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60, // 1 minuto
			gcTime: 1000 * 60 * 5, // 5 minutos
			retry: (failureCount, error) => shouldRetryApiError(failureCount, error, 2),
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
		},
		mutations: {
			// A mutation response can be lost after the server commits. Keep every
			// mutation single-shot unless its own endpoint defines durable replay.
			retry: false,
		},
	},
});
