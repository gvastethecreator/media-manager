/**
 * @file FASE 4: Construcción de estructura de subcarpetas
 * @description Crea las subcarpetas encontradas en el sistema de archivos
 */

import { dirname, resolve } from 'node:path';
import { serverLogger } from '@/lib/logger/server-logger';
import { normalizeFolderName } from '@/lib/utils/folder-id-generator';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from '../folder-reindex-types';

const logger = serverLogger.withContext('ReindexPhase4');

/**
 * FASE 4: 🌳 CONSTRUCCIÓN DE ESTRUCTURA DE SUBCARPETAS
 * Crea las subcarpetas encontradas en el sistema de archivos
 */
export async function phase4_buildSubfolderStructure(
	analysisResult: ReindexAnalysisResult,
	_options: ReindexOptions
): Promise<ReindexPhaseResult> {
	const startTime = Date.now();
	logger.info('🌳 Construyendo estructura de subcarpetas');

	const errors: string[] = [];
	let processed = 0;

	try {
		if (analysisResult.newSubfolders.length === 0) {
			logger.info('✅ No hay nuevas subcarpetas para crear');
			return {
				success: true,
				processed: 0,
				failed: 0,
				errors: [],
				duration: Date.now() - startTime,
			};
		}

		const { db } = await import('@/lib/drizzle');
		const { folders } = await import('@/lib/drizzle/schema/index');

		// Crear subcarpetas ordenadas por profundidad (padres primero)
		const sortedSubfolders = [...analysisResult.newSubfolders].sort((a, b) => {
			const depthA = a.path.split(/[\\/]/).length;
			const depthB = b.path.split(/[\\/]/).length;
			return depthA - depthB;
		});

		await db.transaction(async (transaction: typeof db) => {
			const existingFolders = await transaction.select({ id: folders.id }).from(folders);
			const reservedIds = new Set(existingFolders.map((folder: { id: string }) => folder.id));
			const newFolderIdsByPath = new Map<string, string>();
			const allocateId = (name: string): string => {
				const base = normalizeFolderName(name);
				for (let suffix = 1; suffix <= 100; suffix++) {
					const candidate = suffix === 1 ? base : `${base}-${suffix}`;
					if (!reservedIds.has(candidate)) {
						reservedIds.add(candidate);
						return candidate;
					}
				}
				const fallback = crypto.randomUUID();
				reservedIds.add(fallback);
				return fallback;
			};

			for (const subfolder of sortedSubfolders) {
				const folderId = allocateId(subfolder.name);
				const parentPath = resolve(dirname(subfolder.path)).toLowerCase();
				const parentId = newFolderIdsByPath.get(parentPath) ?? subfolder.parentId;
				await transaction.insert(folders).values({
					id: folderId,
					name: subfolder.name,
					path: subfolder.path,
					parentId,
					totalFiles: 0,
					totalSize: 0,
					lastIndexed: new Date(),
					description: null,
					emoji: null,
					color: null,
					featuredImage: null,
					isFavorite: false,
					presetId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				newFolderIdsByPath.set(resolve(subfolder.path).toLowerCase(), folderId);
				logger.debug(`✅ Subcarpeta creada: ${subfolder.path}`);
			}
		});
		processed = sortedSubfolders.length;

		logger.info('✅ Construcción de estructura completada', {
			procesadas: processed,
			errores: errors.length,
		});

		return {
			success: true,
			processed,
			failed: 0,
			errors,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		logger.error('❌ Error construyendo estructura:', error);
		return {
			success: false,
			processed,
			failed: analysisResult.newSubfolders.length - processed,
			errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
			duration: Date.now() - startTime,
		};
	}
}
