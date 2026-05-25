/**
 * =================================================================================
 * FILE3D SERVICE - EFFECT-TS
 * =================================================================================
 * Servicio de archivos 3D con Effect-TS para operaciones CRUD.
 * =================================================================================
 */

import * as crypto from 'node:crypto';
import { and, asc, count, desc, eq, gte, inArray, like, lte, notInArray, or } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { file3Ds } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import { normalizeCounts, sumCounts } from '@/transformers/common/counts';
import type { File3DWithStats } from '@/types/entities/file3d';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	File3DDatabaseError,
	File3DError,
	File3DHashConflict,
	File3DNotFound,
	File3DValidationError,
} from './file3d-errors.effect';

// =================================================================================
// TYPES & INTERFACES
// =================================================================================

const SERVICE_NAME = 'File3DServiceEffect';
const file3dLogger = serverLogger.withContext(SERVICE_NAME);

export interface CreateFile3DInput {
	name: string;
	path: string;
	size: number;
	hash: string;
	mimeType: string;
	extension: string;
	folderId: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	format?: string | null;
	version?: string | null;
	vertices?: number | null;
	faces?: number | null;
	triangles?: number | null;
	materials?: number | null;
	textures?: number | null;
	animations?: number | null;
	bones?: number | null;
	scenes?: number | null;
	cameras?: number | null;
	lights?: number | null;
	hasUV?: boolean;
	hasNormals?: boolean;
	hasColors?: boolean;
	boundingBox?: string | null;
}

export type UpdateFile3DInput = Partial<CreateFile3DInput>;

export interface File3DFilters {
	folderId?: string;
	search?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	mimeType?: string;
	extension?: string;
	format?: string;
	minSize?: number;
	maxSize?: number;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
	sortOrder?: 'asc' | 'desc';
}

export interface File3DRow {
	id: string;
	name: string;
	path: string;
	size: number;
	hash: string;
	mimeType: string;
	extension: string;
	folderId: string;
	isFavorite: boolean;
	isArchived: boolean;
	format: string | null;
	version: string | null;
	vertices: number | null;
	faces: number | null;
	triangles: number | null;
	materials: number | null;
	textures: number | null;
	animations: number | null;
	bones: number | null;
	scenes: number | null;
	cameras: number | null;
	lights: number | null;
	hasUV: boolean | null;
	hasNormals: boolean | null;
	hasColors: boolean | null;
	boundingBox: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	limit: number;
	offset: number;
}

// =================================================================================
// SERVICE INTERFACE & TAG
// =================================================================================

export interface File3DServiceInterface {
	readonly create: (input: CreateFile3DInput) => Effect.Effect<File3DRow, File3DError>;
	readonly delete: (id: string) => Effect.Effect<void, File3DError>;
	readonly getAll: (filters?: File3DFilters) => Effect.Effect<PaginatedResult<File3DRow>, File3DError>;
	readonly getByHash: (hash: string) => Effect.Effect<File3DRow | null, File3DError>;
	readonly getById: (id: string) => Effect.Effect<File3DRow, File3DError>;
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<File3DRow | null, File3DError>;
	readonly update: (id: string, input: UpdateFile3DInput) => Effect.Effect<File3DRow, File3DError>;
}

export class File3DService extends Context.Tag('File3DService')<File3DService, File3DServiceInterface>() {}

// =================================================================================
// HELPERS
// =================================================================================

function toFile3DError(operation: string, error: unknown): File3DError {
	file3dLogger.error(`Error en operación ${operation}:`, error);

	if (error && typeof error === 'object' && '_tag' in error) {
		return error as File3DError;
	}

	const message = error instanceof Error ? error.message : String(error);
	return new File3DDatabaseError({ operation, reason: message, originalError: error });
}

