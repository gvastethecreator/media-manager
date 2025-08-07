import { QueryClient } from '@tanstack/react-query';
import { serverLogger } from '@/lib/logger/server-logger';

const _queryLogger = serverLogger.withContext('ReactQuery');

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60, // 1 minuto
			gcTime: 1000 * 60 * 5, // 5 minutos
			retry: 2,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
		},
		mutations: {
			retry: 1,
		},
	},
});
