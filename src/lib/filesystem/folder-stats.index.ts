/**
 * 📊 FOLDER STATS - EXPORTS CONSOLIDADOS
 *
 * Barrel file para estadísticas de carpetas
 */

// Funciones principales (desde el archivo principal)
export {
	processFilesWithProgress,
	reindexAllFoldersThreePasses,
	updateAllFolderStats,
	updateFolderStats,
} from './folder-stats';
// Cálculos agregados
export { getFolderStats, recomputeAndPersistFolderAggregates } from './folder-stats.aggregates';
// Tipos
export type {
	AggregateResult,
	FileEntityMapper,
	ProcessOptions,
	ProgressEmitter,
	SimpleStats,
} from './folder-stats.types';
// Utilidades
export { computeOverallProgress, mapWithConcurrency, safeEmitProgress } from './folder-stats.utils';
