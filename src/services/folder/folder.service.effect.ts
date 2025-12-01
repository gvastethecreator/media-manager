/**
 * @file FolderService implementado con Effect
 * @module services/folder/folder.service.effect
 * @description Servicio Folder con operaciones CRUD + jerárquicas usando Effect-TS
 * @created 2025-10-11 - Fase 4 Effect Implementation
 */

import { Effect, Context, Layer } from 'effect';
import { Schema } from '@effect/schema';
import { and, asc, count, desc, eq, like, or, sql, isNull } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { Folder, FolderCreateInput, FolderUpdateInput } from '@/lib/effect/schemas/entities';
import {
	type FolderError,
	FolderNotFound,
	FolderPathConflict,
	FolderNameConflict,
	FolderValidationError,
	FolderHasChildrenError,
	FolderHasContentError,
	FolderCircularReferenceError,
	FolderMaxDepthExceededError,
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
	search?: string;
	onlyFavorites?: boolean;
	parentId?: string | null;
	limit?: number;
	offset?: number;
	orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'totalFiles';
	orderDirection?: 'asc' | 'desc';
}

/**
 * Resultado de obtener folders con paginación
 */
export interface GetFoldersResult {
	folders: FolderWithStats[];
	total: number;
	limit: number;
	offset: number;
}

/**
 * Contadores de relaciones de una carpeta
 */
export interface FolderCounts {
	children: number;
	images: number;
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
	successful: string[];
	failed: Array<{ id: string; error: string }>;
}

/**
 * Interface para el servicio FolderService
 */
export interface FolderServiceInterface {
	// CRUD Básico
	readonly getById: (id: string) => Effect.Effect<FolderWithStats, FolderError>;
	readonly getAll: (options?: GetFoldersOptions) => Effect.Effect<GetFoldersResult, FolderError>;
	readonly create: (input: Schema.Schema.Type<typeof FolderCreateInput>) => Effect.Effect<FolderWithStats, FolderError>;
	readonly update: (
		id: string,
		input: Schema.Schema.Type<typeof FolderUpdateInput>
	) => Effect.Effect<FolderWithStats, FolderError>;
	readonly delete: (id: string, force?: boolean) => Effect.Effect<void, FolderError>;
	readonly bulkDelete: (ids: string[], force?: boolean) => Effect.Effect<BulkDeleteResult, FolderError>;

	// Operaciones Jerárquicas
	readonly getChildren: (parentId: string | null) => Effect.Effect<FolderWithStats[], FolderError>;
	readonly getAncestors: (id: string) => Effect.Effect<FolderAncestors, FolderError>;
	readonly moveTo: (id: string, newParentId: string | null) => Effect.Effect<FolderWithStats, FolderError>;
	readonly getByPath: (path: string) => Effect.Effect<FolderWithStats, FolderError>;

	// Stats & Favorites
	readonly toggleFavorite: (id: string) => Effect.Effect<FolderWithStats, FolderError>;
}

/**
 * Context.Tag para FolderService
 */
export class FolderService extends Context.Tag('FolderService')<FolderService, FolderServiceInterface>() {}

// ============= Helpers =============

/**
 * Obtiene conteos de relaciones para una carpeta
 */
const getRelationsCounts = (folderId: string): Effect.Effect<FolderCounts, FolderError> =>
	Effect.gen(function* () {
		logger.info(`📊 Obteniendo conteos para carpeta: ${folderId}`);

		// Contar subcarpetas
		const childrenCountResult = yield* Effect.tryPromise<Array<{ count: number }>, FolderError>({
			try: async () => await db.select({ count: count() }).from(folders).where(eq(folders.parentId, folderId)),
			catch: (error: unknown) => fromUnknownError('getRelationsCounts:children', error),
		});

		const childrenCount = childrenCountResult[0]?.count ?? 0;

		// TODO: Agregar conteos de imágenes y videos cuando estén implementadas las relaciones
		const imageCount = 0;
		const videoCount = 0;

		logger.info(`✅ Conteos obtenidos:`, { childrenCount, imageCount, videoCount });

		return {
			children: childrenCount,
			images: imageCount,
			videos: videoCount,
		};
	});

/**
 * Enriquece una carpeta con conteos de relaciones
 */
