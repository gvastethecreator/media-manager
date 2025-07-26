import { useQuery, useQueryClient } from '@tanstack/react-query';
// Migración: se eliminan las importaciones de servicios y se usan clientes de API
import {
	getImageStatsFromApi,
	getSystemStatsFromApi,
	incrementImageDownloadInApi,
	incrementImageViewInApi,
} from '@/lib/api/client/stats.client';
import type { SystemStats as ApiSystemStats } from '@/lib/api/system';
import { serverLogger } from '@/lib/logger';
import type { ImageStatistics } from '@/types/entities/image';
import type { GeneralStats, SystemStats } from '@/types/stats';
import { type SystemStats as TypesSystemStats, transformSystemStatsToGeneralStats } from '@/types/stats';

const statsLogger = serverLogger.withContext('StatsHook');

export const STATS_QUERY_KEYS = {
	all: ['stats'] as const,
	general: () => [...STATS_QUERY_KEYS.all, 'general'] as const,
	image: (imageId: string) => [...STATS_QUERY_KEYS.all, 'image', imageId] as const,
};

/**
 * Hook para obtener estadísticas generales del sistema
 * ✅ MIGRADO A DRIZZLE
 */
export function useStats() {
	const queryClient = useQueryClient();

	const {
		data: stats,
		error,
		isLoading,
		isError,
	} = useQuery<GeneralStats>({
		queryKey: ['general-stats'],
		queryFn: async () => {
			try {
				statsLogger.debug('📊 Obteniendo estadísticas del sistema...');
				const apiStats = (await getSystemStatsFromApi()) as ApiSystemStats;
				statsLogger.debug('✅ Estadísticas obtenidas', { apiStats });

				// Crear SystemStats compatible con la función de transformación
				const systemStats: TypesSystemStats = {
					images: {
						count: apiStats.totalImages,
						recentlyAdded: 0,
						recentlyUpdated: 0,
						withImages: 0,
						withoutImages: 0,
					},
					tags: { count: apiStats.totalTags, recentlyAdded: 0, recentlyUpdated: 0, withImages: 0, withoutImages: 0 },
					collections: {
						count: apiStats.totalCollections,
						recentlyAdded: 0,
						recentlyUpdated: 0,
						withImages: 0,
						withoutImages: 0,
					},
					albums: {
						count: apiStats.totalAlbums,
						recentlyAdded: 0,
						recentlyUpdated: 0,
						withImages: 0,
						withoutImages: 0,
					},
					characters: {
						count: apiStats.totalCharacters,
						recentlyAdded: 0,
						recentlyUpdated: 0,
						withImages: 0,
						withoutImages: 0,
					},
					places: { count: 0, recentlyAdded: 0, recentlyUpdated: 0, withImages: 0, withoutImages: 0 },
					worldItems: { count: 0, recentlyAdded: 0, recentlyUpdated: 0, withImages: 0, withoutImages: 0 },
					concepts: { count: 0, recentlyAdded: 0, recentlyUpdated: 0, withImages: 0, withoutImages: 0 },
					prompts: { count: 0, recentlyAdded: 0, recentlyUpdated: 0, withImages: 0, withoutImages: 0 },
					notes: { count: 0, recentlyAdded: 0, recentlyUpdated: 0, withImages: 0, withoutImages: 0 },
					groups: { count: 0, recentlyAdded: 0, recentlyUpdated: 0, withImages: 0, withoutImages: 0 },
					properties: { count: 0, recentlyAdded: 0, recentlyUpdated: 0, withImages: 0, withoutImages: 0 },
					wildcards: { count: 0, recentlyAdded: 0, recentlyUpdated: 0, withImages: 0, withoutImages: 0 },
					thumbnails: {
						total: 0,
						processed: 0,
						errors: 0,
						totalSize: apiStats.storageUsed,
						totalFiles: apiStats.totalImages,
						pending: 0,
					},
				};

				// Transformar SystemStats a GeneralStats
				const generalStats = transformSystemStatsToGeneralStats(systemStats);
				statsLogger.debug('🔄 Estadísticas transformadas', { generalStats });

				return generalStats;
			} catch (error) {
				statsLogger.error('Error al obtener estadísticas', { error });
				throw error;
			}
		},
		staleTime: 1000 * 60, // 1 minuto
	});

	const refreshStats = () => {
		queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEYS.general() });
	};

	return {
		stats,
		error,
		isLoading,
		isError,
		refreshStats,
	};
}

/**
 * Hook para obtener estadísticas de una imagen específica
 * ✅ MIGRADO A DRIZZLE
 */
export function useImageStats(imageId: string) {
	const queryClient = useQueryClient();

	const {
		data: stats,
		error,
		isLoading,
		isError,
	} = useQuery({
		queryKey: STATS_QUERY_KEYS.image(imageId),
		queryFn: async () => {
			try {
				return await getImageStatsFromApi(imageId);
			} catch (error) {
				statsLogger.error('Error al obtener estadísticas de imagen', {
					error,
					imageId,
				});
				throw error;
			}
		},
	});

	const incrementView = async () => {
		try {
			const updatedStats = await incrementImageViewInApi(imageId);
			queryClient.setQueryData(STATS_QUERY_KEYS.image(imageId), updatedStats);
			queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEYS.general() });
		} catch (error) {
			statsLogger.error('Error al incrementar vistas', { error, imageId });
			throw error;
		}
	};

	const incrementDownload = async () => {
		try {
			const updatedStats = await incrementImageDownloadInApi(imageId);
			queryClient.setQueryData(STATS_QUERY_KEYS.image(imageId), updatedStats);
			queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEYS.general() });
		} catch (error) {
			statsLogger.error('Error al incrementar descargas', { error, imageId });
			throw error;
		}
	};

	return {
		stats,
		error,
		isLoading,
		isError,
		incrementView,
		incrementDownload,
	};
}
