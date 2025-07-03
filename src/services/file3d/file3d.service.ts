/**
 * 🧊 Servicio para la entidad File3D
 * @file Servicio de File3D con lógica de negocio
 * @module services/file3d.service
 * @description Capa de servicio para la entidad File3D que maneja la lógica de negocio
 * @updated 2025-07-01
 */

import type { Prisma } from '@prisma/client';
import { getPrismaClient } from '@/lib/database/db';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { fromPrismaFile3D, fromPrismaFile3Ds } from '@/transformers/file3d/transformer';
import type { File3DWithStats } from '@/types/entities/file3d';

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
		const prisma = await getPrismaClient();
		const file3Ds = await prisma.file3D.findMany({
			orderBy: { createdAt: 'desc' },
		});

		return fromPrismaFile3Ds(file3Ds);
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
		const prisma = await getPrismaClient();
		const file3D = await prisma.file3D.findUnique({
			where: { id },
		});

		if (!file3D) {
			return null;
		}

		return fromPrismaFile3D(file3D);
	} catch (error) {
		file3dLogger.error(`Error al obtener archivo 3D ${id}:`, error);
		throw createFile3DError('Error al obtener archivo 3D', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo archivo 3D
 */
export async function createFile3D(data: Prisma.File3DCreateInput): Promise<File3DWithStats> {
	try {
		file3dLogger.info('📝 Creando archivo 3D:', data.name);

		const prisma = await getPrismaClient();
		const newFile3D = await prisma.file3D.create({ data });

		const file3DWithStats = fromPrismaFile3D(newFile3D);

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
export async function updateFile3D(id: string, data: Prisma.File3DUpdateInput): Promise<File3DWithStats> {
	try {
		file3dLogger.info('📝 Actualizando archivo 3D:', id);

		const prisma = await getPrismaClient();
		const updatedFile3D = await prisma.file3D.update({
			where: { id },
			data,
		});

		const file3DWithStats = fromPrismaFile3D(updatedFile3D);

		// Emitir eventos
		await emit({
			type: 'files:modified',
			id,
			data: { action: 'update', file3d: updatedFile3D },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE, id);

		file3dLogger.info('✅ Archivo 3D actualizado:', file3DWithStats.name);
		return file3DWithStats;
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

		const prisma = await getPrismaClient();

		// Verificar que existe
		const file3D = await prisma.file3D.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!file3D) {
			throw createFile3DError('Archivo 3D no encontrado', EntityErrorCode.NOT_FOUND);
		}

		await prisma.file3D.delete({ where: { id } });

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
		const prisma = await getPrismaClient();
		const count = await prisma.file3D.count({
			where: { id },
		});
		return count > 0;
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
		const prisma = await getPrismaClient();
		return await prisma.file3D.count();
	} catch (error) {
		file3dLogger.error('Error al obtener conteo de archivos 3D:', error);
		throw createFile3DError('Error al obtener conteo de archivos 3D', EntityErrorCode.OPERATION_FAILED, error);
	}
}
