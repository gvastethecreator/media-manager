/**
 * @file FolderService implementado con Effect
 * @module services/folder/folder.service.effect
 * @description Servicio Folder con operaciones CRUD + jerárquicas usando Effect-TS
 * @created 2025-10-11 - Fase 4 Effect Implementation
 */

import { Schema } from '@effect/schema';
import { and, asc, count, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, folders, images, jsonFiles, videos } from '@/lib/drizzle/schema';
import { Folder, FolderCreateInput, FolderUpdateInput } from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import {
	deleteFavoriteRecordsForEntities,
	emitCommittedFavoriteChange,
	setFavoriteStateForActiveProfile,
} from '@/services/favorite/favorite-write-transaction';
import type { FavoriteWriteTransaction, FavoriteWriteResult } from '@/services/favorite/favorite-write-transaction';
import { visibleImageLifecycleCondition } from '@/services/image/image-lifecycle-query';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	FolderCircularReferenceError,
	type FolderError,
	FolderHasChildrenError,
	FolderMaxDepthExceededError,
	FolderNameConflict,
	FolderNotFound,
	FolderPathConflict,
	fromUnknownError,
} from './folder-errors.effect';

// Logger específico
const logger = serverLogger.withContext('FolderService.Effect');

// ============= Constants =============

const MAX_HIERARCHY_DEPTH = 10;

// ============= Types =============

/**
 * Opciones para obtener folders
 */
export interface GetFoldersOptions {
	limit?: number;
	offset?: number;
	onlyFavorites?: boolean;
	orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'totalFiles';
	orderDirection?: 'asc' | 'desc';
	parentId?: string | null;
	search?: string;
}

/**
 * Resultado de obtener folders con paginación
 */
export interface GetFoldersResult {
	folders: FolderWithStats[];
	limit: number;
	offset: number;
	total: number;
}

/**
 * Contadores de relaciones de una carpeta
 */
export interface FolderCounts {
	audios: number;
	children: number;
	documents: number;
	file3Ds: number;
	images: number;
	jsonFiles: number;
	totalFiles: number;
	videos: number;
}

/**
 * Folder con estadísticas
 */
export interface FolderWithStats extends Schema.Schema.Type<typeof Folder> {
	_count?: FolderCounts;
}

/**
 * Información de ancestros de una carpeta
 */
export interface FolderAncestors {
	ancestors: FolderWithStats[];
	depth: number;
}

/**
 * Resultado de eliminación masiva
 */
export interface BulkDeleteResult {
	failed: Array<{ id: string; error: string }>;
	successful: string[];
}

/**
 * Interface para el servicio FolderService
 */
export interface FolderServiceInterface {
	readonly bulkDelete: (ids: string[], force?: boolean) => Effect.Effect<BulkDeleteResult, FolderError>;
	readonly create: (input: Schema.Schema.Type<typeof FolderCreateInput>) => Effect.Effect<FolderWithStats, FolderError>;
	readonly delete: (id: string, force?: boolean) => Effect.Effect<void, FolderError>;
	readonly getAll: (options?: GetFoldersOptions) => Effect.Effect<GetFoldersResult, FolderError>;
	readonly getAncestors: (id: string) => Effect.Effect<FolderAncestors, FolderError>;
	// CRUD Básico
	readonly getById: (id: string) => Effect.Effect<FolderWithStats, FolderError>;
	readonly getByPath: (path: string) => Effect.Effect<FolderWithStats, FolderError>;

	// Operaciones Jerárquicas
	readonly getChildren: (parentId: string | null) => Effect.Effect<FolderWithStats[], FolderError>;
	readonly getTree: () => Effect.Effect<FolderWithStats[], FolderError>;
	readonly moveTo: (id: string, newParentId: string | null) => Effect.Effect<FolderWithStats, FolderError>;

	// Stats & Favorites
	readonly toggleFavorite: (id: string) => Effect.Effect<FolderWithStats, FolderError>;
	readonly update: (
		id: string,
		input: Schema.Schema.Type<typeof FolderUpdateInput>
	) => Effect.Effect<FolderWithStats, FolderError>;
}

/**
 * Context.Tag para FolderService
 */
export class FolderService extends Context.Tag('FolderService')<FolderService, FolderServiceInterface>() {}

// ============= Helpers =============

type FolderCountKey = Exclude<keyof FolderCounts, 'children' | 'totalFiles'>;

interface FolderPathEntry {
	id: string;
	normalizedPath: string;
}

interface FolderRelationStats {
	counts: FolderCounts;
	totalSize: number;
}

type PathColumn =
	| typeof images.path
	| typeof videos.path
	| typeof audios.path
	| typeof documents.path
	| typeof jsonFiles.path
	| typeof file3Ds.path;

function normalizePathForMatching(path: string): string {
	return path.replaceAll('/', '\\').toLowerCase();
}

function isFileInsideFolder(filePath: string, folderPath: string): boolean {
	const normalizedFilePath = normalizePathForMatching(filePath);
	const normalizedFolderPath = normalizePathForMatching(folderPath);

	if (!normalizedFilePath.startsWith(normalizedFolderPath)) {
		return false;
	}

	const nextChar = normalizedFilePath[normalizedFolderPath.length];
	return nextChar === '\\' || nextChar === '/' || nextChar === undefined;
}

function createEmptyFileCounts(): Omit<FolderCounts, 'children'> {
	return {
		audios: 0,
		documents: 0,
		file3Ds: 0,
		images: 0,
		jsonFiles: 0,
		totalFiles: 0,
		videos: 0,
	};
}

