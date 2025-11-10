/**
 * @file Servicio estructurado de reindexado de carpetas
 * @description Implementa el flujo completo de reindexado en fases separadas y ordenadas
 * @updated 2025-11-10 - ✅ MODULARIZADO EN SUBDIRECTORIOS
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from './folder-reindex-types';

// Re-exports para compatibilidad backward
export type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from './folder-reindex-types';

// Importar todas las fases
import {
	phase1_analyzeStructure,
	phase2_checkExistence,
	phase3_removeNonExistentFolders,
	phase4_buildSubfolderStructure,
	phase5_indexFiles,
	phase6_generateThumbnails,
	phase7_extractMetadata,
	phase8_verifyIntegrity,
} from './reindex/phases';

// Importar utilidades
import { emitReindexProgress } from './reindex/utils/reindex-utils';

export class FolderReindexService {
	private static instance: FolderReindexService;
	private readonly logger = serverLogger.withContext('FolderReindexService');

	static getInstance(): FolderReindexService {
		if (!FolderReindexService.instance) {
			FolderReindexService.instance = new FolderReindexService();
		}
		return FolderReindexService.instance;
	}

	/**
	 * 🚀 FLUJO COMPLETO DE REINDEXADO ESTRUCTURADO
	 * Sigue el orden exacto especificado:
	 * 1. Análisis → 2. Existencia → 3. Eliminación → 4. Estructura → 5. Indexado → 6. Thumbnails → 7. Metadata → 8. Verificación
	 */
	async executeStructuredReindex(options: ReindexOptions = {}): Promise<{
		success: boolean;
		phases: Record<string, ReindexPhaseResult>;
		totalDuration: number;
		summary: {
			foldersProcessed: number;
			filesIndexed: number;
			thumbnailsGenerated: number;
			metadataExtracted: number;
		};
	}> {
		const startTime = Date.now();
		const phases: Record<string, ReindexPhaseResult> = {};

		this.logger.info('🚀 Iniciando reindexado estructurado', options);

		if (options.emitEvents !== false) {
			await emitReindexProgress('starting', 0, 'Iniciando análisis de carpetas...');
		}

		try {
			// ===== FASE 1: ANÁLISIS =====
			this.logger.info('📊 FASE 1: Analizando carpetas y archivos');
			const analysisResult = await phase1_analyzeStructure(options);
			phases.analysis = {
				success: true,
				processed: analysisResult.totalFolders,
				failed: 0,
				errors: [],
				duration: 0,
			};

			if (options.emitEvents !== false) {
				await emitReindexProgress('analysis', 12, 'Análisis completado. Verificando existencia...');
			}

			// ===== FASE 2: VERIFICACIÓN DE EXISTENCIA =====
			this.logger.info('🔍 FASE 2: Verificando existencia de carpetas');
			phases.existence = await phase2_checkExistence(analysisResult, options);

			if (options.emitEvents !== false) {
				await emitReindexProgress('existence', 25, 'Verificación completada. Limpiando carpetas inexistentes...');
			}

			// ===== FASE 3: ELIMINACIÓN =====
			this.logger.info('🗑️ FASE 3: Eliminando carpetas inexistentes');
			phases.deletion = await phase3_removeNonExistentFolders(analysisResult, options);

			if (options.emitEvents !== false) {
				await emitReindexProgress('deletion', 35, 'Limpieza completada. Creando estructura de subcarpetas...');
			}

			// ===== FASE 4: ESTRUCTURA =====
			this.logger.info('🌳 FASE 4: Creando estructura de subcarpetas');
			phases.structure = await phase4_buildSubfolderStructure(analysisResult, options);

			if (options.emitEvents !== false) {
				await emitReindexProgress('structure', 45, 'Estructura creada. Iniciando indexado de archivos...');
			}

			// ===== FASE 5: INDEXADO =====
			this.logger.info('📁 FASE 5: Indexado de archivos');
			phases.indexing = await phase5_indexFiles(analysisResult, options);

			if (options.emitEvents !== false) {
				await emitReindexProgress('indexing', 60, 'Indexado completado. Generando thumbnails...');
			}

			// ===== FASE 6: THUMBNAILS =====
			let thumbnailsResult: ReindexPhaseResult = { success: true, processed: 0, failed: 0, errors: [], duration: 0 };
			if (options.skipThumbnails) {
				this.logger.info('⏭️ FASE 6: Saltando generación de thumbnails (skipThumbnails=true)');
			} else {
				this.logger.info('🖼️ FASE 6: Generación de thumbnails');
				thumbnailsResult = await phase6_generateThumbnails(analysisResult, options);
			}
			phases.thumbnails = thumbnailsResult;

			if (options.emitEvents !== false) {
				await emitReindexProgress('thumbnails', 80, 'Thumbnails generados. Extrayendo metadata...');
			}

			// ===== FASE 7: METADATA =====
			let metadataResult: ReindexPhaseResult = { success: true, processed: 0, failed: 0, errors: [], duration: 0 };
			if (options.skipMetadata) {
				this.logger.info('⏭️ FASE 7: Saltando extracción de metadata (skipMetadata=true)');
			} else {
				this.logger.info('📊 FASE 7: Extracción de metadata');
				metadataResult = await phase7_extractMetadata(analysisResult, options);
			}
			phases.metadata = metadataResult;

			if (options.emitEvents !== false) {
				await emitReindexProgress('metadata', 95, 'Metadata extraída. Verificando integridad...');
			}

			// ===== FASE 8: VERIFICACIÓN =====
			this.logger.info('✅ FASE 8: Verificación final');
			phases.verification = await phase8_verifyIntegrity(analysisResult, options);

			const totalDuration = Date.now() - startTime;
			const success = Object.values(phases).every((phase) => phase.success);

			if (options.emitEvents !== false) {
				await emitReindexProgress('completed', 100, 'Reindexado completado exitosamente');
			}

			const summary = {
				foldersProcessed: analysisResult.totalFolders,
				filesIndexed: phases.indexing.processed,
				thumbnailsGenerated: phases.thumbnails.processed,
				metadataExtracted: phases.metadata.processed,
			};

			this.logger.info('✅ Reindexado estructurado completado', {
				success,
				totalDuration,
				summary,
			});

			return {
				success,
				phases,
				totalDuration,
				summary,
			};
		} catch (error) {
			this.logger.error('❌ Error durante reindexado estructurado', error);

			if (options.emitEvents !== false) {
				await emitReindexProgress('error', 0, `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
			}

			throw error;
		}
	}
}
