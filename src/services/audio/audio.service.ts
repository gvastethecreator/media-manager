/**
 * 🎵 Servicio para la entidad Audio
 * @file Servicio de Audio con lógica de negocio
 * @module services/audio.service
 * @description Capa de servicio para la entidad Audio que maneja la lógica de negocio
 * @updated 2025-07-01
 */

import { getPrismaClient } from '@/lib/database/db';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { fromPrismaAudio, fromPrismaAudios } from '@/transformers/audio/transformer';
import type { AudioWithStats } from '@/types/entities/audio';
import type { Prisma } from '@prisma/client';

const audioLogger = serverLogger.withContext('AudioService');

// Función auxiliar para crear errores
const createAudioError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('AudioError', message, code, cause);
};

/**
 * Obtiene todos los archivos de audio
 */
export async function getAudios(): Promise<AudioWithStats[]> {
	try {
		const prisma = await getPrismaClient();
		const audios = await prisma.audio.findMany({
			orderBy: { createdAt: 'desc' },
		});

		return fromPrismaAudios(audios);
	} catch (error) {
		audioLogger.error('Error al obtener audios:', error);
		throw createAudioError('Error al obtener archivos de audio', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un audio por ID
 */
export async function getAudioById(id: string): Promise<AudioWithStats | null> {
	try {
		const prisma = await getPrismaClient();
		const audio = await prisma.audio.findUnique({
			where: { id },
		});

		if (!audio) {
			return null;
		}

		return fromPrismaAudio(audio);
	} catch (error) {
		audioLogger.error(`Error al obtener audio ${id}:`, error);
		throw createAudioError('Error al obtener archivo de audio', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo archivo de audio
 */
export async function createAudio(data: Prisma.AudioCreateInput): Promise<AudioWithStats> {
	try {
		audioLogger.info('📝 Creando audio:', data.name);

		const prisma = await getPrismaClient();
		const newAudio = await prisma.audio.create({ data });

		const audioWithStats = fromPrismaAudio(newAudio);

		// Emitir eventos
		await emit({
			type: 'files:modified',
			data: { action: 'create', audio: newAudio },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		audioLogger.info('✅ Audio creado:', audioWithStats.name);
		return audioWithStats;
	} catch (error) {
		audioLogger.error('❌ Error al crear audio:', error);
		throw createAudioError('No se pudo crear el archivo de audio', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un archivo de audio existente
 */
export async function updateAudio(id: string, data: Prisma.AudioUpdateInput): Promise<AudioWithStats> {
	try {
		audioLogger.info('📝 Actualizando audio:', id);

		const prisma = await getPrismaClient();
		const updatedAudio = await prisma.audio.update({
			where: { id },
			data,
		});

		const audioWithStats = fromPrismaAudio(updatedAudio);

		// Emitir eventos
		await emit({
			type: 'files:modified',
			id,
			data: { action: 'update', audio: updatedAudio },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE, id);

		audioLogger.info('✅ Audio actualizado:', audioWithStats.name);
		return audioWithStats;
	} catch (error) {
		audioLogger.error('❌ Error al actualizar audio:', error);
		throw createAudioError('No se pudo actualizar el archivo de audio', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un archivo de audio
 */
export async function deleteAudio(id: string): Promise<{ success: boolean }> {
	try {
		audioLogger.info('🗑️ Eliminando audio:', id);

		const prisma = await getPrismaClient();

		// Verificar que existe
		const audio = await prisma.audio.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!audio) {
			throw createAudioError('Audio no encontrado', EntityErrorCode.NOT_FOUND);
		}

		await prisma.audio.delete({ where: { id } });

		// Emitir eventos
		await emit({
			type: 'files:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		audioLogger.info('✅ Audio eliminado:', id);
		return { success: true };
	} catch (error) {
		audioLogger.error('❌ Error al eliminar audio:', error);
		throw createAudioError('No se pudo eliminar el archivo de audio', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Verifica si un audio existe
 */
export async function audioExists(id: string): Promise<boolean> {
	try {
		const prisma = await getPrismaClient();
		const count = await prisma.audio.count({
			where: { id },
		});
		return count > 0;
	} catch (error) {
		audioLogger.error(`Error al verificar existencia del audio ${id}:`, error);
		return false;
	}
}

/**
 * Obtiene el conteo total de audios
 */
export async function getAudioCount(): Promise<number> {
	try {
		const prisma = await getPrismaClient();
		return await prisma.audio.count();
	} catch (error) {
		audioLogger.error('Error al obtener conteo de audios:', error);
		throw createAudioError('Error al obtener conteo de archivos de audio', EntityErrorCode.OPERATION_FAILED, error);
	}
}