const stripLegacyFavoriteInput = <TInput>(input: TInput): TInput => {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return input;
	}

	const { isFavorite: _legacyIsFavorite, ...rest } = input as Record<string, unknown>;
	return rest as TInput;
};

const getFolderFavoriteIds = (): Effect.Effect<string[], FolderError> =>
	Effect.tryPromise({
		try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.FOLDER),
		catch: (error: unknown) => fromUnknownError('favorite.getIds', error),
	});

const projectFolderFavoriteState = <TFolder extends { id: string; isFavorite: boolean }>(
	folder: TFolder,
	favoriteEntityIds: readonly string[]
): TFolder => ({
	...folder,
	isFavorite: favoriteEntityIds.includes(folder.id),
});

const normalizeFolderRow = (row: Partial<typeof folders.$inferSelect> | null | undefined) => {
	if (!row) {
		return null;
	}

	const createdAt = row.createdAt ?? new Date();

	return {
		...row,
		color: row.color ?? '#3b82f6',
		createdAt,
		description: row.description ?? null,
		emoji: row.emoji ?? '📁',
		featuredImage: row.featuredImage ?? null,
		isFavorite: false,
		lastIndexed: row.lastIndexed ?? createdAt,
		parentId: row.parentId ?? null,
		presetId: row.presetId ?? null,
		totalFiles: row.totalFiles ?? 0,
		totalImages: row.totalImages ?? 0,
		totalSize: row.totalSize ?? 0,
		totalVideos: row.totalVideos ?? 0,
		updatedAt: row.updatedAt ?? createdAt,
	};
};

const decodeFolderRow = (
	row: Partial<typeof folders.$inferSelect> | null | undefined,
	favoriteEntityIds?: readonly string[]
) => {
	const normalizedRow = normalizeFolderRow(row);
	const projectedRow = favoriteEntityIds
		? projectFolderFavoriteState(normalizedRow as never, favoriteEntityIds)
		: normalizedRow;
	return Schema.decodeUnknownSync(Folder)(projectedRow);
};

function buildRecursivePathWhere(column: PathColumn, folderPaths: string[]) {
	return or(
		...folderPaths.flatMap((folderPath) => [like(column, `${folderPath}/%`), like(column, `${folderPath}\\%`)])
	);
}

function accumulatePathCounts(
	folderEntries: FolderPathEntry[],
	filePaths: string[],
	countKey: FolderCountKey,
	countsByFolderId: Map<string, Omit<FolderCounts, 'children'>>
): void {
	for (const filePath of filePaths) {
		for (const folderEntry of folderEntries) {
			if (!isFileInsideFolder(filePath, folderEntry.normalizedPath)) {
				continue;
			}

			const counts = countsByFolderId.get(folderEntry.id);
			if (!counts) {
				continue;
			}

			counts[countKey] += 1;
			counts.totalFiles += 1;
		}
	}
}

function accumulatePathSizes(
	folderEntries: FolderPathEntry[],
	files: Array<{ path: string; size: number }>,
	sizesByFolderId: Map<string, number>
): void {
	for (const file of files) {
		for (const folderEntry of folderEntries) {
			if (!isFileInsideFolder(file.path, folderEntry.normalizedPath)) continue;
			sizesByFolderId.set(folderEntry.id, (sizesByFolderId.get(folderEntry.id) ?? 0) + Number(file.size || 0));
		}
	}
}

/**
 * Obtiene conteos de relaciones para una carpeta
 */
const getRelationsStats = (folderId: string): Effect.Effect<FolderRelationStats, FolderError> =>
	Effect.gen(function* () {
		const [
			childrenCountResult,
			imageCountResult,
			videoCountResult,
			audioCountResult,
			documentCountResult,
			jsonCountResult,
			file3DCountResult,
		] = yield* Effect.tryPromise<
			[
				Array<{ count: number }>,
				Array<{ count: number; totalSize: number }>,
				Array<{ count: number; totalSize: number }>,
				Array<{ count: number; totalSize: number }>,
				Array<{ count: number; totalSize: number }>,
				Array<{ count: number; totalSize: number }>,
				Array<{ count: number; totalSize: number }>,
			],
			FolderError
		>({
			try: () =>
				Promise.all([
					db.select({ count: count() }).from(folders).where(eq(folders.parentId, folderId)),
					db
						.select({ count: count(), totalSize: sql<number>`COALESCE(SUM(${images.size}), 0)` })
						.from(images)
						.where(and(eq(images.folderId, folderId), visibleImageLifecycleCondition())),
					db
						.select({ count: count(), totalSize: sql<number>`COALESCE(SUM(${videos.size}), 0)` })
						.from(videos)
						.where(eq(videos.folderId, folderId)),
					db
						.select({ count: count(), totalSize: sql<number>`COALESCE(SUM(${audios.size}), 0)` })
						.from(audios)
						.where(eq(audios.folderId, folderId)),
					db
						.select({ count: count(), totalSize: sql<number>`COALESCE(SUM(${documents.size}), 0)` })
						.from(documents)
						.where(eq(documents.folderId, folderId)),
					db
						.select({ count: count(), totalSize: sql<number>`COALESCE(SUM(${jsonFiles.size}), 0)` })
						.from(jsonFiles)
						.where(eq(jsonFiles.folderId, folderId)),
					db
						.select({ count: count(), totalSize: sql<number>`COALESCE(SUM(${file3Ds.size}), 0)` })
						.from(file3Ds)
						.where(eq(file3Ds.folderId, folderId)),
				]),
			catch: (error: unknown) => fromUnknownError('getRelationsStats', error),
		});

		const imagesCount = imageCountResult[0]?.count ?? 0;
		const videosCount = videoCountResult[0]?.count ?? 0;
		const audiosCount = audioCountResult[0]?.count ?? 0;
		const documentsCount = documentCountResult[0]?.count ?? 0;
		const jsonFilesCount = jsonCountResult[0]?.count ?? 0;
		const file3DsCount = file3DCountResult[0]?.count ?? 0;

		const counts = {
			audios: audiosCount,
			children: childrenCountResult[0]?.count ?? 0,
			documents: documentsCount,
			file3Ds: file3DsCount,
			images: imagesCount,
			jsonFiles: jsonFilesCount,
			totalFiles: imagesCount + videosCount + audiosCount + documentsCount + jsonFilesCount + file3DsCount,
			videos: videosCount,
		};
		const totalSize = [
			imageCountResult,
			videoCountResult,
			audioCountResult,
			documentCountResult,
			jsonCountResult,
			file3DCountResult,
		].reduce((sum, result) => sum + Number(result[0]?.totalSize ?? 0), 0);

		return { counts, totalSize };
	});

