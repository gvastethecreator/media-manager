import type { SystemStats as ApiSystemStats } from '@/lib/api/system';
import { useSystemStats } from '@/lib/api/system';
import { MOCK_STATS } from '@/lib/mock/stats.mock';
import { transformSystemStatsToGeneralStats, createEmptyGeneralStats, type GeneralStats } from '@/types/stats';

// Caché local en memoria para reducir llamadas
const cachedStats: GeneralStats | null = null;
const lastFetchTime = 0;
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos

// Función de transformación específica para ApiSystemStats
function transformApiSystemStatsToGeneralStats(apiStats: ApiSystemStats): GeneralStats {
	return {
		totalImages: apiStats.totalImages,
		totalFolders: apiStats.totalFolders,
		totalCollections: apiStats.totalCollections,
		totalTags: apiStats.totalTags,
		totalAlbums: apiStats.totalAlbums,
		totalCharacters: apiStats.totalCharacters,
		totalPlaces: 0, // No disponible en ApiSystemStats
		totalWorldItems: 0, // No disponible en ApiSystemStats
		totalFavorites: 0, // Se debe calcular por separado
		totalViews: 0, // Se debe calcular por separado
		totalDownloads: 0, // Se debe calcular por separado
		totalSize: apiStats.storageUsed,
		totalActivities: 0, // Se debe calcular por separado
		// Campos opcionales
		totalDocuments: 0,
		totalAudio: apiStats.totalAudio,
		totalJsonFiles: 0,
		totalWorkflows: 0,
		totalFile3D: 0,
		topTags: [
			{ id: '1', name: 'landscape', color: '#10b981', count: 45 },
			{ id: '2', name: 'portrait', color: '#3b82f6', count: 32 },
			{ id: '3', name: 'nature', color: '#22c55e', count: 28 }
		],
		recentActivity: [
			{
				id: '1',
				type: 'upload',
				description: 'Nueva imagen subida',
				createdAt: new Date(Date.now() - 1000 * 60 * 5),
				image: {
					id: 'img1',
					name: 'landscape.jpg',
					thumbnail: null
				}
			},
			{
				id: '2',
				type: 'tag',
				description: 'Etiqueta añadida',
				createdAt: new Date(Date.now() - 1000 * 60 * 15),
				image: null
			}
		],
	};
}

// Función para obtener estadísticas de manera optimizada
export async function getStatsData(): Promise<GeneralStats> {
	const now = Date.now();

	// Si tenemos datos en caché y son recientes, usarlos
	if (cachedStats && now - lastFetchTime < CACHE_EXPIRATION) {
		return Promise.resolve(cachedStats);
	}

	try {
		// Para usar en componentes React, se debe usar el hook useSystemStats()
		// Esta función se mantiene para compatibilidad legacy
		console.warn('getStatsData es legacy, usar useSystemStats() en componentes React');

		// Si no hay datos pero tenemos caché anterior, usar caché vieja como fallback
		if (cachedStats) {
			return cachedStats;
		}

		// Si no hay datos en absoluto, transformar datos simulados
		const systemStats = MOCK_STATS as ApiSystemStats;
		return transformApiSystemStatsToGeneralStats(systemStats);
	} catch (error) {
		console.error('Error al obtener estadísticas:', error);

		// En caso de error, intentar usar la caché existente
		if (cachedStats) {
			return cachedStats;
		}

		// Si todo falla, usar datos vacíos
		return createEmptyGeneralStats();
	}
}

// Hook recomendado para usar en componentes React
export { useSystemStats };
