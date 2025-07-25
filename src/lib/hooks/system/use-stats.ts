import { useQuery, useQueryClient } from '@tanstack/react-query';
// Migración: se eliminan las importaciones de servicios y se usan clientes de API
import {
	getImageStatsFromApi,
	getSystemStatsFromApi,
	incrementImageDownloadInApi,
	incrementImageViewInApi,
} from '@/lib/api/client/stats.client';
import { serverLogger } from '@/lib/logger';
import type { ImageStatistics } from '@/types/entities/image';
import type { GeneralStats } from '@/types/stats';
import { transformSystemStatsToGeneralStats } from '@/types/stats';

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
				const systemStats = await getSystemStatsFromApi();
				return transformSystemStatsToGeneralStats(systemStats);
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
