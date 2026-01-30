/**
 * 📊 Exportaciones centralizadas del servicio Stats
 * @module services/stats
 */

// Exportar desde el servicio optimizado
export {
	OptimizedStatsService,
	optimizedStatsUtils,
} from './optimized-stats.service';

// Exportar tipos
export type {
	StatsEvents,
	StatsEventType,
	StatsUpdateEvent,
} from './stats.service';
// Exportar desde el servicio legacy (stats.service.ts contiene STATS_EVENTS y statsEventEmitter)
export {
	STATS_EVENTS,
	StatsService,
	statsEventEmitter,
	statsService,
} from './stats.service';
