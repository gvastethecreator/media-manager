'use client';

import { useEffect } from 'react';
import { serverLogger } from '@/lib/logger/server-logger';
// Migración: se elimina el uso de statsEventEmitter del lado cliente
import { invalidateStatsInApi } from '@/lib/api/client/stats.client';

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
