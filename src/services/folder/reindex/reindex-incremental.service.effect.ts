/**
 * @file Servicio de reindexado incremental usando Effect-TS
 * @module services/folders/reindex-incremental.service.effect
 * @description Implementa reindexado inteligente basado en hashes de contenido
 * @created 2025-10-11 - Sistema incremental de reindexado
 */

import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { Context, Data, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, folders, images, videos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { emitProgress } from '@/lib/server/events.server';
import type { ChangedFile, IncrementalReindexOptions, IncrementalReindexStats } from './reindex-incremental-types';

const logger = serverLogger.withContext('ReindexIncrementalService');

// ============= Errores =============

export class ReindexIncrementalError extends Data.TaggedError('ReindexIncrementalError')<{
	readonly message: string;
	readonly phase?: string;
	readonly folderId?: string;
}> {
	readonly displayMessage = `Reindex error: ${this.message}`;
}

export class FolderNotFoundError extends Data.TaggedError('FolderNotFoundError')<{
	readonly folderId: string;
}> {
	readonly displayMessage = `Folder not found: ${this.folderId}`;
}

export const fromUnknownError = (phase: string, error: unknown): ReindexIncrementalError => {
	if (error instanceof Error) {
		return new ReindexIncrementalError({
			phase,
			message: error.message,
		});
	}
	return new ReindexIncrementalError({
		phase,
		message: String(error),
	});
};

export type IncrementalReindexError = ReindexIncrementalError | FolderNotFoundError;

// ============= Servicio =============

export class ReindexIncrementalService extends Context.Tag('ReindexIncrementalService')<
	ReindexIncrementalService,
	ReindexIncrementalServiceInterface
>() {}

export interface ReindexIncrementalServiceInterface {
	/**
	 * Verifica si una carpeta necesita reindexado
	 */
	readonly checkNeedsReindex: (folderId: string) => Effect.Effect<boolean, IncrementalReindexError>;
	/**
	 * Ejecuta reindexado incremental o completo
	 */
	readonly executeIncrementalReindex: (
		options: IncrementalReindexOptions
	) => Effect.Effect<IncrementalReindexStats, IncrementalReindexError>;

	/**
	 * Reindexa archivos específicos que cambiaron
	 */
	readonly reindexChangedFiles: (
		changedFiles: ChangedFile[]
	) => Effect.Effect<{ processed: number; failed: number }, IncrementalReindexError>;
}

const make = (): ReindexIncrementalServiceInterface => {
	/**
	 * Ejecuta reindexado incremental
	 */
	const executeIncrementalReindex = (
		options: IncrementalReindexOptions
	): Effect.Effect<IncrementalReindexStats, IncrementalReindexError> =>
		Effect.gen(function* () {
			const startTime = Date.now();
			const {
				mode = 'incremental',
				fileTypes = ['image', 'video', 'audio', 'document', 'file3d'],
				folderId,
				includeSubfolders = true,
				emitEvents: emit = true,
			} = options;

			if (emit) {
				try {
					emitProgress('folder:reindexAll:start', {
						isProcessing: true,
						progress: 0,
						message: 'Iniciando reindexado incremental...',
						phase: 'starting',
						folderId,
					});
				} catch (e) {
					logger.warn('Error emitiendo evento de inicio:', e);
				}
			}

			// Obtener carpetas a reindexar
			let folderIds: string[] = [];
			if (folderId) {
				folderIds = [folderId];
			} else {
				const allFoldersResult = yield* Effect.tryPromise<Array<{ id: string }>, IncrementalReindexError>({
					try: () =>
						db
							.select({ id: folders.id })
							.from(folders)
							.where(sql`${folders.parentId} IS NULL`),
					catch: (error) => fromUnknownError('get-folders', error),
				});
				folderIds = allFoldersResult.map((f) => f.id);
			}

			if (includeSubfolders) {
				const allFoldersResult = yield* Effect.tryPromise<
					Array<{ id: string; parentId: string | null }>,
					IncrementalReindexError
				>({
					try: () => db.select({ id: folders.id, parentId: folders.parentId }).from(folders),
					catch: (error) => fromUnknownError('get-all-folders', error),
				});

				const childrenByParentId = new Map<string, string[]>();
				for (const folder of allFoldersResult) {
					if (!folder.parentId) {
						continue;
					}

					const children = childrenByParentId.get(folder.parentId) ?? [];
					children.push(folder.id);
					childrenByParentId.set(folder.parentId, children);
				}

				const allFolderIds = new Set<string>();
				for (const rootId of folderIds) {
					const pendingFolderIds = [rootId];

					while (pendingFolderIds.length > 0) {
						const currentFolderId = pendingFolderIds.pop();
						if (!currentFolderId || allFolderIds.has(currentFolderId)) {
							continue;
						}

						allFolderIds.add(currentFolderId);

						for (const childFolderId of childrenByParentId.get(currentFolderId) ?? []) {
							pendingFolderIds.push(childFolderId);
						}
					}
				}
				folderIds = Array.from(allFolderIds);
			}

			// Obtener archivos
			const allFiles: Array<{
				id: string;
				path: string;
				hash: string;
				entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d';
			}> = [];
			const storedSizes = new Map<string, number>();

			for (const fileType of fileTypes) {
				const filesResult: Array<{
					id: string;
					path: string;
					hash: string | null;
					name: string | null;
					size: number | null;
				}> = yield* Effect.tryPromise({
					try: async () => {
						switch (fileType) {
							case 'image':
								return db
									.select({
										id: images.id,
										path: images.path,
										hash: images.hash,
										name: images.name,
										size: images.size,
									})
									.from(images)
									.where(inArray(images.folderId, folderIds));
							case 'video':
								return db
									.select({
										id: videos.id,
										path: videos.path,
										hash: videos.hash,
										name: videos.name,
										size: videos.size,
									})
									.from(videos)
									.where(inArray(videos.folderId, folderIds));
							case 'audio':
								return db
									.select({
										id: audios.id,
										path: audios.path,
										hash: audios.hash,
										name: audios.name,
										size: audios.size,
									})
									.from(audios)
									.where(inArray(audios.folderId, folderIds));
							case 'document':
								return db
									.select({
										id: documents.id,
										path: documents.path,
										hash: documents.hash,
										name: documents.name,
										size: documents.size,
									})
									.from(documents)
									.where(inArray(documents.folderId, folderIds));
							case 'file3d':
								return db
									.select({
										id: file3Ds.id,
										path: file3Ds.path,
										hash: file3Ds.hash,
										name: file3Ds.name,
										size: file3Ds.size,
									})
									.from(file3Ds)
									.where(inArray(file3Ds.folderId, folderIds));
							default:
								return [];
						}
					},
					catch: (error) => fromUnknownError('get-files', error),
				});

				allFiles.push(
					...filesResult.map((f) => ({
						id: f.id,
						path: f.path,
						hash: f.hash || '',
						entityType: fileType,
					}))
				);
				for (const file of filesResult) {
					storedSizes.set(file.id, file.size ?? 0);
				}
			}

			const { contentHashService } = yield* Effect.promise(() => import('@/lib/filesystem/content-hash.service'));
			const changedFilesRaw = yield* contentHashService
				.detectChangedFiles(allFiles)
				.pipe(Effect.mapError((error) => fromUnknownError('detect-changed', error)));
			const changedFiles: ChangedFile[] = changedFilesRaw.map((file) => ({
				id: file.id,
				path: file.path,
				entityType: file.entityType,
				storedHash: file.storedHash,
				currentHash: file.currentHash,
				currentSize: file.currentSize,
				storedSize: storedSizes.get(file.id) ?? 0,
				fieldsToUpdate: ['all'],
			}));

			if (emit) {
				try {
					emitProgress('folder:reindexAll:progress', {
						isProcessing: true,
						progress: 50,
						message: `${changedFiles.length} archivos cambiados detectados`,
						phase: 'scanning',
						totalFiles: allFiles.length,
						filesProcessed: changedFiles.length,
						folderId,
					});
				} catch (e) {
					logger.warn('Error emitiendo evento de detección:', e);
				}
			}

			const reindexResult = yield* reindexChangedFiles(changedFiles);

			const totalDuration = Date.now() - startTime;
			const unchangedFiles = allFiles.length - changedFiles.length;

			const stats: IncrementalReindexStats = {
				totalFiles: allFiles.length,
				newFiles: 0,
				changedFiles: changedFiles.length,
				unchangedFiles,
				deletedFiles: 0,
				failedFiles: reindexResult.failed,
				duration: totalDuration,
				timeSavedPercentage: (unchangedFiles / (allFiles.length || 1)) * 100,
			};

			if (emit) {
				try {
					emitProgress('folder:reindexAll:complete', {
						isProcessing: false,
						progress: 100,
						message: 'Reindexado completado',
						status: 'completed',
						phase: 'complete',
						totalFiles: allFiles.length,
						filesProcessed: allFiles.length,
						folderId,
					});
				} catch (e) {
					logger.warn('Error emitiendo evento de completado:', e);
				}
			}

			return stats;
		});

	const checkNeedsReindex = (folderId: string): Effect.Effect<boolean, IncrementalReindexError> =>
		Effect.gen(function* () {
			const folder = yield* Effect.tryPromise({
				try: () => db.query.folders.findFirst({ where: eq(folders.id, folderId) }),
				catch: (error) => fromUnknownError('check-needs-reindex', error),
			});

			if (!folder) return yield* Effect.fail(new FolderNotFoundError({ folderId }));

			const imagesWithoutHash = yield* Effect.tryPromise<Array<{ id: string }>, IncrementalReindexError>({
				try: () =>
					db
						.select({ id: images.id })
						.from(images)
						.where(and(eq(images.folderId, folderId), or(isNull(images.hash), eq(images.hash, ''))))
						.limit(1),
				catch: (error) => fromUnknownError('check-images-hash', error),
			});

			return imagesWithoutHash.length > 0;
		});

	const reindexChangedFiles = (
		changedFiles: ChangedFile[]
	): Effect.Effect<{ processed: number; failed: number }, IncrementalReindexError> =>
		Effect.gen(function* () {
			let processed = 0;
			let failed = 0;

			for (const changedFile of changedFiles) {
				try {
					if (changedFile.entityType === 'image') {
						yield* Effect.tryPromise({
							try: () =>
								db
									.update(images)
									.set({ hash: changedFile.currentHash, updatedAt: new Date() })
									.where(eq(images.id, changedFile.id)),
							catch: (error) => fromUnknownError('update-image-hash', error),
						});
					} else if (changedFile.entityType === 'video') {
						yield* Effect.tryPromise({
							try: () =>
								db
									.update(videos)
									.set({ hash: changedFile.currentHash, updatedAt: new Date() })
									.where(eq(videos.id, changedFile.id)),
							catch: (error) => fromUnknownError('update-video-hash', error),
						});
					}

					try {
						const total = changedFiles.length || 1;
						const percent = Math.round(((processed + 1) / total) * 100);
						emitProgress('folder:reindexAll:progress', {
							isProcessing: true,
							message: `Archivo actualizado: ${changedFile.id}`,
							phase: 'processing',
							progress: percent,
							totalFiles: total,
							filesProcessed: processed + 1,
						});
					} catch (_progressError) {
						// Progress emission is non-critical; log and continue
					}

					processed++;
				} catch (error) {
					failed++;
				}
			}

			return { processed, failed };
		});

	return { executeIncrementalReindex, checkNeedsReindex, reindexChangedFiles };
};

export const ReindexIncrementalServiceLive = Layer.effect(ReindexIncrementalService, Effect.succeed(make()));