/**
 * Enriquece una carpeta con conteos de relaciones
 */
const enrichFolderWithCounts = (
	folder: Schema.Schema.Type<typeof Folder>
): Effect.Effect<FolderWithStats, FolderError> =>
	Effect.gen(function* () {
		const { counts, totalSize } = yield* getRelationsStats(folder.id);

		return {
			...folder,
			totalFiles: counts.totalFiles,
			totalImages: counts.images,
			totalSize,
			totalVideos: counts.videos,
			_count: counts,
		} as FolderWithStats;
	});

/**
 * Valida que un parentId existe si se provee
 */
const validateParentExists = (parentId: string | null | undefined): Effect.Effect<void, FolderError> =>
	Effect.gen(function* () {
		if (!parentId) return;

		const result = yield* Effect.tryPromise<Array<{ id: string }>, FolderError>({
			try: async () => await db.select({ id: folders.id }).from(folders).where(eq(folders.id, parentId)),
			catch: (error: unknown) => fromUnknownError('validateParentExists', error),
		});

		if (result.length === 0) {
			return yield* Effect.fail(new FolderNotFound({ folderId: parentId }));
		}
	});

/**
 * Verifica que no exista una carpeta con el mismo path
 */
const checkPathUnique = (path: string, excludeId?: string): Effect.Effect<void, FolderError> =>
	Effect.gen(function* () {
		const conditions = excludeId
			? and(eq(folders.path, path), sql`${folders.id} != ${excludeId}`)
			: eq(folders.path, path);

		const result = yield* Effect.tryPromise<Array<{ id: string }>, FolderError>({
			try: async () => await db.select({ id: folders.id }).from(folders).where(conditions),
			catch: (error: unknown) => fromUnknownError('checkPathUnique', error),
		});

		if (result.length > 0) {
			return yield* Effect.fail(new FolderPathConflict({ path }));
		}
	});

/**
 * Verifica que no exista una carpeta con el mismo nombre en el mismo padre
 */
const checkNameUnique = (
	name: string,
	parentId: string | null | undefined,
	excludeId?: string
): Effect.Effect<void, FolderError> =>
	Effect.gen(function* () {
		const parentCondition = parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId);
		const nameCondition = eq(folders.name, name);
		const excludeCondition = excludeId ? sql`${folders.id} != ${excludeId}` : undefined;

		const conditions = excludeCondition
			? and(parentCondition, nameCondition, excludeCondition)
			: and(parentCondition, nameCondition);

		const result = yield* Effect.tryPromise<Array<{ id: string }>, FolderError>({
			try: async () => await db.select({ id: folders.id }).from(folders).where(conditions),
			catch: (error: unknown) => fromUnknownError('checkNameUnique', error),
		});

		if (result.length > 0) {
			return yield* Effect.fail(new FolderNameConflict({ name, parentId: parentId ?? null }));
		}
	});

/**
 * Calcula la profundidad de una carpeta en la jerarquía
 */
const calculateDepth = (folderId: string): Effect.Effect<number, FolderError> =>
	Effect.gen(function* () {
		let depth = 0;
		let currentId: string | null = folderId;

		while (currentId && depth < MAX_HIERARCHY_DEPTH + 1) {
			const result = yield* Effect.tryPromise<Array<{ parentId: string | null }>, FolderError>({
				try: async () =>
					await db
						.select({ parentId: folders.parentId })
						.from(folders)
						.where(eq(folders.id, currentId as string)),
				catch: (error: unknown) => fromUnknownError('calculateDepth', error),
			});

			if (result.length === 0) break;

			currentId = result[0].parentId;
			if (currentId) depth++;
		}

		if (depth > MAX_HIERARCHY_DEPTH) {
			return yield* Effect.fail(
				new FolderMaxDepthExceededError({ currentDepth: depth, maxDepth: MAX_HIERARCHY_DEPTH })
			);
		}

		return depth;
	});

/**
 * Verifica que mover una carpeta no cree una referencia circular
 */
