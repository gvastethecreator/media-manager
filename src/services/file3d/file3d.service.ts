/**
 * 🧊 Servicio para la entidad File3D
 * @file Servicio de File3D con lógica de negocio
 * @module services/file3d.service
 * @description Capa de servicio para la entidad File3D que maneja la lógica de negocio
 * @updated 2025-07-01
 */

import * as crypto from 'crypto';
import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { file3Ds } from '@/lib/drizzle/schema/index';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { fromDrizzleFile3D, fromDrizzleFile3Ds } from '@/transformers/file3d/transformer';
import type { File3DCreateInput, File3DUpdateInput, File3DWithStats } from '@/types/entities/file3d';

const file3dLogger = serverLogger.withContext('File3DService');

// Función auxiliar para crear errores
const createFile3DError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('File3DError', message, code, cause);
};

/**
 * Obtiene todos los archivos 3D
 */
export async function getFile3Ds(): Promise<File3DWithStats[]> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		file3dLogger.info('🧊 Obteniendo archivos 3D');

		const drizzleFile3Ds = await db
			.select({
				id: file3Ds.id,
				name: file3Ds.name,
				path: file3Ds.path,
				size: file3Ds.size,
				hash: file3Ds.hash,
				mimeType: file3Ds.mimeType,
				extension: file3Ds.extension,
				folderId: file3Ds.folderId,
				isFavorite: file3Ds.isFavorite,
				isArchived: file3Ds.isArchived,
				format: file3Ds.format,
				version: file3Ds.version,
				vertices: file3Ds.vertices,
				faces: file3Ds.faces,
				triangles: file3Ds.triangles,
				materials: file3Ds.materials,
				textures: file3Ds.textures,
				animations: file3Ds.animations,
				bones: file3Ds.bones,
				scenes: file3Ds.scenes,
				cameras: file3Ds.cameras,
				lights: file3Ds.lights,
				hasUV: file3Ds.hasUV,
				hasNormals: file3Ds.hasNormals,
				hasColors: file3Ds.hasColors,
				boundingBox: file3Ds.boundingBox,
				createdAt: file3Ds.createdAt,
				updatedAt: file3Ds.updatedAt,
			})
			.from(file3Ds)
			.orderBy(desc(file3Ds.createdAt));

		// Transformar a formato compatible con transformadores legacy
		const transformedFile3Ds = drizzleFile3Ds.map((rawFile3D: (typeof drizzleFile3Ds)[0]) => ({
			...rawFile3D,
			isFavorite: Boolean(rawFile3D.isFavorite),
		}));

		return fromDrizzleFile3Ds(transformedFile3Ds as any);
	} catch (error) {
		file3dLogger.error('Error al obtener archivos 3D:', error);
		throw createFile3DError('Error al obtener archivos 3D', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un archivo 3D por ID
 */
export async function getFile3DById(id: string): Promise<File3DWithStats | null> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		file3dLogger.info(`🔍 Obteniendo archivo 3D por ID: ${id}`);

		const drizzleFile3D = await db
			.select({
				id: file3Ds.id,
				name: file3Ds.name,
				// description: file3Ds.description, // No existe en esquema
				// emoji: file3Ds.emoji, // No existe en esquema
				// color: file3Ds.color, // No existe en esquema
				// shortcut: file3Ds.shortcut, // No existe en esquema
				// category: file3Ds.category, // No existe en esquema
				// filePath: file3Ds.filePath, // No existe en esquema (usar path)
				// fileName: file3Ds.fileName, // No existe en esquema (usar name)
				// fileSize: file3Ds.fileSize, // No existe en esquema (usar size)
				path: file3Ds.path,
				size: file3Ds.size,
				mimeType: file3Ds.mimeType,
				format: file3Ds.format,
				vertices: file3Ds.vertices,
				faces: file3Ds.faces,
				materials: file3Ds.materials,
				textures: file3Ds.textures,
				animations: file3Ds.animations,
				// tags: file3Ds.tags, // No existe en esquema
				// metadata: file3Ds.metadata, // No existe en esquema
				// sortBy: file3Ds.sortBy, // No existe en esquema
				// filters: file3Ds.filters, // No existe en esquema
				// featuredImage: file3Ds.featuredImage, // No existe en esquema
				isFavorite: file3Ds.isFavorite,
				createdAt: file3Ds.createdAt,
				updatedAt: file3Ds.updatedAt,
			})
			.from(file3Ds)
			.where(eq(file3Ds.id, id))
			.limit(1);

		if (drizzleFile3D.length === 0) {
			file3dLogger.warn(`Archivo 3D no encontrado: ${id}`);
			return null;
		}

		const rawFile3D = drizzleFile3D[0];

		// Transformar a formato compatible con transformadores legacy
		const transformedFile3D = {
			...rawFile3D,
			isFavorite: Boolean(rawFile3D.isFavorite),
		};

		return fromDrizzleFile3D(transformedFile3D as any);
	} catch (error) {
		file3dLogger.error(`Error al obtener archivo 3D ${id}:`, error);
		throw createFile3DError('Error al obtener archivo 3D', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo archivo 3D
 */
export async function createFile3D(data: File3DCreateInput): Promise<File3DWithStats> {
	try {
		file3dLogger.info('📝 Creando archivo 3D:', data.name);

		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.insert(file3Ds)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				path: data.path,
				size: data.size,
				hash: data.hash,
				mimeType: data.mimeType,
				extension: data.extension,
				folderId: data.folderId,
				isFavorite: data.isFavorite,
				isArchived: data.isArchived,
				format: data.format || null,
				version: data.version || null,
				vertices: data.vertices || null,
				faces: data.faces || null,
				triangles: data.triangles || null,
				materials: data.materials || null,
				textures: data.textures || null,
				animations: data.animations || null,
				bones: data.bones || null,
				scenes: data.scenes || null,
				cameras: data.cameras || null,
				lights: data.lights || null,
				hasUV: data.hasUV,
				hasNormals: data.hasNormals,
				hasColors: data.hasColors,
				boundingBox: data.boundingBox || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		const newFile3D = result[0];
		const file3DWithStats = fromDrizzleFile3D(newFile3D as any);

		// Emitir eventos
		await emit({
			type: 'files:modified',
			data: { action: 'create', file3d: newFile3D },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		file3dLogger.info('✅ Archivo 3D creado:', file3DWithStats.name);
		return file3DWithStats;
	} catch (error) {
		file3dLogger.error('❌ Error al crear archivo 3D:', error);
		throw createFile3DError('No se pudo crear el archivo 3D', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un archivo 3D existente
 */
export async function updateFile3D(id: string, data: File3DUpdateInput): Promise<File3DWithStats> {
	try {
		file3dLogger.info('📝 Actualizando archivo 3D:', id);

		// **MIGRACIÓN A DRIZZLE**
		const updateData: any = {
			updatedAt: new Date(),
		};

		// Solo actualizar campos que se envían
		if (data.name !== undefined) updateData.name = data.name;
		if (data.path !== undefined) updateData.path = data.path;
		if (data.size !== undefined) updateData.size = data.size;
		if (data.hash !== undefined) updateData.hash = data.hash;
		if (data.mimeType !== undefined) updateData.mimeType = data.mimeType;
		if (data.extension !== undefined) updateData.extension = data.extension;
		if (data.folderId !== undefined) updateData.folderId = data.folderId;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;
		if (data.format !== undefined) updateData.format = data.format;
		if (data.version !== undefined) updateData.version = data.version;
		if (data.vertices !== undefined) updateData.vertices = data.vertices;
		if (data.faces !== undefined) updateData.faces = data.faces;
		if (data.triangles !== undefined) updateData.triangles = data.triangles;
		if (data.materials !== undefined) updateData.materials = data.materials;
		if (data.textures !== undefined) updateData.textures = data.textures;
		if (data.animations !== undefined) updateData.animations = data.animations;
		if (data.bones !== undefined) updateData.bones = data.bones;
		if (data.scenes !== undefined) updateData.scenes = data.scenes;
		if (data.cameras !== undefined) updateData.cameras = data.cameras;
		if (data.lights !== undefined) updateData.lights = data.lights;
		if (data.hasUV !== undefined) updateData.hasUV = data.hasUV;
		if (data.hasNormals !== undefined) updateData.hasNormals = data.hasNormals;
		if (data.hasColors !== undefined) updateData.hasColors = data.hasColors;
		if (data.boundingBox !== undefined) updateData.boundingBox = data.boundingBox;

		await db.update(file3Ds).set(updateData).where(eq(file3Ds.id, id));

		// Obtener el archivo 3D actualizado
		const updatedFile3D = await getFile3DById(id);
		if (!updatedFile3D) {
			throw createFile3DError('No se pudo obtener el archivo 3D actualizado', EntityErrorCode.OPERATION_FAILED);
		}

		// Emitir eventos
		await emit({
			type: 'files:modified',
			id,
			data: { action: 'update', file3d: updatedFile3D },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE, id);

		file3dLogger.info('✅ Archivo 3D actualizado:', updatedFile3D.name);
		return updatedFile3D;
	} catch (error) {
		file3dLogger.error('❌ Error al actualizar archivo 3D:', error);
		throw createFile3DError('No se pudo actualizar el archivo 3D', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un archivo 3D
 */
export async function deleteFile3D(id: string): Promise<{ success: boolean }> {
	try {
		file3dLogger.info('🗑️ Eliminando archivo 3D:', id);

		// **MIGRACIÓN A DRIZZLE**
		// Verificar que existe
		const existingFile3D = await db
			.select({ id: file3Ds.id, name: file3Ds.name })
			.from(file3Ds)
			.where(eq(file3Ds.id, id))
			.limit(1);

		if (existingFile3D.length === 0) {
			throw createFile3DError('Archivo 3D no encontrado', EntityErrorCode.NOT_FOUND);
		}

		await db.delete(file3Ds).where(eq(file3Ds.id, id));

		// Emitir eventos
		await emit({
			type: 'files:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		file3dLogger.info('✅ Archivo 3D eliminado:', id);
		return { success: true };
	} catch (error) {
		file3dLogger.error('❌ Error al eliminar archivo 3D:', error);
		throw createFile3DError('No se pudo eliminar el archivo 3D', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Verifica si un archivo 3D existe
 */
export async function file3DExists(id: string): Promise<boolean> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const result = await db.select({ count: count() }).from(file3Ds).where(eq(file3Ds.id, id));

		return result[0]?.count > 0;
	} catch (error) {
		file3dLogger.error(`Error al verificar existencia del archivo 3D ${id}:`, error);
		return false;
	}
}

/**
 * Obtiene el conteo total de archivos 3D
 */
export async function getFile3DCount(): Promise<number> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const result = await db.select({ count: count() }).from(file3Ds);

		return result[0]?.count || 0;
	} catch (error) {
		file3dLogger.error('Error al obtener conteo de archivos 3D:', error);
		throw createFile3DError('Error al obtener conteo de archivos 3D', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Busca un archivo 3D por su hash
 * @param hash Hash del archivo 3D
 * @returns Archivo 3D o null
 */
export async function getFile3DByHash(hash: string): Promise<File3DWithStats | null> {
	try {
		file3dLogger.info('🔍 Buscando archivo 3D por hash:', hash);

		// **MIGRACIÓN A DRIZZLE**
		const result = await db.select().from(file3Ds).where(eq(file3Ds.hash, hash)).limit(1);

		if (result.length === 0) {
			file3dLogger.info('Archivo 3D no encontrado por hash:', hash);
			return null;
		}

		const rawFile3D = result[0];
		// Transformar el campo isFavorite de number a boolean
		const transformedFile3D = {
			...rawFile3D,
			isFavorite: Boolean(rawFile3D.isFavorite),
		};

		const file3D = fromDrizzleFile3D(transformedFile3D as any);
		file3dLogger.info('✅ Archivo 3D encontrado por hash:', file3D.name);
		return file3D;
	} catch (error) {
		file3dLogger.error('❌ Error al buscar archivo 3D por hash:', error);
		throw createFile3DError('No se pudo buscar el archivo 3D por hash', EntityErrorCode.OPERATION_FAILED, error);
	}
}