const enrichFolderWithCounts = (
	folder: Schema.Schema.Type<typeof Folder>
): Effect.Effect<FolderWithStats, FolderError> =>
	Effect.gen(function* () {
		const counts = yield* getRelationsCounts(folder.id);

		return {
			...folder,
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
		logger.info(`🗑️ Eliminando carpeta:`, { id, force });

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

		// Eliminar carpeta
		yield* Effect.tryPromise<void, FolderError>({
			try: async () => {
				await db.delete(folders).where(eq(folders.id, id));
			},
			catch: (error: unknown) => fromUnknownError('delete:delete', error),
		});

		logger.info(`✅ Carpeta eliminada:`, { id });
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

				// Validar con Schema
				const folder = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(Folder)(result[0]),
					catch: (error: unknown) => fromUnknownError('getById:validation', error),
				});

				logger.info(`✅ Carpeta encontrada:`, { id: folder.id, name: folder.name });

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

				logger.info(`📋 Obteniendo carpetas:`, { search, onlyFavorites, parentId, limit, offset });

				// Construir condiciones WHERE
				const conditions: any[] = [];

				if (search) {
					conditions.push(or(like(folders.name, `%${search}%`), like(folders.path, `%${search}%`)));
				}

				if (onlyFavorites) {
					conditions.push(eq(folders.isFavorite, true));
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
					try: () => result.map((f) => Schema.decodeUnknownSync(Folder)(f)),
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
				logger.info(`➕ Creando carpeta:`, { name: input.name, parentId: input.parentId });

				// Validar input
				const validatedInput = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(FolderCreateInput)(input),
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
				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () =>
						await db
							.insert(folders)
							.values({
								name: validatedInput.name,
								path: validatedInput.path,
								parentId: validatedInput.parentId ?? null,
								isFavorite: validatedInput.isFavorite ?? false,
								totalFiles: 0,
								totalSize: 0,
							})
							.returning(),
					catch: (error: unknown) => fromUnknownError('create:insert', error),
				});

				const createdFolder = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(Folder)(result[0]),
					catch: (error: unknown) => fromUnknownError('create:validation:result', error),
				});

				logger.info(`✅ Carpeta creada:`, { id: createdFolder.id, name: createdFolder.name });

				return yield* enrichFolderWithCounts(createdFolder);
			}),

		/**
		 * Actualiza una carpeta existente
		 */
		update: (id: string, input: Schema.Schema.Type<typeof FolderUpdateInput>) =>
			Effect.gen(function* () {
				logger.info(`🔧 Actualizando carpeta:`, { id, updates: input });

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
					try: () => Schema.decodeUnknownSync(FolderUpdateInput)(input),
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
				if (validatedInput.isFavorite !== undefined) updateData.isFavorite = validatedInput.isFavorite;

				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.update(folders).set(updateData).where(eq(folders.id, id)).returning(),
					catch: (error: unknown) => fromUnknownError('update:update', error),
				});

				const updatedFolder = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(Folder)(result[0]),
					catch: (error: unknown) => fromUnknownError('update:validation:result', error),
				});

				logger.info(`✅ Carpeta actualizada:`, { id: updatedFolder.id, name: updatedFolder.name });

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
			logger.info(`🗑️ Eliminación masiva:`, { count: ids.length, force });

			const successful: string[] = [];
			const failed: Array<{ id: string; error: string }> = [];

			for (const id of ids) {
				const result = yield* Effect.either(deleteFolderInternal(id, force));				if (result._tag === 'Right') {
					successful.push(id);
				} else {
					const error = result.left;
					failed.push({
						id,
						error: 'displayMessage' in error ? (error as any).displayMessage : String(error),
					});
				}
			}

			logger.info(`✅ Eliminación masiva completada:`, {
				successful: successful.length,
				failed: failed.length,
			});

			return { successful, failed };
		}),		/**
		 * Obtiene las subcarpetas de una carpeta (o carpetas raíz si parentId es null)
		 */
		getChildren: (parentId: string | null) =>
			Effect.gen(function* () {
				logger.info(`👶 Obteniendo hijos de:`, { parentId: parentId ?? 'ROOT' });

				const whereClause = parentId === null ? isNull(folders.parentId) : eq(folders.parentId, parentId);

				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () => await db.select().from(folders).where(whereClause).orderBy(asc(folders.name)),
					catch: (error: unknown) => fromUnknownError('getChildren', error),
				});

				// Validar con Schema
				const validatedFolders = yield* Effect.try({
					try: () => result.map((f) => Schema.decodeUnknownSync(Folder)(f)),
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
						try: () => Schema.decodeUnknownSync(Folder)(result[0]),
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
				logger.info(`🚚 Moviendo carpeta:`, { id, newParentId: newParentId ?? 'ROOT' });

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

				const movedFolder = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(Folder)(result[0]),
					catch: (error: unknown) => fromUnknownError('moveTo:validation', error),
				});

				logger.info(`✅ Carpeta movida:`, { id: movedFolder.id, newParentId: movedFolder.parentId });

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

				const folder = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(Folder)(result[0]),
					catch: (error: unknown) => fromUnknownError('getByPath:validation', error),
				});

				logger.info(`✅ Carpeta encontrada por path:`, { id: folder.id, path: folder.path });

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

				// Alternar favorito
				const newFavoriteStatus = !existingFolder[0].isFavorite;

				const result = yield* Effect.tryPromise<Schema.Schema.Type<typeof Folder>[], FolderError>({
					try: async () =>
						await db
							.update(folders)
							.set({ isFavorite: newFavoriteStatus, updatedAt: new Date() })
							.where(eq(folders.id, id))
							.returning(),
					catch: (error: unknown) => fromUnknownError('toggleFavorite:update', error),
				});

				const updatedFolder = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(Folder)(result[0]),
					catch: (error: unknown) => fromUnknownError('toggleFavorite:validation', error),
				});

				logger.info(`✅ Favorito alternado:`, { id: updatedFolder.id, isFavorite: updatedFolder.isFavorite });

				return yield* enrichFolderWithCounts(updatedFolder);
			}),
	})
);

// ============= Exports =============

export { FolderServiceLive };
