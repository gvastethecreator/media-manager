/**
 * 🗂️ Servicio para la entidad JsonFile
 * @file Servicio de JsonFile con lógica de negocio
 * @module services/json-file.service
 * @description Capa de servicio para la entidad JsonFile que maneja la lógica de negocio
 * @updated 2025-06-27
 */

import * as crypto from 'crypto';
import { asc, count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { jsonFiles } from '@/lib/drizzle/schema/index';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { favoriteService } from '@/services/favorite/favorite.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats/stats.service';
import { fromDrizzleJsonFile, fromDrizzleJsonFiles } from '@/transformers/json-file/transformer';
import type { JsonFileCreateInput, JsonFileUpdateInput, JsonFileWithStats } from '@/types/entities/json-file';
import { FavoriteEntityType } from '@/types/entities/favorite';

const jsonFileLogger = serverLogger.withContext('JsonFileService');

// Función auxiliar para crear errores
const createJsonFileError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('JsonFileError', message, code, cause);
};

const normalizeJsonFileFavorite = <TJsonFile extends { id: string; isFavorite?: boolean | null }>(
	jsonFile: TJsonFile,
	favoriteEntityIds: string[] | null
): TJsonFile & { isFavorite: boolean } => {
	if (favoriteEntityIds === null) {
		return {
			...jsonFile,
			isFavorite: Boolean(jsonFile.isFavorite),
		};
	}

	const favoriteEntityIdSet = new Set(favoriteEntityIds);
	return {
		...jsonFile,
		isFavorite: favoriteEntityIdSet.has(jsonFile.id),
	};
};

const normalizeJsonFileFavorites = <TJsonFile extends { id: string; isFavorite?: boolean | null }>(
	jsonFileRows: TJsonFile[],
	favoriteEntityIds: string[] | null
): Array<TJsonFile & { isFavorite: boolean }> => {
	if (favoriteEntityIds === null) {
		return jsonFileRows.map((jsonFile) => ({
			...jsonFile,
			isFavorite: Boolean(jsonFile.isFavorite),
		}));
	}

	const favoriteEntityIdSet = new Set(favoriteEntityIds);
	return jsonFileRows.map((jsonFile) => ({
		...jsonFile,
		isFavorite: favoriteEntityIdSet.has(jsonFile.id),
	}));
};

// (Eventos específicos no usados actualmente; se emite 'files:modified' y STATS_EVENTS)

/**
 * Obtiene todos los archivos JSON con sus estadísticas
 */
export async function getJsonFiles(): Promise<JsonFileWithStats[]> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		jsonFileLogger.info('🗂️ Obteniendo archivos JSON');
		const favoriteEntityIds = await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE);

		const drizzleJsonFiles = await db
			.select({
				id: jsonFiles.id,
				name: jsonFiles.name,
				description: jsonFiles.description,
				emoji: jsonFiles.emoji,
				color: jsonFiles.color,
				shortcut: jsonFiles.shortcut,
				category: jsonFiles.category,
				filePath: jsonFiles.filePath,
				fileName: jsonFiles.fileName,
				fileSize: jsonFiles.fileSize,
				mimeType: jsonFiles.mimeType,
				content: jsonFiles.content,
				schema: jsonFiles.schema,
				tags: jsonFiles.tags,
				metadata: jsonFiles.metadata,
				sortBy: jsonFiles.sortBy,
				filters: jsonFiles.filters,
				featuredImage: jsonFiles.featuredImage,
				isFavorite: jsonFiles.isFavorite,
				createdAt: jsonFiles.createdAt,
				updatedAt: jsonFiles.updatedAt,
			})
			.from(jsonFiles)
			.orderBy(asc(jsonFiles.name));

		// Transformar a formato compatible con transformadores legacy
		const transformedJsonFiles = normalizeJsonFileFavorites(drizzleJsonFiles, favoriteEntityIds);

		return fromDrizzleJsonFiles(transformedJsonFiles as any);
	} catch (error) {
		jsonFileLogger.error('Error obteniendo archivos JSON:', { error });
		throw new Error('Error al obtener archivos JSON');
	}
}

/**
 * Obtiene un archivo JSON por su ID
 */
