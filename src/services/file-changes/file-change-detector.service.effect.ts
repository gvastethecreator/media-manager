/**
 * @file Servicio de detección automática de cambios al abrir archivos
 * @module services/file-changes/file-change-detector.service.effect
 * @description Detecta cambios en archivos cuando son abiertos y actualiza automáticamente
 * @created 2025-10-11 - Sistema incremental de reindexado
 */

import { eq } from 'drizzle-orm';
import { Context, Data, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, images, videos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { updateCanonicalImageFingerprint } from '@/services/image/image-canonical-persistence';
import { emit } from '@/lib/server/events.server';

const logger = serverLogger.withContext('FileChangeDetector');

// ============= Errores =============

export class FileChangeDetectorError extends Data.TaggedError('FileChangeDetectorError')<{
	readonly message: string;
	readonly filePath?: string;
}> {
	readonly displayMessage = `File change detector error: ${this.message}`;
}

export class FileNotFoundError extends Data.TaggedError('FileNotFoundError')<{
	readonly fileId: string;
	readonly entityType: string;
}> {
	readonly displayMessage = `File not found: ${this.fileId}`;
}

export const fromUnknownError = (operation: string, error: unknown): FileChangeDetectorError => {
	if (error instanceof Error) {
		return new FileChangeDetectorError({
			message: error.message,
		});
	}
	return new FileChangeDetectorError({
		message: String(error),
	});
};

export type FileChangeDetectorErrorType = FileChangeDetectorError | FileNotFoundError;

// ============= Servicio =============

export class FileChangeDetectorService extends Context.Tag('FileChangeDetectorService')<
	FileChangeDetectorService,
	FileChangeDetectorServiceInterface
>() {}

export interface FileChangeDetectorServiceInterface {
	/**
	 * Verifica y procesa cambios en un archivo cuando es abierto
	 */
	readonly checkFileOnOpen: (
		fileId: string,
		entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d'
	) => Effect.Effect<
		{
			hasChanged: boolean;
			fileId: string;
			entityType: string;
			needsReindex: boolean;
			message: string;
		},
		FileChangeDetectorErrorType
	>;

	/**
	 * Procesa múltiples archivos en batch
	 */
	readonly checkFilesOnOpen: (
		files: Array<{ id: string; entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d' }>
	) => Effect.Effect<
		Array<{
			hasChanged: boolean;
			fileId: string;
			entityType: string;
			needsReindex: boolean;
		}>,
		FileChangeDetectorErrorType
	>;
}

const make = (): FileChangeDetectorServiceInterface => {
	/**
	 * Verifica si un archivo ha cambiado cuando es abierto
	 */
	const checkFileOnOpen = (
		fileId: string,
		entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d'
	): Effect.Effect<
		{
			hasChanged: boolean;
			fileId: string;
			entityType: string;
			needsReindex: boolean;
			message: string;
		},
		FileChangeDetectorErrorType
	> =>
		Effect.gen(function* () {
			logger.info(`🔍 Verificando archivo abierto: ${entityType}:${fileId}`);

			// 1. Obtener archivo de la BD
			let dbFile: Array<{ id: string; path: string; hash: string | null; name: string | null }> | null = null;

			switch (entityType) {
				case 'image':
					dbFile = yield* Effect.tryPromise<
						Array<{ id: string; path: string; hash: string | null; name: string | null }>,
						FileChangeDetectorErrorType
					>({
						try: () =>
							db
								.select({ id: images.id, path: images.path, hash: images.hash, name: images.name })
								.from(images)
								.where(eq(images.id, fileId))
								.limit(1),
						catch: (error) => fromUnknownError('get-image', error),
					});
					break;
				case 'video':
					dbFile = yield* Effect.tryPromise<
						Array<{ id: string; path: string; hash: string | null; name: string | null }>,
						FileChangeDetectorErrorType
					>({
						try: () =>
							db
								.select({ id: videos.id, path: videos.path, hash: videos.hash, name: videos.name })
								.from(videos)
								.where(eq(videos.id, fileId))
								.limit(1),
						catch: (error) => fromUnknownError('get-video', error),
					});
					break;
				case 'audio':
					dbFile = yield* Effect.tryPromise<
						Array<{ id: string; path: string; hash: string | null; name: string | null }>,
						FileChangeDetectorErrorType
					>({
						try: () =>
							db
								.select({ id: audios.id, path: audios.path, hash: audios.hash, name: audios.name })
								.from(audios)
								.where(eq(audios.id, fileId))
								.limit(1),
						catch: (error) => fromUnknownError('get-audio', error),
					});
					break;
				case 'document':
					dbFile = yield* Effect.tryPromise<
						Array<{ id: string; path: string; hash: string | null; name: string | null }>,
						FileChangeDetectorErrorType
					>({
						try: () =>
							db
								.select({ id: documents.id, path: documents.path, hash: documents.hash, name: documents.name })
								.from(documents)
								.where(eq(documents.id, fileId))
								.limit(1),
						catch: (error) => fromUnknownError('get-document', error),
					});
					break;
				case 'file3d':
					dbFile = yield* Effect.tryPromise<
						Array<{ id: string; path: string; hash: string | null; name: string | null }>,
						FileChangeDetectorErrorType
					>({
						try: () =>
							db
								.select({ id: file3Ds.id, path: file3Ds.path, hash: file3Ds.hash, name: file3Ds.name })
								.from(file3Ds)
								.where(eq(file3Ds.id, fileId))
								.limit(1),
						catch: (error) => fromUnknownError('get-file3d', error),
					});
					break;
				default:
					return yield* Effect.fail(new FileNotFoundError({ fileId, entityType }));
			}

			if (!dbFile || dbFile.length === 0) {
				return yield* Effect.fail(new FileNotFoundError({ fileId, entityType }));
			}

			const file = dbFile[0];

			// 2. Calcular hash actual del archivo
			const { contentHashService } = yield* Effect.promise(() => import('@/lib/filesystem/content-hash.service'));
			const hashResult = yield* contentHashService
				.checkFileHashChanged(file.path, file.hash)
				.pipe(Effect.mapError((error) => fromUnknownError('hash-check', error)));

			// 3. Si cambió, actualizar en la BD y disparar eventos
			let needsReindex = false;

			if (hashResult.hasChanged) {
				logger.info(`🔴 Archivo CAMBIÓ al abrir: ${file.name} (${file.path})`, {
					oldHash: file.hash,
					newHash: hashResult.hash,
				});

				// Actualizar hash en la BD
				switch (entityType) {
					case 'image':
						yield* Effect.tryPromise({
							try: () => updateCanonicalImageFingerprint(fileId, { hash: hashResult.hash, size: hashResult.size }),
							catch: (error) => fromUnknownError('update-image', error),
						});
						break;
					case 'video':
						yield* Effect.tryPromise({
							try: () =>
								db
									.update(videos)
									.set({
										hash: hashResult.hash,
										size: hashResult.size,
										updatedAt: new Date(),
									})
									.where(eq(videos.id, fileId)),
							catch: (error) => fromUnknownError('update-video', error),
						});
						break;
					case 'audio':
						yield* Effect.tryPromise({
							try: () =>
								db
									.update(audios)
									.set({
										hash: hashResult.hash,
										size: hashResult.size,
										updatedAt: new Date(),
									})
									.where(eq(audios.id, fileId)),
							catch: (error) => fromUnknownError('update-audio', error),
						});
						break;
					case 'document':
						yield* Effect.tryPromise({
							try: () =>
								db
									.update(documents)
									.set({
										hash: hashResult.hash,
										size: hashResult.size,
										updatedAt: new Date(),
									})
									.where(eq(documents.id, fileId)),
							catch: (error) => fromUnknownError('update-document', error),
						});
						break;
					case 'file3d':
						yield* Effect.tryPromise({
							try: () =>
								db
									.update(file3Ds)
									.set({
										hash: hashResult.hash,
										size: hashResult.size,
										updatedAt: new Date(),
									})
									.where(eq(file3Ds.id, fileId)),
							catch: (error) => fromUnknownError('update-file3d', error),
						});
						break;
					default:
						break;
				}

				needsReindex = true;

				// Disparar evento para que otros servicios puedan reaccionar
				yield* Effect.tryPromise<void, FileChangeDetectorError>({
					try: () =>
						emit({
							type: 'file:modified',
							data: {
								fileId,
								entityType,
								oldHash: file.hash,
								newHash: hashResult.hash,
								path: file.path,
								name: file.name,
							},
						}),
					catch: (error) => {
						logger.warn('Error emitiendo evento de archivo cambiado:', error);
						return fromUnknownError('emit-progress', error);
					},
				});
			} else {
				logger.debug(`🟢 Archivo sin cambios: ${file.name}`);
			}

			return {
				hasChanged: hashResult.hasChanged,
				fileId,
				entityType,
				needsReindex,
				message: hashResult.hasChanged
					? `Archivo ${file.name} cambió y necesita reindexado`
					: `Archivo ${file.name} está actualizado`,
			};
		});

	/**
	 * Verifica múltiples archivos en batch
	 */
	const checkFilesOnOpen = (
		files: Array<{ id: string; entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d' }>
	): Effect.Effect<
		Array<{
			hasChanged: boolean;
			fileId: string;
			entityType: string;
			needsReindex: boolean;
		}>,
		FileChangeDetectorErrorType
	> =>
		Effect.gen(function* () {
			logger.info(`🔍 Verificando ${files.length} archivos abiertos en batch`);

			const results = yield* Effect.all(
				files.map((file) =>
					Effect.map(checkFileOnOpen(file.id, file.entityType), (result) => ({
						hasChanged: result.hasChanged,
						fileId: result.fileId,
						entityType: result.entityType,
						needsReindex: result.needsReindex,
					}))
				)
			);

			const changedFiles = results.filter((r) => r.hasChanged);
			logger.info(`✅ ${results.length} archivos verificados, ${changedFiles.length} cambiados`);

			return results;
		});

	return {
		checkFileOnOpen,
		checkFilesOnOpen,
	};
};

/**
 * Layer para FileChangeDetectorService
 */
export const FileChangeDetectorServiceLive = Layer.effect(FileChangeDetectorService, Effect.succeed(make()));
