/**
 * 📊 Exportaciones centralizadas del servicio Stats
 * @module services/stats
 */

// Exportar desde el servicio legacy (stats.service.ts contiene STATS_EVENTS y statsEventEmitter)
export {
	STATS_EVENTS,
	statsEventEmitter,
	StatsService,
	statsService,
} from './stats.service';

// Exportar tipos
export type {
	StatsEventType,
	StatsEvents,
	StatsUpdateEvent,
} from './stats.service';

// Exportar desde el servicio optimizado
export {
	OptimizedStatsService,
	optimizedStatsUtils,
} from './optimized-stats.service';