export async function getJsonFileById(id: string): Promise<JsonFileWithStats | null> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		jsonFileLogger.info(`🔍 Obteniendo archivo JSON por ID: ${id}`);
		const favoriteEntityIds = await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE);

		const drizzleJsonFile = await db
			.select({
				id: jsonFiles.id,
				name: jsonFiles.name,
				description: jsonFiles.description,
				emoji: jsonFiles.emoji,
				color: jsonFiles.color,
				shortcut: jsonFiles.shortcut,
				category: jsonFiles.category,
				filePath: jsonFiles.filePath,
				fileName: jsonFiles.fileName,
				fileSize: jsonFiles.fileSize,
				mimeType: jsonFiles.mimeType,
				content: jsonFiles.content,
				schema: jsonFiles.schema,
				tags: jsonFiles.tags,
				metadata: jsonFiles.metadata,
				sortBy: jsonFiles.sortBy,
				filters: jsonFiles.filters,
				featuredImage: jsonFiles.featuredImage,
				isFavorite: jsonFiles.isFavorite,
				createdAt: jsonFiles.createdAt,
				updatedAt: jsonFiles.updatedAt,
			})
			.from(jsonFiles)
			.where(eq(jsonFiles.id, id))
			.limit(1);

		if (drizzleJsonFile.length === 0) {
			jsonFileLogger.warn(`Archivo JSON no encontrado: ${id}`);
			return null;
		}

		const rawJsonFile = drizzleJsonFile[0];

		// Transformar a formato compatible con transformadores legacy
		const transformedJsonFile = normalizeJsonFileFavorite(rawJsonFile, favoriteEntityIds);

		return fromDrizzleJsonFile(transformedJsonFile as any);
	} catch (error) {
		jsonFileLogger.error('Error obteniendo archivo JSON por ID:', { id, error });
		throw new Error('Error al obtener archivo JSON');
	}
}

/**
 * Crea un nuevo archivo JSON
 */
