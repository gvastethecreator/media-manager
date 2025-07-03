import { useSystemStats } from '@/lib/api/system';
import { MOCK_STATS } from '@/lib/mock/stats.mock';
import type { SystemStats } from '@/lib/api/system';

// Caché local en memoria para reducir llamadas
const cachedStats: SystemStats | null = null;
const lastFetchTime = 0;
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos

// Función para obtener estadísticas de manera optimizada
export async function getStatsData(): Promise<SystemStats> {
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

		// Si no hay datos en absoluto, usar datos simulados
		return MOCK_STATS as SystemStats;
	} catch (error) {
		console.error('Error al obtener estadísticas:', error);

		// En caso de error, intentar usar la caché existente
		if (cachedStats) {
			return cachedStats;
		}

		// Si todo falla, usar datos simulados
		return MOCK_STATS as SystemStats;
	}
}

// Hook recomendado para usar en componentes React
export { useSystemStats };
