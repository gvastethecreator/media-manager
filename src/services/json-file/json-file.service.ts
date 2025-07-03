/**
 * 🗂️ Servicio para la entidad JsonFile
 * @file Servicio de JsonFile con lógica de negocio
 * @module services/json-file.service
 * @description Capa de servicio para la entidad JsonFile que maneja la lógica de negocio
 * @updated 2025-06-27
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { fromPrismaJsonFile, fromPrismaJsonFiles } from '@/transformers/json-file/transformer';
import type { JsonFileWithStats } from '@/types/entities/json-file';

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
		const jsonFiles = await prisma.jsonFile.findMany({
			orderBy: { name: 'asc' },
		});
		return fromPrismaJsonFiles(jsonFiles);
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
		const jsonFile = await prisma.jsonFile.findUnique({
			where: { id },
		});
		if (!jsonFile) return null;
		return fromPrismaJsonFile(jsonFile);
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
