import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger/logger';

const _queryLogger = logger.withContext('ReactQuery');

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60, // 1 minuto
			gcTime: 1000 * 60 * 5, // 5 minutos
			retry: 2,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
		mutations: {
			retry: 1,
		},
	},
});
