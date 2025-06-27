'use client';

import { useEffect } from 'react';
import { serverLogger } from '@/lib/logger/server-logger';
import { statsEventEmitter } from '@/services/stats';

const statsLogger = serverLogger.withContext('StatsHook');

export function useStatsService() {
	useEffect(() => {
		try {
			statsLogger.info('🔄 Inicializando servicio de estadísticas');
			statsEventEmitter.emit('init');
		} catch (error) {
			statsLogger.error('❌ Error al inicializar servicio de estadísticas:', error);
		}
	}, []);
}
