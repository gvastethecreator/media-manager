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
			const response = (await apiClient.get('/api/stats/folders')) as { data: FolderStats };

			// Si la API retorna null, usar valores por defecto
			if (!response.data) {
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
					// directoryCount se mapea a directChildren en FolderStatistics
					lastScanned: new Date().toISOString(),
					// Propiedades adicionales requeridas por FolderStatistics
					hierarchyDepth: 0,
					totalDescendants: 0,
					directChildren: 0,
					contentDiversity: 0,
					organizationScore: 0,
					totalItems: 0,
					accessFrequency: 0,
					lastActivity: null,
					imageCount: 0,
					videoCount: 0,
					noteCount: 0,
					documentCount: 0,
					folderCount: 0,
					averageFileSize: 0,
					largestFile: 0,
					hasConsistentNaming: false,
					hasDeepHierarchy: false,
					isWellOrganized: false,
					breadcrumbs: [],
					fullPath: '',
					relativePath: '',
					autoTags: [],
					qualityGrade: 'D' as const,
					totalRelations: 0,
				};
			}

			return response.data;
		},
		refetchInterval: 30000, // Actualizar cada 30 segundos
		staleTime: 10000, // Considerar datos obsoletos después de 10 segundos
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}
