/**
 * @file Exportaciones del servicio de Folder
 * @module services/folder
 * @description Punto de entrada para el servicio de carpetas - consolidado
 */

// =================================================================================
// OPERACIONES CRUD BÁSICAS (Cliente)
// =================================================================================
export * from './folder-api.service';

// =================================================================================
// ESTADÍSTICAS Y CONTEOS (SQL Directo)
// =================================================================================
export * from './folder-stats.service';

// =================================================================================
// REINDEXACIÓN COMPLETA
// =================================================================================
export { FolderReindexService } from './reindex/folder-reindex.service';
export type {
	ReindexAnalysisResult,
	ReindexOptions,
	ReindexPhaseResult,
} from './reindex/folder-reindex-types';

// =================================================================================
// REINDEXACIÓN INCREMENTAL (Effect-TS)
// =================================================================================
export { ReindexIncrementalService, ReindexIncrementalServiceLive } from './reindex/reindex-incremental.service.effect';
export type { ReindexIncrementalError } from './reindex/reindex-incremental.service.effect';
export type {
	IncrementalReindexOptions,
	IncrementalReindexStats,
} from './reindex/reindex-incremental-types';

// =================================================================================
// FASES DE REINDEXADO (Para uso avanzado)
// =================================================================================
export {
	phase1_analyzeStructure,
	phase2_checkExistence,
	phase3_removeNonExistentFolders,
	phase4_buildSubfolderStructure,
	phase5_indexFiles,
	phase6_generateThumbnails,
	phase7_extractMetadata,
	phase8_verifyIntegrity,
} from './reindex/reindex-phases';
