/**
 * @file FASE 5: Indexado de archivos
 * @description Indexa todos los archivos en las carpetas existentes
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { emitProgress } from '@/lib/server/events.server';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from '../folder-reindex-types';

const logger = serverLogger.withContext('ReindexPhase5');

/**
 * FASE 5: 📁 INDEXADO DE ARCHIVOS
 * Indexa todos los archivos en las carpetas existentes
 */
export async function phase5_indexFiles(
	analysisResult: ReindexAnalysisResult,
	options: ReindexOptions
): Promise<ReindexPhaseResult> {
	const startTime = Date.now();
	logger.info('📁 Iniciando indexado de archivos');

	const errors: string[] = [];
	let processed = 0;
	let successful = 0;

	try {
		const totalFolders = analysisResult.existingFolders.length;

		// Procesar cada carpeta existente
		for (let i = 0; i < analysisResult.existingFolders.length; i++) {
			const folder = analysisResult.existingFolders[i];
			try {
				logger.debug(`📁 Indexando archivos en: ${folder.path}`);

				// Emitir evento de progreso para esta carpeta
				if (options.emitEvents !== false) {
					await emitProgress('folder:progress', {
						isProcessing: true,
						folderId: folder.id,
						phase: 'processing',
						progress: Math.round(((i + 1) / totalFolders) * 100),
						filesProcessed: i + 1,
						totalFiles: totalFolders,
						message: `📁 Indexando: ${folder.name} [${i + 1}/${totalFolders}]`,
						timestamp: Date.now(),
					});
				}

				const { FileSyncService } = await import('@/lib/filesystem/file-sync.service');
				const fileSyncService = FileSyncService.getInstance();

				let lastEmitTime = 0;

				// Sincronizar archivos de la carpeta (esto indexa los archivos)
				const syncResult = await fileSyncService.syncFolderFiles(folder.id, {
					dryRun: false,
					// Callback para reportar progreso de archivos individuales
					onProgress: async (filesProcessed, totalFiles, currentFile) => {
						if (options.emitEvents !== false) {
							const now = Date.now();
							// Emitir progreso máximo cada 200ms para evitar spam SSE en frontend
							if (now - lastEmitTime >= 200 || filesProcessed === totalFiles || filesProcessed === 0) {
								lastEmitTime = now;
								const fileName = currentFile.split(/[\\/]/).pop() || currentFile;
								await emitProgress('folder:progress', {
									isProcessing: true,
									folderId: folder.id,
									phase: 'processing',
									progress: Math.round((filesProcessed / totalFiles) * 100),
									filesProcessed,
									totalFiles,
									message: `   └── [${filesProcessed}/${totalFiles}] ${fileName}`,
									timestamp: now,
								});
							}
						}
					},
				});

				processed += syncResult.stats.totalChecked;
				successful +=
					syncResult.stats.newFilesFound + syncResult.stats.totalChecked - syncResult.stats.filesRemoved || 0;
				errors.push(...(syncResult.errors || []));

				// Recalcular y persistir estadísticas de carpeta
				try {
					const { recomputeAndPersistFolderAggregates } = await import('@/lib/filesystem/folder-stats.aggregates');
					await recomputeAndPersistFolderAggregates(folder.id);
					logger.debug(`📊 Estadísticas actualizadas para: ${folder.name}`);
				} catch (statsError) {
					logger.warn(`⚠️ No se pudieron actualizar estadísticas para ${folder.name}:`, statsError);
				}

				logger.debug(
					`✅ Carpeta indexada: ${folder.name} (${syncResult.stats.totalChecked} archivos verificados, ${syncResult.stats.newFilesFound} nuevos)`
				);
			} catch (error) {
				const errorMsg = `Error indexando carpeta ${folder.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
				errors.push(errorMsg);
				logger.error(errorMsg);
			}
		}

		logger.info('✅ Indexado de archivos completado', {
			procesados: processed,
			exitosos: successful,
			errores: errors.length,
		});

		return {
			success: errors.length === 0,
			processed: successful,
			failed: processed - successful,
			errors,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		logger.error('❌ Error en indexado de archivos:', error);
		return {
			success: false,
			processed,
			failed: analysisResult.totalFiles - processed,
			errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
			duration: Date.now() - startTime,
		};
	}
}