function validateCreateInput(input: CreateFile3DInput): void {
	if (!input.name || input.name.trim().length === 0) {
		throw new File3DValidationError({ field: 'name', value: input.name, reason: 'El nombre es requerido' });
	}
	if (!input.path || input.path.trim().length === 0) {
		throw new File3DValidationError({ field: 'path', value: input.path, reason: 'El path es requerido' });
	}
	if (!input.hash || input.hash.trim().length === 0) {
		throw new File3DValidationError({ field: 'hash', value: input.hash, reason: 'El hash es requerido' });
	}
	if (input.size < 0) {
		throw new File3DValidationError({ field: 'size', value: input.size, reason: 'El size no puede ser negativo' });
	}
	if (!input.mimeType) {
		throw new File3DValidationError({
			field: 'mimeType',
			value: input.mimeType,
			reason: 'El mimeType es requerido',
		});
	}
	if (!input.extension) {
		throw new File3DValidationError({
			field: 'extension',
			value: input.extension,
			reason: 'La extensión es requerida',
		});
	}
}

// =================================================================================
// IMPLEMENTATION
// =================================================================================

const make = (): File3DServiceInterface => {
	const getById = (id: string): Effect.Effect<File3DRow, File3DError> =>
		Effect.gen(function* () {
			file3dLogger.info('Obteniendo file3D por ID:', id);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select().from(file3Ds).where(eq(file3Ds.id, id)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toFile3DError('getById', error),
			});

			if (!result) {
				return yield* Effect.fail(
					new File3DNotFound({ id, message: `Archivo 3D con ID ${id} no encontrado` })
				);
			}

			return result as File3DRow;
		});

	const getByHash = (hash: string): Effect.Effect<File3DRow | null, File3DError> =>
		Effect.gen(function* () {
			file3dLogger.info('Buscando file3D por hash:', hash);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select().from(file3Ds).where(eq(file3Ds.hash, hash)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toFile3DError('getByHash', error),
			});

			return (result as File3DRow) ?? null;
		});

	const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<File3DRow | null, File3DError> =>
		Effect.gen(function* () {
			file3dLogger.info('Buscando file3D por path y folder:', { path, folderId });

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select()
						.from(file3Ds)
						.where(and(eq(file3Ds.path, path), eq(file3Ds.folderId, folderId)))
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toFile3DError('getByPathAndFolder', error),
			});

			return (result as File3DRow) ?? null;
		});

	const getAll = (filters: File3DFilters = {}): Effect.Effect<PaginatedResult<File3DRow>, File3DError> =>
		Effect.gen(function* () {
			file3dLogger.info('Obteniendo lista de file3Ds con filtros:', filters);

			const limit = filters.limit || 20;
			const offset = filters.offset || 0;

			const favoriteEntityIds: string[] | null =
				filters.isFavorite !== undefined
					? yield* Effect.tryPromise({
						try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.FILE_3D),
						catch: (error) => toFile3DError('getAll:favoriteIds', error),
					})
					: null;

			if (filters.isFavorite === true && favoriteEntityIds !== null && favoriteEntityIds.length === 0) {
				return { data: [], total: 0, limit, offset };
			}

			const conditions: any[] = [];

			if (filters.folderId) {
				conditions.push(eq(file3Ds.folderId, filters.folderId));
			}
			if (filters.search) {
				conditions.push(
					or(
						like(file3Ds.name, `%${filters.search}%`),
						like(file3Ds.format, `%${filters.search}%`)
					)
				);
			}
			if (filters.isFavorite !== undefined) {
				if (favoriteEntityIds === null) {
					conditions.push(eq(file3Ds.isFavorite, filters.isFavorite));
				} else if (filters.isFavorite) {
					conditions.push(inArray(file3Ds.id, favoriteEntityIds));
				} else if (favoriteEntityIds.length > 0) {
					conditions.push(notInArray(file3Ds.id, favoriteEntityIds));
				}
			}
			if (filters.isArchived !== undefined) {
				conditions.push(eq(file3Ds.isArchived, filters.isArchived));
			}
			if (filters.mimeType) {
				conditions.push(eq(file3Ds.mimeType, filters.mimeType));
			}
			if (filters.extension) {
				conditions.push(eq(file3Ds.extension, filters.extension));
			}
			if (filters.format) {
				conditions.push(eq(file3Ds.format, filters.format));
			}
			if (filters.minSize) {
				conditions.push(gte(file3Ds.size, filters.minSize));
			}
			if (filters.maxSize) {
				conditions.push(lte(file3Ds.size, filters.maxSize));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const sortBy = filters.sortBy || 'name';
			const orderFn = filters.sortOrder === 'desc' ? desc : asc;
			let orderByClause: any;
			switch (sortBy) {
				case 'createdAt':
					orderByClause = orderFn(file3Ds.createdAt);
					break;
				case 'updatedAt':
					orderByClause = orderFn(file3Ds.updatedAt);
					break;
				case 'size':
					orderByClause = orderFn(file3Ds.size);
					break;
				default:
					orderByClause = orderFn(file3Ds.name);
			}

			const [rows, totalResult] = yield* Effect.tryPromise({
				try: () =>
					Promise.all([
						db
							.select()
							.from(file3Ds)
							.where(whereClause)
							.orderBy(orderByClause)
							.limit(limit)
							.offset(offset),
						db
							.select({ count: count() })
							.from(file3Ds)
							.where(whereClause),
					]),
				catch: (error) => toFile3DError('getAll', error),
			});

			const total = totalResult[0]?.count ?? 0;

			return {
				data: rows as File3DRow[],
				total,
				limit,
				offset,
			};
		});

	const create = (input: CreateFile3DInput): Effect.Effect<File3DRow, File3DError> =>
		Effect.gen(function* () {
			file3dLogger.info('Creando file3D:', input.name);

			try {
				validateCreateInput(input);
			} catch (error) {
				return yield* Effect.fail(error as File3DError);
			}

			const requestedIsFavorite = input.isFavorite === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite === true
					? yield* Effect.tryPromise({
						try: async () =>
							(await favoriteService.getFavoriteEntityIds(FavoriteEntityType.FILE_3D)) !== null,
						catch: (error) => toFile3DError('create:favoriteScope', error),
					})
					: false;

			const existing = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select({ id: file3Ds.id }).from(file3Ds).where(eq(file3Ds.hash, input.hash)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toFile3DError('create:checkHash', error),
			});

			if (existing) {
				return yield* Effect.fail(
					new File3DHashConflict({
						hash: input.hash,
						existingId: existing.id,
						message: `Ya existe un archivo 3D con hash ${input.hash} (id: ${existing.id})`,
					})
				);
			}

			const result = yield* Effect.tryPromise({
				try: async () => {
					const inserted = await db
						.insert(file3Ds)
						.values({
							id: crypto.randomUUID(),
							name: input.name,
							path: input.path,
							size: input.size,
							hash: input.hash,
							mimeType: input.mimeType,
							extension: input.extension,
							folderId: input.folderId,
							isFavorite: requestedIsFavorite && !useCanonicalFavoriteBridge,
							isArchived: input.isArchived ?? false,
							format: input.format ?? null,
							version: input.version ?? null,
							vertices: input.vertices ?? null,
							faces: input.faces ?? null,
							triangles: input.triangles ?? null,
							materials: input.materials ?? null,
							textures: input.textures ?? null,
							animations: input.animations ?? null,
							bones: input.bones ?? null,
							scenes: input.scenes ?? null,
							cameras: input.cameras ?? null,
							lights: input.lights ?? null,
							hasUV: input.hasUV ?? false,
							hasNormals: input.hasNormals ?? false,
							hasColors: input.hasColors ?? false,
							boundingBox: input.boundingBox ?? null,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning();
					return inserted[0];
				},
				catch: (error) => toFile3DError('create:insert', error),
			});

			if (!result) {
				return yield* Effect.fail(
					new File3DDatabaseError({
						operation: 'create',
						reason: 'No se pudo crear el archivo 3D',
					})
				);
			}

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.FILE_3D, result.id, true),
					catch: (error) => toFile3DError('create:favoriteBridge', error),
				});
			}

			file3dLogger.info('File3D creado exitosamente:', result.id);
			return result as File3DRow;
		});

	const update = (id: string, input: UpdateFile3DInput): Effect.Effect<File3DRow, File3DError> =>
		Effect.gen(function* () {
			file3dLogger.info('Actualizando file3D:', id);

			yield* getById(id);

			const requestedIsFavorite =
				typeof input.isFavorite === 'boolean' ? input.isFavorite : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise({
						try: async () =>
							(await favoriteService.getFavoriteEntityIds(FavoriteEntityType.FILE_3D)) !== null,
						catch: (error) => toFile3DError('update:favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.FILE_3D, id, requestedIsFavorite),
					catch: (error) => toFile3DError('update:favoriteBridge', error),
				});
			}

			const updateData: Record<string, unknown> = { updatedAt: new Date() };

			if (input.name !== undefined) updateData.name = input.name;
			if (input.path !== undefined) updateData.path = input.path;
			if (input.size !== undefined) updateData.size = input.size;
			if (input.hash !== undefined) updateData.hash = input.hash;
			if (input.mimeType !== undefined) updateData.mimeType = input.mimeType;
			if (input.extension !== undefined) updateData.extension = input.extension;
			if (input.folderId !== undefined) updateData.folderId = input.folderId;
			if (input.isFavorite !== undefined && !useCanonicalFavoriteBridge) updateData.isFavorite = Boolean(input.isFavorite);
			if (input.isArchived !== undefined) updateData.isArchived = Boolean(input.isArchived);
			if (input.format !== undefined) updateData.format = input.format;
			if (input.version !== undefined) updateData.version = input.version;
			if (input.vertices !== undefined) updateData.vertices = input.vertices;
			if (input.faces !== undefined) updateData.faces = input.faces;
			if (input.triangles !== undefined) updateData.triangles = input.triangles;
			if (input.materials !== undefined) updateData.materials = input.materials;
			if (input.textures !== undefined) updateData.textures = input.textures;
			if (input.animations !== undefined) updateData.animations = input.animations;
			if (input.bones !== undefined) updateData.bones = input.bones;
			if (input.scenes !== undefined) updateData.scenes = input.scenes;
			if (input.cameras !== undefined) updateData.cameras = input.cameras;
			if (input.lights !== undefined) updateData.lights = input.lights;
			if (input.hasUV !== undefined) updateData.hasUV = Boolean(input.hasUV);
			if (input.hasNormals !== undefined) updateData.hasNormals = Boolean(input.hasNormals);
			if (input.hasColors !== undefined) updateData.hasColors = Boolean(input.hasColors);
			if (input.boundingBox !== undefined) updateData.boundingBox = input.boundingBox;

			const result = yield* Effect.tryPromise({
				try: async () => {
					const updated = await db
						.update(file3Ds)
						.set(updateData)
						.where(eq(file3Ds.id, id))
						.returning();
					return updated[0];
				},
				catch: (error) => toFile3DError('update', error),
			});

			if (!result) {
				return yield* Effect.fail(
					new File3DDatabaseError({
						operation: 'update',
						reason: 'No se pudo actualizar el archivo 3D',
					})
				);
			}

			file3dLogger.info('File3D actualizado exitosamente:', result.id);
			return result as File3DRow;
		});

	const deleteFile3D = (id: string): Effect.Effect<void, File3DError> =>
		Effect.gen(function* () {
			file3dLogger.info('Eliminando file3D:', id);

			yield* getById(id);

			yield* Effect.tryPromise({
				try: () => db.delete(file3Ds).where(eq(file3Ds.id, id)),
				catch: (error) => toFile3DError('delete', error),
			});

			file3dLogger.info('File3D eliminado exitosamente:', id);
		});

	return {
		getById,
		getByHash,
		getByPathAndFolder,
		getAll,
		create,
		update,
		delete: deleteFile3D,
	};
};

// =================================================================================
// LAYER
// =================================================================================

export const File3DServiceLive = Layer.succeed(File3DService, make());

// =================================================================================
// INDIVIDUAL FUNCTION EXPORTS
// =================================================================================

export const create = (input: CreateFile3DInput): Effect.Effect<File3DRow, File3DError> => make().create(input);

export const getById = (id: string): Effect.Effect<File3DRow, File3DError> => make().getById(id);

export const getByHash = (hash: string): Effect.Effect<File3DRow | null, File3DError> => make().getByHash(hash);

export const getByPathAndFolder = (
	path: string,
	folderId: string
): Effect.Effect<File3DRow | null, File3DError> => make().getByPathAndFolder(path, folderId);

export const getAll = (
	filters?: File3DFilters
): Effect.Effect<PaginatedResult<File3DRow>, File3DError> => make().getAll(filters);

export const update = (
	id: string,
	input: UpdateFile3DInput
): Effect.Effect<File3DRow, File3DError> => make().update(id, input);

const f3dDelete = (id: string): Effect.Effect<void, File3DError> => make().delete(id);
export { f3dDelete as delete };
