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
			// El backend retorna el objeto de estadísticas directamente
			const response = (await apiClient.get('/api/stats/folders')) as FolderStats | null;

			// Si la API retorna null/undefined, usar valores por defecto
			if (!response) {
				return {
					totalFolders: 0,
					totalFiles: 0,
					totalImages: 0,
					totalVideos: 0,
					totalAudio: 0,
					totalDocuments: 0,
					totalOthers: 0,
					totalSize: 0,
					formattedSize: '0 B',
					lastScanned: new Date().toISOString(),
				};
			}

			return response;
		},
		refetchInterval: 60_000, // Optimización: reducir de 30s a 60s para menos requests
		staleTime: 30_000, // Optimización: aumentar de 10s a 30s para más estabilidad
		retry: 2, // Optimización: reducir intentos de 3 a 2
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15_000), // Reducir delay máximo
	});
}
