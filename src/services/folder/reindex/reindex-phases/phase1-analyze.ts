/**
 * @file FASE 1: Análisis de estructura
 * @description Analiza todas las carpetas y archivos para planificar el reindexado
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ReindexAnalysisResult, ReindexOptions } from '../folder-reindex-types';

const logger = serverLogger.withContext('ReindexPhase1');

/**
 * FASE 1: 📊 ANÁLISIS DE ESTRUCTURA
 * Analiza todas las carpetas y archivos para planificar el reindexado
 */
export async function phase1_analyzeStructure(options: ReindexOptions): Promise<ReindexAnalysisResult> {
	logger.info('📊 Iniciando análisis de estructura');

	try {
		const { db } = await import('@/lib/drizzle');
		const { folders } = await import('@/lib/drizzle/schema/index');
		const { eq } = await import('drizzle-orm');

		// Si se especifica una carpeta específica, solo analizar esa
		let foldersToAnalyze: Array<{ id: string; path: string; name: string }>;
		if (options.folderId) {
			foldersToAnalyze = await db
				.select({ id: folders.id, path: folders.path, name: folders.name })
				.from(folders)
				.where(eq(folders.id, options.folderId));
		} else {
			foldersToAnalyze = await db.select({ id: folders.id, path: folders.path, name: folders.name }).from(folders);
		}

		// Verificar existencia física de cada carpeta
		const { folderExists } = await import('@/lib/filesystem/folder-scanner');
		const existingFolders = [];
		const missingFolders = [];

		for (const folder of foldersToAnalyze) {
			const exists = await folderExists(folder.path);
			if (exists) {
				existingFolders.push({ ...folder, exists: true });
			} else {
				missingFolders.push(folder);
			}
		}

		// Buscar nuevas subcarpetas en las carpetas existentes
		const newSubfolders = [];
		if (options.includeSubfolders !== false) {
			for (const folder of existingFolders) {
				try {
					const { scanFolder } = await import('@/lib/filesystem/folder-scanner');
					const scan = await scanFolder(folder.path, {
						recursive: true,
						includeHidden: options.includeHidden,
						limit: 0,
						maxDepth: 99,
					});

					// Agregar subcarpetas encontradas que no estén en BD
					for (const subfolder of scan.directories || []) {
						const existsInDB = foldersToAnalyze.some((f) => f.path === subfolder.path);
						if (!existsInDB) {
							newSubfolders.push({
								path: subfolder.path,
								parentId: folder.id,
								name: subfolder.name,
							});
						}
					}
				} catch (error) {
					logger.warn(`Error escaneando subcarpetas de ${folder.path}:`, error);
				}
			}
		}

		// Calcular total de archivos estimado (RECURSIVO para incluir archivos en subcarpetas)
		let totalFiles = 0;
		for (const folder of existingFolders) {
			try {
				const { scanFolder } = await import('@/lib/filesystem/folder-scanner');
				const scan = await scanFolder(folder.path, {
					recursive: true,
					includeHidden: options.includeHidden,
					limit: 0,
					maxDepth: 99,
				});
				totalFiles += scan.files?.length || 0;
			} catch (error) {
				logger.warn(`Error contando archivos en ${folder.path}:`, error);
			}
		}

		const estimatedDuration = estimateProcessingTime(totalFiles, existingFolders.length);

		logger.info('📊 Análisis completado', {
			totalFolders: foldersToAnalyze.length,
			existingFolders: existingFolders.length,
			missingFolders: missingFolders.length,
			newSubfolders: newSubfolders.length,
			totalFiles,
			estimatedDuration,
		});

		return {
			totalFolders: foldersToAnalyze.length,
			existingFolders,
			missingFolders,
			newSubfolders,
			totalFiles,
			estimatedDuration,
		};
	} catch (error) {
		logger.error('❌ Error en análisis de estructura:', error);
		throw error;
	}
}

/**
 * Estima el tiempo de procesamiento basado en la cantidad de archivos y carpetas
 */
function estimateProcessingTime(totalFiles: number, totalFolders: number): number {
	// Estimación basada en benchmarks típicos:
	// - ~100ms por archivo (indexado + thumbnail + metadata)
	// - ~50ms por carpeta (análisis + estructura)
	return totalFiles * 100 + totalFolders * 50;
}
