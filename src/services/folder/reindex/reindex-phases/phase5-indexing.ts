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

				const { getFileSystemSyncAdapter } = await import('@/lib/filesystem/sync-adapter');
				const sync = getFileSystemSyncAdapter();

				let lastEmitTime = 0;
				let folderProcessed = 0;
				let folderSuccessful = 0;

				const newFiles = await sync.detectNewFiles(folder.id);
				const totalFiles = newFiles.length;

				for (let index = 0; index < newFiles.length; index++) {
					const currentFile = newFiles[index];
					const result = await sync.syncFile(currentFile.path, folder.id);
					folderProcessed++;
					if (result.action !== 'skipped') {
						folderSuccessful++;
					}

					if (options.emitEvents !== false) {
						const now = Date.now();
						if (now - lastEmitTime >= 200 || index + 1 === totalFiles || index === 0) {
							lastEmitTime = now;
							const fileName = currentFile.path.split(/[\\/]/).pop() || currentFile.path;
							await emitProgress('folder:progress', {
								isProcessing: true,
								folderId: folder.id,
								phase: 'processing',
								progress: totalFiles > 0 ? Math.round(((index + 1) / totalFiles) * 100) : 100,
								filesProcessed: index + 1,
								totalFiles,
								message: `   └── [${index + 1}/${totalFiles}] ${fileName}`,
								timestamp: now,
							});
						}
					}
				}

				const removedCount = await sync.cleanOrphanRecords(folder.id);

				processed += folderProcessed;
				successful += Math.max(0, folderSuccessful - removedCount);

				// Recalcular y persistir estadísticas de carpeta
				try {
					const { recomputeAndPersistFolderAggregates } = await import('@/lib/filesystem/folder-stats.aggregates');
					await recomputeAndPersistFolderAggregates(folder.id);
					logger.debug(`📊 Estadísticas actualizadas para: ${folder.name}`);
				} catch (statsError) {
					logger.warn(`⚠️ No se pudieron actualizar estadísticas para ${folder.name}:`, statsError);
				}

				logger.debug(
					`✅ Carpeta indexada: ${folder.name} (${folderProcessed} archivos procesados, ${removedCount} huérfanos limpiados)`
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