const checkNoCircularReference = (folderId: string, newParentId: string | null): Effect.Effect<void, FolderError> =>
	Effect.gen(function* () {
		if (!newParentId) return; // Mover a raíz siempre es seguro

		// No puede moverse a sí mismo
		if (folderId === newParentId) {
			return yield* Effect.fail(new FolderCircularReferenceError({ folderId, targetParentId: newParentId }));
		}

		// Verificar que newParentId no sea descendiente de folderId
		let currentId: string | null = newParentId;
		let iterations = 0;

		while (currentId && iterations < MAX_HIERARCHY_DEPTH + 1) {
			if (currentId === folderId) {
				return yield* Effect.fail(new FolderCircularReferenceError({ folderId, targetParentId: newParentId }));
			}

			const result = yield* Effect.tryPromise<Array<{ parentId: string | null }>, FolderError>({
				try: async () =>
					await db
						.select({ parentId: folders.parentId })
						.from(folders)
						.where(eq(folders.id, currentId as string)),
				catch: (error: unknown) => fromUnknownError('checkNoCircularReference', error),
			});

			if (result.length === 0) break;
			currentId = result[0].parentId;
			iterations++;
		}
	});

/**
 * Elimina una carpeta (función interna para uso en bulkDelete)
 */
const deleteFolderInternal = (id: string, force = false): Effect.Effect<void, FolderError> =>
	Effect.gen(function* () {
		logger.info('🗑️ Eliminando carpeta:', { id, force });

		// Verificar que existe
		const existingFolder = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
			try: async () => await db.select().from(folders).where(eq(folders.id, id)),
			catch: (error: unknown) => fromUnknownError('delete:fetch', error),
		});

		if (existingFolder.length === 0) {
			return yield* Effect.fail(new FolderNotFound({ folderId: id }));
		}

		if (!force) {
			// Verificar que no tenga subcarpetas
			const childrenResult = yield* Effect.tryPromise<Array<{ count: number }>, FolderError>({
				try: async () => await db.select({ count: count() }).from(folders).where(eq(folders.parentId, id)),
				catch: (error: unknown) => fromUnknownError('delete:check:children', error),
			});

			const childrenCount = childrenResult[0]?.count ?? 0;

			if (childrenCount > 0) {
				return yield* Effect.fail(new FolderHasChildrenError({ folderId: id, childrenCount }));
			}
		}

		// Favorite is polymorphic and has no target FK, so both deletes must commit together.
		yield* Effect.tryPromise<void, FolderError>({
			try: () =>
				db.transaction(async (transaction: FavoriteWriteTransaction) => {
					await deleteFavoriteRecordsForEntities(transaction, FavoriteEntityType.FOLDER, [id]);
					await transaction.delete(folders).where(eq(folders.id, id));
				}),
			catch: (error: unknown) => fromUnknownError('delete:delete', error),
		});

		logger.info('✅ Carpeta eliminada:', { id });
	});

// ============= Service Implementation =============

/**
 * Implementación del servicio FolderService usando Effect
 */
