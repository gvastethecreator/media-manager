'use client';

import { useEffect } from 'react';
// Migración: se elimina el uso de statsEventEmitter del lado cliente
import { invalidateStatsInApi } from '@/lib/api/client/stats.client';
import { serverLogger } from '@/lib/logger/server-logger';

const statsLogger = serverLogger.withContext('StatsHook');

export function useStatsService() {
	useEffect(() => {
		(async () => {
			try {
				statsLogger.info('🔄 Inicializando estadísticas desde API');
				await invalidateStatsInApi();
			} catch (error) {
				statsLogger.error('❌ Error al inicializar estadísticas:', error);
			}
		})();
	}, []);
}