export async function createJsonFile(data: JsonFileCreateInput): Promise<JsonFileWithStats> {
	try {
		jsonFileLogger.info('🗂️ Creando archivo JSON:', data.name);
		const jsonFileId = crypto.randomUUID();
		const requestedIsFavorite = data.isFavorite === true;
		const favoriteEntityIds = await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE);
		const useCanonicalFavoriteBridge = requestedIsFavorite && favoriteEntityIds !== null;

		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.insert(jsonFiles)
			.values({
				id: jsonFileId,
				name: data.name,
				path: data.path,
				size: data.size,
				hash: data.hash,
				mimeType: data.mimeType,
				extension: data.extension,
				folderId: data.folderId,
				isFavorite: useCanonicalFavoriteBridge ? false : Boolean(data.isFavorite),
				isArchived: data.isArchived,
				isValid: true,
				schema: data.schema || null,
				validationErrors: data.validationErrors || null,
				keyCount: data.keyCount || 0,
				depth: data.depth || 0,
				content: data.content || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		const newJsonFile = result[0];

		if (useCanonicalFavoriteBridge) {
			try {
				await favoriteService.set(FavoriteEntityType.JSON_FILE, jsonFileId, true);
			} catch (error) {
				await db.delete(jsonFiles).where(eq(jsonFiles.id, jsonFileId));
				throw error;
			}
		}

		const jsonFileWithStats = await getJsonFileById(jsonFileId);
		if (!jsonFileWithStats) {
			throw createJsonFileError('No se pudo obtener el archivo JSON creado', EntityErrorCode.OPERATION_FAILED);
		}

		// Emitir eventos
		await emit({
			type: 'files:modified',
			data: { action: 'create', jsonFile: newJsonFile },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		jsonFileLogger.info('✅ Archivo JSON creado:', jsonFileWithStats.name);
		return jsonFileWithStats;
	} catch (error) {
		jsonFileLogger.error('❌ Error al crear archivo JSON:', error);
		throw createJsonFileError('No se pudo crear el archivo JSON', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un archivo JSON existente
 */
export async function updateJsonFile(
	id: string,
	data: JsonFileUpdateInput & { validJson?: boolean }
): Promise<JsonFileWithStats> {
	try {
		jsonFileLogger.info('🔄 Actualizando archivo JSON:', id);
		const requestedIsFavorite = typeof data.isFavorite === 'boolean' ? data.isFavorite : undefined;
		const favoriteEntityIds =
			requestedIsFavorite === undefined
				? null
				: await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE);
		const useCanonicalFavoriteBridge = favoriteEntityIds !== null && requestedIsFavorite !== undefined;

		// Verificar que el archivo JSON existe
		const exists = await jsonFileExists(id);
		if (!exists) {
			throw createJsonFileError('Archivo JSON no encontrado', EntityErrorCode.ENTITY_NOT_FOUND);
		}

		// **MIGRACIÓN A DRIZZLE**
		// Solo actualizar campos que están presentes en data
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (data.name !== undefined) {
			updateData.name = data.name;
		}
		if (data.path !== undefined) {
			updateData.path = data.path;
		}
		if (data.size !== undefined) {
			updateData.size = data.size;
		}
		if (data.hash !== undefined) {
			updateData.hash = data.hash;
		}
		if (data.mimeType !== undefined) {
			updateData.mimeType = data.mimeType;
		}
		if (data.extension !== undefined) {
			updateData.extension = data.extension;
		}
		if (data.folderId !== undefined) {
			updateData.folderId = data.folderId;
		}
		if (data.isFavorite !== undefined && !useCanonicalFavoriteBridge) {
			updateData.isFavorite = Boolean(data.isFavorite);
		}
		if (data.isArchived !== undefined) {
			updateData.isArchived = Boolean(data.isArchived);
		}
		if (data.isValid !== undefined) {
			updateData.isValid = Boolean(data.isValid);
		}
		if (data.schema !== undefined) {
			updateData.schema = data.schema;
		}
		if (data.validationErrors !== undefined) {
			updateData.validationErrors = data.validationErrors;
		}
		if (data.keyCount !== undefined) {
			updateData.keyCount = Number(data.keyCount) || 0;
		}
		if (data.depth !== undefined) {
			updateData.depth = Number(data.depth) || 0;
		}
		if (data.content !== undefined) {
			updateData.content = data.content;
		}

		const result = await db.update(jsonFiles).set(updateData).where(eq(jsonFiles.id, id)).returning();

		if (useCanonicalFavoriteBridge) {
			await favoriteService.set(FavoriteEntityType.JSON_FILE, id, requestedIsFavorite);
		}

		const updatedJsonFile = result[0];
		const jsonFileWithStats = await getJsonFileById(id);
		if (!jsonFileWithStats) {
			throw createJsonFileError('No se pudo obtener el archivo JSON actualizado', EntityErrorCode.OPERATION_FAILED);
		}

		// Emitir eventos
		await emit({
			type: 'files:modified',
			data: { action: 'update', jsonFile: updatedJsonFile },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		jsonFileLogger.info('✅ Archivo JSON actualizado:', jsonFileWithStats.name);
		return jsonFileWithStats;
	} catch (error) {
		jsonFileLogger.error('❌ Error al actualizar archivo JSON:', error);
		throw createJsonFileError('No se pudo actualizar el archivo JSON', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un archivo JSON
 */
export async function deleteJsonFile(id: string): Promise<void> {
	try {
		jsonFileLogger.info('🗑️ Eliminando archivo JSON:', id);

		// Verificar que el archivo JSON existe
		const exists = await jsonFileExists(id);
		if (!exists) {
			throw createJsonFileError('Archivo JSON no encontrado', EntityErrorCode.ENTITY_NOT_FOUND);
		}

		// **MIGRACIÓN A DRIZZLE**
		const result = await db.delete(jsonFiles).where(eq(jsonFiles.id, id)).returning();

		const deletedJsonFile = result[0];

		// Emitir eventos
		await emit({
			type: 'files:modified',
			data: { action: 'delete', jsonFile: deletedJsonFile },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		jsonFileLogger.info('✅ Archivo JSON eliminado:', deletedJsonFile.name);
	} catch (error) {
		jsonFileLogger.error('❌ Error al eliminar archivo JSON:', error);
		throw createJsonFileError('No se pudo eliminar el archivo JSON', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Verifica si un archivo JSON existe
 */
export async function jsonFileExists(id: string): Promise<boolean> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const result = await db.select({ count: count() }).from(jsonFiles).where(eq(jsonFiles.id, id));

		return result[0].count > 0;
	} catch (error) {
		jsonFileLogger.error('❌ Error verificando existencia de archivo JSON:', { id, error });
		return false;
	}
}

/**
 * Obtiene el conteo total de archivos JSON
 */
export async function getJsonFileCount(): Promise<number> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const result = await db.select({ count: count() }).from(jsonFiles);

		return result[0].count;
	} catch (error) {
		jsonFileLogger.error('❌ Error obteniendo conteo de archivos JSON:', error);
		throw createJsonFileError('No se pudo obtener el conteo de archivos JSON', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Busca un archivo JSON por su hash
 */
export async function getJsonFileByHash(hash: string): Promise<JsonFileWithStats | null> {
	try {
		const favoriteEntityIds = await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE);
		const result = await db.select().from(jsonFiles).where(eq(jsonFiles.hash, hash)).limit(1);
		return result[0]
			? (fromDrizzleJsonFile(normalizeJsonFileFavorite(result[0] as any, favoriteEntityIds) as any) as JsonFileWithStats)
			: null;
	} catch (error) {
		return null;
	}
}
