'use client';

import type { GeneralStats } from '@/app/actions/stats/stats.actions';
import { getSystemStats } from '@/app/actions/stats/stats.actions';
import { MOCK_STATS } from '@/lib/mock/stats.mock';

// Caché local en memoria para reducir llamadas
let cachedStats: GeneralStats | null = null;
let lastFetchTime = 0;
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos

// Función para obtener estadísticas de manera optimizada
export async function getStatsData(): Promise<GeneralStats> {
  const now = Date.now();

  // Si tenemos datos en caché y son recientes, usarlos
  if (cachedStats && (now - lastFetchTime) < CACHE_EXPIRATION) {
    return Promise.resolve(cachedStats);
  }

  try {
    // Intentar obtener datos del servidor
    const stats = await getSystemStats();

    // Actualizar caché y timestamp
    if (stats) {
      cachedStats = stats;
      lastFetchTime = now;
      return stats;
    }

    // Si no hay datos pero tenemos caché anterior, usar caché vieja como fallback
    if (cachedStats) {
      return cachedStats;
    }

    // Si no hay datos en absoluto, usar datos simulados
    return MOCK_STATS;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);

    // En caso de error, intentar usar la caché existente
    if (cachedStats) {
      return cachedStats;
    }

    // Si todo falla, usar datos simulados
    return MOCK_STATS;
  }
}