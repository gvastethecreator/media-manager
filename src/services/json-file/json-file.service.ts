/**
 * 🗂️ Servicio para la entidad JsonFile
 * @file Servicio de JsonFile con lógica de negocio
 * @module services/json-file.service
 * @description Capa de servicio para la entidad JsonFile que maneja la lógica de negocio
 * @updated 2025-06-27
 */

import type { Prisma } from '@prisma/client';
// Drizzle imports
import { db } from '@/lib/drizzle';
import { jsonFiles } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { fromPrismaJsonFile, fromPrismaJsonFiles } from '@/transformers/json-file/transformer';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import { asc, eq } from 'drizzle-orm';

const jsonFileLogger = serverLogger.withContext('JsonFileService');

// Constantes para los tipos de eventos
const EVENTS = {
	JSON_FILE_CREATED: 'json-file:created',
	JSON_FILE_UPDATED: 'json-file:updated',
	JSON_FILE_DELETED: 'json-file:deleted',
	JSON_FILES_CHANGED: 'json-files:changed',
};

// Mapeo de eventos a EventType - usar eventos existentes
const EVENT_TYPE_MAPPING: Record<string, EventType> = {
	[EVENTS.JSON_FILE_CREATED]: 'create',
	[EVENTS.JSON_FILE_UPDATED]: 'update',
	[EVENTS.JSON_FILE_DELETED]: 'delete',
	[EVENTS.JSON_FILES_CHANGED]: 'update',
};

/**
 * Obtiene todos los archivos JSON con sus estadísticas
 */
export async function getJsonFiles(): Promise<JsonFileWithStats[]> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		jsonFileLogger.info('🗂️ Obteniendo archivos JSON');

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

		// Transformar a formato compatible con Prisma
		const transformedJsonFiles = drizzleJsonFiles.map((rawJsonFile) => ({
			...rawJsonFile,
			isFavorite: Boolean(rawJsonFile.isFavorite),
		}));

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prismaJsonFiles = await prisma.jsonFile.findMany({
					orderBy: { name: 'asc' },
				});

				if (Math.abs(transformedJsonFiles.length - prismaJsonFiles.length) > 0) {
					jsonFileLogger.warn('⚠️ Diferencia en conteo getJsonFiles:', {
						drizzle: transformedJsonFiles.length,
						prisma: prismaJsonFiles.length
					});
				} else {
					jsonFileLogger.info('✅ Validación dual exitosa getJsonFiles:', {
						total: transformedJsonFiles.length
					});
				}
			} catch (validationError) {
				jsonFileLogger.error('❌ Error en validación dual getJsonFiles:', validationError);
			}
		}

		return fromPrismaJsonFiles(transformedJsonFiles as any);
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

		// Transformar a formato compatible con Prisma
		const transformedJsonFile = {
			...rawJsonFile,
			isFavorite: Boolean(rawJsonFile.isFavorite),
		};

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prismaJsonFile = await prisma.jsonFile.findUnique({
					where: { id },
				});

				if (prismaJsonFile && transformedJsonFile) {
					jsonFileLogger.info('✅ Validación dual exitosa getJsonFileById:', {
						jsonFileName: transformedJsonFile.name
					});
				} else if (!prismaJsonFile && !transformedJsonFile) {
					jsonFileLogger.info('✅ Validación dual exitosa getJsonFileById: ambos null');
				} else {
					jsonFileLogger.warn('⚠️ Diferencia en getJsonFileById:', {
						drizzleFound: !!transformedJsonFile,
						prismaFound: !!prismaJsonFile
					});
				}
			} catch (validationError) {
				jsonFileLogger.error('❌ Error en validación dual getJsonFileById:', validationError);
			}
		}

		return fromPrismaJsonFile(transformedJsonFile as any);
	} catch (error) {
		jsonFileLogger.error('Error obteniendo archivo JSON por ID:', { id, error });
		throw new Error('Error al obtener archivo JSON');
	}
}

/**
 * Crea un nuevo archivo JSON
 */
export async function createJsonFile(data: Prisma.JsonFileCreateInput): Promise<JsonFileWithStats> {
	try {
		const newJsonFile = await prisma.jsonFile.create({
			data,
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.JSON_FILE_CREATED],
			data: { action: 'create', entity: newJsonFile, eventType: EVENTS.JSON_FILE_CREATED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.JSON_FILES_CHANGED],
			data: { action: 'change', eventType: EVENTS.JSON_FILES_CHANGED },
		});

		jsonFileLogger.info('Archivo JSON creado:', newJsonFile.name);
		return fromPrismaJsonFile(newJsonFile);
	} catch (error) {
		jsonFileLogger.error('Error creando archivo JSON:', { data, error });
		throw new Error('Error al crear archivo JSON');
	}
}

/**
 * Actualiza un archivo JSON existente
 */
export async function updateJsonFile(id: string, data: Prisma.JsonFileUpdateInput): Promise<JsonFileWithStats> {
	try {
		const updatedJsonFile = await prisma.jsonFile.update({
			where: { id },
			data,
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.JSON_FILE_UPDATED],
			data: { action: 'update', entity: updatedJsonFile, eventType: EVENTS.JSON_FILE_UPDATED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.JSON_FILES_CHANGED],
			data: { action: 'change', eventType: EVENTS.JSON_FILES_CHANGED },
		});

		jsonFileLogger.info('Archivo JSON actualizado:', updatedJsonFile.name);
		return fromPrismaJsonFile(updatedJsonFile);
	} catch (error) {
		jsonFileLogger.error('Error actualizando archivo JSON:', { id, data, error });
		throw new Error('Error al actualizar archivo JSON');
	}
}

/**
 * Elimina un archivo JSON
 */
export async function deleteJsonFile(id: string): Promise<void> {
	try {
		await prisma.jsonFile.delete({
			where: { id },
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.JSON_FILE_DELETED],
			data: { action: 'delete', entity: { id }, eventType: EVENTS.JSON_FILE_DELETED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.JSON_FILES_CHANGED],
			data: { action: 'change', eventType: EVENTS.JSON_FILES_CHANGED },
		});

		jsonFileLogger.info('Archivo JSON eliminado:', id);
	} catch (error) {
		jsonFileLogger.error('Error eliminando archivo JSON:', { id, error });
		throw new Error('Error al eliminar archivo JSON');
	}
}

/**
 * Verifica si un archivo JSON existe
 */
export async function jsonFileExists(id: string): Promise<boolean> {
	try {
		const jsonFile = await prisma.jsonFile.findUnique({
			where: { id },
			select: { id: true },
		});
		return jsonFile !== null;
	} catch (error) {
		jsonFileLogger.error('Error verificando existencia de archivo JSON:', { id, error });
		return false;
	}
}

/**
 * Obtiene el conteo total de archivos JSON
 */
export async function getJsonFileCount(): Promise<number> {
	try {
		return await prisma.jsonFile.count();
	} catch (error) {
		jsonFileLogger.error('Error obteniendo conteo de archivos JSON:', { error });
		throw new Error('Error al obtener conteo de archivos JSON');
	}
}
