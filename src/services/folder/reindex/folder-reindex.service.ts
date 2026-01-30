/**
 * @file Servicio estructurado de reindexado de carpetas
 * @description Implementa el flujo completo de reindexado en fases separadas y ordenadas
 *
 * Las fases están extraídas en módulos separados para mejor mantenibilidad.
 * Ver carpeta reindex-phases/ para la implementación de cada fase.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { emitProgress } from '@/lib/server/events.server';
import type { ProcessStatus } from '@/types/folders';
import type { ReindexOptions, ReindexPhaseResult } from './folder-reindex-types';

// Importar fases desde módulos separados
import { phase1_analyzeStructure } from './reindex-phases/phase1-analyze';
import { phase2_checkExistence } from './reindex-phases/phase2-existence';
import { phase3_removeNonExistentFolders } from './reindex-phases/phase3-deletion';
import { phase4_buildSubfolderStructure } from './reindex-phases/phase4-structure';
import { phase5_indexFiles } from './reindex-phases/phase5-indexing';
import { phase6_generateThumbnails } from './reindex-phases/phase6-thumbnails';
import { phase7_extractMetadata } from './reindex-phases/phase7-metadata';
import { phase8_verifyIntegrity } from './reindex-phases/phase8-verification';

// Re-exports para compatibilidad backward
export type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from './folder-reindex-types';

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
			await this.emitProgress('starting', 0, 'Iniciando análisis de carpetas...');
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
				await this.emitProgress('analysis', 12, 'Análisis completado. Verificando existencia...');
			}

			// ===== FASE 2: VERIFICACIÓN DE EXISTENCIA =====
			this.logger.info('🔍 FASE 2: Verificando existencia de carpetas');
			phases.existence = await phase2_checkExistence(analysisResult, options);

			if (options.emitEvents !== false) {
				await this.emitProgress('existence', 25, 'Verificación completada. Limpiando carpetas inexistentes...');
			}

			// ===== FASE 3: ELIMINACIÓN =====
			this.logger.info('🗑️ FASE 3: Eliminando carpetas inexistentes');
			phases.deletion = await phase3_removeNonExistentFolders(analysisResult, options);

			if (options.emitEvents !== false) {
				await this.emitProgress('deletion', 35, 'Limpieza completada. Creando estructura de subcarpetas...');
			}

			// ===== FASE 4: ESTRUCTURA =====
			this.logger.info('🌳 FASE 4: Creando estructura de subcarpetas');
			phases.structure = await phase4_buildSubfolderStructure(analysisResult, options);

			if (options.emitEvents !== false) {
				await this.emitProgress('structure', 45, 'Estructura creada. Iniciando indexado de archivos...');
			}

			// ===== FASE 5: INDEXADO =====
			this.logger.info('📁 FASE 5: Indexado de archivos');
			phases.indexing = await phase5_indexFiles(analysisResult, options);

			if (options.emitEvents !== false) {
				await this.emitProgress('indexing', 60, 'Indexado completado. Generando thumbnails...');
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
				await this.emitProgress('thumbnails', 80, 'Thumbnails generados. Extrayendo metadata...');
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
				await this.emitProgress('metadata', 95, 'Metadata extraída. Verificando integridad...');
			}

			// ===== FASE 8: VERIFICACIÓN =====
			this.logger.info('✅ FASE 8: Verificación final');
			phases.verification = await phase8_verifyIntegrity(analysisResult, options);

			const totalDuration = Date.now() - startTime;
			const success = Object.values(phases).every((phase) => phase.success);

			if (options.emitEvents !== false) {
				await this.emitProgress('completed', 100, 'Reindexado completado exitosamente');
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
				await this.emitProgress('error', 0, `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
			}

			throw error;
		}
	}

	/**
	 * Emite eventos de progreso si está habilitado
	 * 🔧 FIX: Emite 'folder:reindexAll:progress' para eventos globales
	 */
	private async emitProgress(phase: string, progress: number, message: string): Promise<void> {
		try {
			// 🎯 Usar evento correcto para reindexado global
			await emitProgress('folder:reindexAll:progress', {
				isProcessing: progress < 100,
				folderId: undefined,
				phase,
				progress,
				filesProcessed: 0,
				totalFiles: 0,
				message,
				timestamp: Date.now(),
			} as ProcessStatus);
		} catch (error) {
			// Silencioso - no bloquear el proceso por errores de eventos
		}
	}
}