const FolderServiceLive = Layer.succeed(
	FolderService,
	FolderService.of({
		/**
		 * Obtiene una carpeta por su ID con estadísticas
		 */
		getById: (id: string) =>
			Effect.gen(function* () {
				logger.info(`🔍 Obteniendo carpeta por ID: ${id}`);

				// Buscar carpeta
				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.select().from(folders).where(eq(folders.id, id)),
					catch: (error: unknown) => fromUnknownError('getById', error),
				});

				if (result.length === 0) {
					logger.warn(`❌ Carpeta no encontrada: ${id}`);
					return yield* Effect.fail(new FolderNotFound({ folderId: id }));
				}

				const favoriteEntityIds = yield* getFolderFavoriteIds();

				// Validar con Schema
				const folder = yield* Effect.try({
					try: () => decodeFolderRow(result[0], favoriteEntityIds),
					catch: (error: unknown) => fromUnknownError('getById:validation', error),
				});

				logger.info('✅ Carpeta encontrada:', { id: folder.id, name: folder.name });

				// Enriquecer con conteos
				return yield* enrichFolderWithCounts(folder);
			}),

		/**
		 * Obtiene todas las carpetas con filtros y paginación
		 */
		getAll: (options?: GetFoldersOptions) =>
			Effect.gen(function* () {
				const {
					search,
					onlyFavorites = false,
					parentId,
					limit = 50,
					offset = 0,
					orderBy = 'name',
					orderDirection = 'asc',
				} = options ?? {};

				logger.info('📋 Obteniendo carpetas:', { search, onlyFavorites, parentId, limit, offset });

				const favoriteEntityIds = yield* getFolderFavoriteIds();

				// Construir condiciones WHERE
				const conditions: any[] = [];

				if (search) {
					conditions.push(or(like(folders.name, `%${search}%`), like(folders.path, `%${search}%`)));
				}

				if (onlyFavorites) {
					if (favoriteEntityIds.length === 0) {
						return {
							folders: [],
							total: 0,
							limit,
							offset,
						};
					} else {
						conditions.push(inArray(folders.id, favoriteEntityIds));
					}
				}

				if (parentId !== undefined) {
					conditions.push(parentId === null ? isNull(folders.parentId) : eq(folders.parentId, parentId));
				}

				const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

				// Obtener total
				const totalResult = yield* Effect.tryPromise<Array<{ count: number }>, FolderError>({
					try: async () => await db.select({ count: count() }).from(folders).where(whereClause),
					catch: (error: unknown) => fromUnknownError('getAll:count', error),
				});

				const total = totalResult[0]?.count ?? 0;

				// Obtener carpetas
				const orderColumn =
					orderBy === 'name'
						? folders.name
						: orderBy === 'createdAt'
							? folders.createdAt
							: orderBy === 'updatedAt'
								? folders.updatedAt
								: folders.totalFiles;

				const orderFn = orderDirection === 'asc' ? asc : desc;

				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () =>
						await db
							.select()
							.from(folders)
							.where(whereClause)
							.orderBy(orderFn(orderColumn))
							.limit(limit)
							.offset(offset),
					catch: (error: unknown) => fromUnknownError('getAll:select', error),
				});

				// Validar con Schema
				const validatedFolders = yield* Effect.try({
					try: () => result.map((f) => decodeFolderRow(f, favoriteEntityIds)),
					catch: (error: unknown) => fromUnknownError('getAll:validation', error),
				});

				logger.info(`✅ Carpetas obtenidas: ${validatedFolders.length}/${total}`);

				// Enriquecer con conteos
				const enrichedFolders = yield* Effect.all(validatedFolders.map(enrichFolderWithCounts));

				return {
					folders: enrichedFolders,
					total,
					limit,
					offset,
				};
			}),

		/**
		 * Crea una nueva carpeta
		 */
		create: (input: Schema.Schema.Type<typeof FolderCreateInput>) =>
			Effect.gen(function* () {
				logger.info('➕ Creando carpeta:', { name: input.name, parentId: input.parentId });
				const requestedIsFavorite = input.isFavorite;
				const sanitizedInput = stripLegacyFavoriteInput(input);

				// Validar input
				const validatedInput = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(FolderCreateInput)(sanitizedInput),
					catch: (error: unknown) => fromUnknownError('create:validation', error),
				});

				// Validar que el padre existe
				yield* validateParentExists(validatedInput.parentId);

				// Validar unicidad de path
				yield* checkPathUnique(validatedInput.path);

				// Validar unicidad de nombre en el mismo padre
				yield* checkNameUnique(validatedInput.name, validatedInput.parentId);

				// Validar profundidad máxima si tiene padre
				if (validatedInput.parentId) {
					const depth = yield* calculateDepth(validatedInput.parentId);
					if (depth >= MAX_HIERARCHY_DEPTH) {
						return yield* Effect.fail(
							new FolderMaxDepthExceededError({ currentDepth: depth + 1, maxDepth: MAX_HIERARCHY_DEPTH })
						);
					}
				}

				// Crear carpeta
				const committed = yield* Effect.tryPromise<
					{ result: Schema.Schema.Type<typeof Folder>[]; favoriteWrite: FavoriteWriteResult | null },
					FolderError
				>({
					try: async () =>
						await db.transaction(async (transaction: FavoriteWriteTransaction) => {
							const result = await transaction
								.insert(folders)
								.values({
									createdAt: new Date(),
									description: validatedInput.description ?? null,
									emoji: validatedInput.emoji ?? '📁',
									color: validatedInput.color ?? '#3b82f6',
									featuredImage: null,
									lastIndexed: new Date(),
									name: validatedInput.name,
									path: validatedInput.path,
									parentId: validatedInput.parentId ?? null,
									presetId: validatedInput.presetId ?? null,
									totalImages: 0,
									totalVideos: 0,
									totalFiles: 0,
									totalSize: 0,
									updatedAt: new Date(),
								})
								.returning();
							const favoriteWrite =
								requestedIsFavorite === undefined || !result[0]
									? null
									: await setFavoriteStateForActiveProfile(
											transaction,
											FavoriteEntityType.FOLDER,
											result[0].id,
											requestedIsFavorite
										);
							return { result, favoriteWrite };
						}),
					catch: (error: unknown) => fromUnknownError('create:insert', error),
				});
				const { result, favoriteWrite } = committed;

				const favoriteEntityIds = yield* getFolderFavoriteIds();

				const createdFolder = yield* Effect.try({
					try: () => decodeFolderRow(result[0], favoriteEntityIds),
					catch: (error: unknown) => fromUnknownError('create:validation:result', error),
				});

				logger.info('✅ Carpeta creada:', { id: createdFolder.id, name: createdFolder.name });

				if (favoriteWrite?.changed && requestedIsFavorite !== undefined) {
					yield* Effect.tryPromise({
						try: () =>
							emitCommittedFavoriteChange(
								favoriteWrite.profileId,
								FavoriteEntityType.FOLDER,
								createdFolder.id,
								requestedIsFavorite
							),
						catch: (error: unknown) => fromUnknownError('create:favoriteEvent', error),
					});
				}

				return yield* enrichFolderWithCounts(createdFolder);
			}),

		/**
		 * Actualiza una carpeta existente
		 */
		update: (id: string, input: Schema.Schema.Type<typeof FolderUpdateInput>) =>
			Effect.gen(function* () {
				logger.info('🔧 Actualizando carpeta:', { id, updates: input });
				const requestedIsFavorite = input.isFavorite;
				const sanitizedInput = stripLegacyFavoriteInput(input);

				// Verificar que existe
				const existingFolder = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.select().from(folders).where(eq(folders.id, id)),
					catch: (error: unknown) => fromUnknownError('update:fetch', error),
				});

				if (existingFolder.length === 0) {
					return yield* Effect.fail(new FolderNotFound({ folderId: id }));
				}

				// Validar input
				const validatedInput = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(FolderUpdateInput)(sanitizedInput),
					catch: (error: unknown) => fromUnknownError('update:validation', error),
				});

				// Validar path único si se actualiza
				if (validatedInput.path !== undefined) {
					yield* checkPathUnique(validatedInput.path, id);
				}

				// Validar nombre único si se actualiza
				if (validatedInput.name !== undefined) {
					yield* checkNameUnique(validatedInput.name, existingFolder[0].parentId, id);
				}

				// Validar parentId si se actualiza
				if (validatedInput.parentId !== undefined) {
					yield* validateParentExists(validatedInput.parentId);

					// Verificar referencias circulares
					yield* checkNoCircularReference(id, validatedInput.parentId);

					// Validar profundidad
					if (validatedInput.parentId) {
						const depth = yield* calculateDepth(validatedInput.parentId);
						if (depth >= MAX_HIERARCHY_DEPTH) {
							return yield* Effect.fail(
								new FolderMaxDepthExceededError({ currentDepth: depth + 1, maxDepth: MAX_HIERARCHY_DEPTH })
							);
						}
					}
				}

				// Actualizar carpeta
				const updateData: any = {
					updatedAt: new Date(),
				};

				if (validatedInput.name !== undefined) updateData.name = validatedInput.name;
				if (validatedInput.path !== undefined) updateData.path = validatedInput.path;
				if (validatedInput.parentId !== undefined) updateData.parentId = validatedInput.parentId;
				if (validatedInput.emoji !== undefined) updateData.emoji = validatedInput.emoji;
				if (validatedInput.color !== undefined) updateData.color = validatedInput.color;
				if (validatedInput.description !== undefined) updateData.description = validatedInput.description;
				if (validatedInput.presetId !== undefined) updateData.presetId = validatedInput.presetId;

				const committed = yield* Effect.tryPromise<
					{ result: Schema.Schema.Type<typeof Folder>[]; favoriteWrite: FavoriteWriteResult | null },
					FolderError
				>({
					try: () =>
						db.transaction(async (transaction: FavoriteWriteTransaction) => {
							const result = await transaction.update(folders).set(updateData).where(eq(folders.id, id)).returning();
							const favoriteWrite =
								requestedIsFavorite === undefined
									? null
									: await setFavoriteStateForActiveProfile(
											transaction,
											FavoriteEntityType.FOLDER,
											id,
											requestedIsFavorite
										);
							return { result, favoriteWrite };
						}),
					catch: (error: unknown) => fromUnknownError('update:update', error),
				});
				const { result, favoriteWrite } = committed;

				const favoriteEntityIds = yield* getFolderFavoriteIds();

				const updatedFolder = yield* Effect.try({
					try: () => decodeFolderRow(result[0], favoriteEntityIds),
					catch: (error: unknown) => fromUnknownError('update:validation:result', error),
				});

				logger.info('✅ Carpeta actualizada:', { id: updatedFolder.id, name: updatedFolder.name });

				if (favoriteWrite?.changed && requestedIsFavorite !== undefined) {
					yield* Effect.tryPromise({
						try: () =>
							emitCommittedFavoriteChange(favoriteWrite.profileId, FavoriteEntityType.FOLDER, id, requestedIsFavorite),
						catch: (error: unknown) => fromUnknownError('update:favoriteEvent', error),
					});
				}

				return yield* enrichFolderWithCounts(updatedFolder);
			}),

		/**
		 * Elimina una carpeta
		 */
		delete: (id: string, force = false) => deleteFolderInternal(id, force),

		/**
		 * Elimina múltiples carpetas
		 */
		bulkDelete: (ids: string[], force = false): Effect.Effect<BulkDeleteResult, FolderError> =>
			Effect.gen(function* () {
				logger.info('🗑️ Eliminación masiva:', { count: ids.length, force });

				const successful: string[] = [];
				const failed: Array<{ id: string; error: string }> = [];

				for (const id of ids) {
					const result = yield* Effect.either(deleteFolderInternal(id, force));
					if (result._tag === 'Right') {
						successful.push(id);
					} else {
						const error = result.left;
						failed.push({
							id,
							error: 'displayMessage' in error ? (error as any).displayMessage : String(error),
						});
					}
				}

				logger.info('✅ Eliminación masiva completada:', {
					successful: successful.length,
					failed: failed.length,
				});

				return { successful, failed };
			}) /*
		 * Obtiene el árbol completo de carpetas
		 */,
		getTree: () =>
			Effect.gen(function* () {
				logger.info('🌳 Obteniendo árbol completo de carpetas');

				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.select().from(folders).orderBy(asc(folders.name)),
					catch: (error: unknown) => fromUnknownError('getTree', error),
				});

				const favoriteEntityIds = yield* getFolderFavoriteIds();

				// Validar con Schema
				const validatedFolders = yield* Effect.try({
					try: () => result.map((f) => decodeFolderRow(f, favoriteEntityIds)),
					catch: (error: unknown) => fromUnknownError('getTree:validation', error),
				});

				// Batch enrichment: count children plus recursive files by physical path for sidebar tree badges
				const folderIds = validatedFolders.map((f) => f.id);
				const folderPaths = validatedFolders.map((folder) => folder.path);

				const [childrenCounts, imagePaths, videoPaths, audioPaths, documentPaths, jsonFilePaths, file3DPaths] =
					folderIds.length > 0
						? yield* Effect.tryPromise<
								[
									Array<{ id: string; count: number }>,
									Array<{ path: string; size: number }>,
									Array<{ path: string; size: number }>,
									Array<{ path: string; size: number }>,
									Array<{ path: string; size: number }>,
									Array<{ path: string; size: number }>,
									Array<{ path: string; size: number }>,
								],
								FolderError
							>({
								try: () =>
									Promise.all([
										db
											.select({ id: folders.parentId, count: count() })
											.from(folders)
											.where(inArray(folders.parentId, folderIds))
											.groupBy(folders.parentId),
										db
											.select({ path: images.path, size: images.size })
											.from(images)
											.where(and(buildRecursivePathWhere(images.path, folderPaths), visibleImageLifecycleCondition())),
										db
											.select({ path: videos.path, size: videos.size })
											.from(videos)
											.where(buildRecursivePathWhere(videos.path, folderPaths)),
										db
											.select({ path: audios.path, size: audios.size })
											.from(audios)
											.where(buildRecursivePathWhere(audios.path, folderPaths)),
										db
											.select({ path: documents.path, size: documents.size })
											.from(documents)
											.where(buildRecursivePathWhere(documents.path, folderPaths)),
										db
											.select({ path: jsonFiles.path, size: jsonFiles.size })
											.from(jsonFiles)
											.where(buildRecursivePathWhere(jsonFiles.path, folderPaths)),
										db
											.select({ path: file3Ds.path, size: file3Ds.size })
											.from(file3Ds)
											.where(buildRecursivePathWhere(file3Ds.path, folderPaths)),
									]),
								catch: (error: unknown) => fromUnknownError('getTree:counts', error),
							})
						: [[], [], [], [], [], [], []];

				const childrenMap = new Map(childrenCounts.map((r) => [r.id, r.count]));
				const folderEntries = validatedFolders.map((folder) => ({
					id: folder.id,
					normalizedPath: normalizePathForMatching(folder.path),
				}));
				const countsByFolderId = new Map(
					validatedFolders.map((folder) => [folder.id, createEmptyFileCounts()] as const)
				);
				const sizesByFolderId = new Map(validatedFolders.map((folder) => [folder.id, 0] as const));

				accumulatePathCounts(
					folderEntries,
					imagePaths.map((row) => row.path),
					'images',
					countsByFolderId
				);
				accumulatePathCounts(
					folderEntries,
					videoPaths.map((row) => row.path),
					'videos',
					countsByFolderId
				);
				accumulatePathCounts(
					folderEntries,
					audioPaths.map((row) => row.path),
					'audios',
					countsByFolderId
				);
				accumulatePathCounts(
					folderEntries,
					documentPaths.map((row) => row.path),
					'documents',
					countsByFolderId
				);
				accumulatePathCounts(
					folderEntries,
					jsonFilePaths.map((row) => row.path),
					'jsonFiles',
					countsByFolderId
				);
				accumulatePathCounts(
					folderEntries,
					file3DPaths.map((row) => row.path),
					'file3Ds',
					countsByFolderId
				);
				for (const fileRows of [imagePaths, videoPaths, audioPaths, documentPaths, jsonFilePaths, file3DPaths]) {
					accumulatePathSizes(folderEntries, fileRows, sizesByFolderId);
				}

				return validatedFolders.map((f) => {
					const fileCounts = countsByFolderId.get(f.id) ?? createEmptyFileCounts();
					return {
						...f,
						totalFiles: fileCounts.totalFiles,
						totalImages: fileCounts.images,
						totalSize: sizesByFolderId.get(f.id) ?? 0,
						totalVideos: fileCounts.videos,
						_count: {
							...fileCounts,
							children: childrenMap.get(f.id) ?? 0,
						},
					};
				}) as FolderWithStats[];
			}),

		/**
		 * Obtiene las subcarpetas de una carpeta (o carpetas raíz si parentId es null)
		 */
		getChildren: (parentId: string | null) =>
			Effect.gen(function* () {
				logger.info('👶 Obteniendo hijos de:', { parentId: parentId ?? 'ROOT' });

				const whereClause = parentId === null ? isNull(folders.parentId) : eq(folders.parentId, parentId);

				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.select().from(folders).where(whereClause).orderBy(asc(folders.name)),
					catch: (error: unknown) => fromUnknownError('getChildren', error),
				});

				const favoriteEntityIds = yield* getFolderFavoriteIds();

				// Validar con Schema
				const validatedFolders = yield* Effect.try({
					try: () => result.map((f) => decodeFolderRow(f, favoriteEntityIds)),
					catch: (error: unknown) => fromUnknownError('getChildren:validation', error),
				});

				logger.info(`✅ Hijos obtenidos: ${validatedFolders.length}`);

				// Enriquecer con conteos
				return yield* Effect.all(validatedFolders.map(enrichFolderWithCounts));
			}),

		/**
		 * Obtiene todos los ancestros de una carpeta
		 */
		getAncestors: (id: string) =>
			Effect.gen(function* () {
				logger.info(`🌳 Obteniendo ancestros de: ${id}`);

				// Verificar que la carpeta existe
				const folderResult = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.select().from(folders).where(eq(folders.id, id)),
					catch: (error: unknown) => fromUnknownError('getAncestors:fetch', error),
				});

				if (folderResult.length === 0) {
					return yield* Effect.fail(new FolderNotFound({ folderId: id }));
				}

				const favoriteEntityIds = yield* getFolderFavoriteIds();

				const ancestors: FolderWithStats[] = [];
				let currentId: string | null = folderResult[0].parentId;

				// Recorrer hacia arriba hasta la raíz
				while (currentId && ancestors.length < MAX_HIERARCHY_DEPTH) {
					const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
						try: async () =>
							await db
								.select()
								.from(folders)
								.where(eq(folders.id, currentId as string)),
						catch: (error: unknown) => fromUnknownError('getAncestors:loop', error),
					});

					if (result.length === 0) break;

					const ancestor = yield* Effect.try({
						try: () => decodeFolderRow(result[0], favoriteEntityIds),
						catch: (error: unknown) => fromUnknownError('getAncestors:validation', error),
					});

					const enrichedAncestor = yield* enrichFolderWithCounts(ancestor);
					ancestors.unshift(enrichedAncestor); // Agregar al inicio para mantener orden

					currentId = result[0].parentId;
				}

				logger.info(`✅ Ancestros obtenidos: ${ancestors.length}`);

				return {
					ancestors,
					depth: ancestors.length,
				};
			}),

		/**
		 * Mueve una carpeta a un nuevo padre
		 */
		moveTo: (id: string, newParentId: string | null) =>
			Effect.gen(function* () {
				logger.info('🚚 Moviendo carpeta:', { id, newParentId: newParentId ?? 'ROOT' });

				// Verificar que la carpeta existe
				const existingFolder = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.select().from(folders).where(eq(folders.id, id)),
					catch: (error: unknown) => fromUnknownError('moveTo:fetch', error),
				});

				if (existingFolder.length === 0) {
					return yield* Effect.fail(new FolderNotFound({ folderId: id }));
				}

				// Validar que el nuevo padre existe
				yield* validateParentExists(newParentId);

				// Verificar referencias circulares
				yield* checkNoCircularReference(id, newParentId);

				// Validar profundidad máxima
				if (newParentId) {
					const depth = yield* calculateDepth(newParentId);
					if (depth >= MAX_HIERARCHY_DEPTH) {
						return yield* Effect.fail(
							new FolderMaxDepthExceededError({ currentDepth: depth + 1, maxDepth: MAX_HIERARCHY_DEPTH })
						);
					}
				}

				// Validar nombre único en el nuevo padre
				yield* checkNameUnique(existingFolder[0].name, newParentId, id);

				// Actualizar parentId
				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () =>
						await db
							.update(folders)
							.set({ parentId: newParentId, updatedAt: new Date() })
							.where(eq(folders.id, id))
							.returning(),
					catch: (error: unknown) => fromUnknownError('moveTo:update', error),
				});

				const favoriteEntityIds = yield* getFolderFavoriteIds();

				const movedFolder = yield* Effect.try({
					try: () => decodeFolderRow(result[0], favoriteEntityIds),
					catch: (error: unknown) => fromUnknownError('moveTo:validation', error),
				});

				logger.info('✅ Carpeta movida:', { id: movedFolder.id, newParentId: movedFolder.parentId });

				return yield* enrichFolderWithCounts(movedFolder);
			}),

		/**
		 * Obtiene una carpeta por su path
		 */
		getByPath: (path: string) =>
			Effect.gen(function* () {
				logger.info(`🔍 Obteniendo carpeta por path: ${path}`);

				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.select().from(folders).where(eq(folders.path, path)),
					catch: (error: unknown) => fromUnknownError('getByPath', error),
				});

				if (result.length === 0) {
					logger.warn(`❌ Carpeta no encontrada por path: ${path}`);
					return yield* Effect.fail(new FolderNotFound({ folderId: path }));
				}

				const favoriteEntityIds = yield* getFolderFavoriteIds();

				const folder = yield* Effect.try({
					try: () => decodeFolderRow(result[0], favoriteEntityIds),
					catch: (error: unknown) => fromUnknownError('getByPath:validation', error),
				});

				logger.info('✅ Carpeta encontrada por path:', { id: folder.id, path: folder.path });

				return yield* enrichFolderWithCounts(folder);
			}),

		/**
		 * Alterna el estado de favorito de una carpeta
		 */
		toggleFavorite: (id: string) =>
			Effect.gen(function* () {
				logger.info(`⭐ Alternando favorito: ${id}`);

				// Verificar que existe
				const existingFolder = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.select().from(folders).where(eq(folders.id, id)),
					catch: (error: unknown) => fromUnknownError('toggleFavorite:fetch', error),
				});

				if (existingFolder.length === 0) {
					return yield* Effect.fail(new FolderNotFound({ folderId: id }));
				}

				const currentFavoriteStatus = yield* Effect.tryPromise({
					try: () => favoriteService.isFavorite(FavoriteEntityType.FOLDER, id),
					catch: (error: unknown) => fromUnknownError('toggleFavorite:isFavorite', error),
				});
				const newFavoriteStatus = !currentFavoriteStatus;

				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.FOLDER, id, newFavoriteStatus),
					catch: (error: unknown) => fromUnknownError('toggleFavorite:set', error),
				});

				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.select().from(folders).where(eq(folders.id, id)),
					catch: (error: unknown) => fromUnknownError('toggleFavorite:refetch', error),
				});

				const favoriteEntityIds = yield* getFolderFavoriteIds();

				const updatedFolder = yield* Effect.try({
					try: () => decodeFolderRow(result[0], favoriteEntityIds),
					catch: (error: unknown) => fromUnknownError('toggleFavorite:validation', error),
				});

				logger.info('✅ Favorito alternado:', { id: updatedFolder.id, isFavorite: updatedFolder.isFavorite });

				return yield* enrichFolderWithCounts(updatedFolder);
			}),
	})
);

// ============= Exports =============

export { FolderServiceLive };
