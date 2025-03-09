'use client';

import { logger } from '@/lib/logger';
import { statsEventEmitter } from '@/services/stats.service';
import { useEffect } from 'react';

const statsLogger = logger.withContext('StatsHook');

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
