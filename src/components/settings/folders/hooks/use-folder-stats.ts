import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { FolderStats } from '@/types/folders';

/**
 * Hook para obtener estadísticas generales de carpetas
 */
export function useFolderStats() {
	return useQuery({
		queryKey: ['folder-stats'],
		queryFn: async (): Promise<FolderStats> => {
			const response = await apiClient.get('/api/stats/folders');
			return response.data;
		},
		refetchInterval: 30000, // Actualizar cada 30 segundos
		staleTime: 10000, // Considerar datos obsoletos después de 10 segundos
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}