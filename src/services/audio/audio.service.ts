/**
 * 🎵 Servicio para la entidad Audio
 * @file Servicio de Audio con lógica de negocio
 * @module services/audio.service
 * @description Capa de servicio para la entidad Audio que maneja la lógica de negocio
 * @updated 2025-07-03 - ✅ MIGRADO A DRIZZLE + TRANSFORMADORES MODERNOS
 */

import { db } from '@/lib/drizzle';
import { audios } from '@/lib/drizzle/schema';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { deserializeAudio } from '@/transformers/audio';
import type { AudioCreateInput, AudioUpdateInput, AudioWithStats, Audio } from '@/types/entities/audio';
import * as crypto from 'crypto';
import { count, desc, eq } from 'drizzle-orm';

const audioLogger = serverLogger.withContext('AudioService');

// Función auxiliar para crear errores
const createAudioError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('AudioError', message, code, cause);
};

// Función helper para convertir Audio a AudioWithStats
const addStatsToAudio = (audio: Audio): AudioWithStats => {
	return {
		...audio,
		stats: {
			duration: audio.duration ?? 0,
			format: audio.format || 'unknown',
			bitrate: audio.bitrate || 0,
			volumePeaks: [],
			sampleRate: audio.sampleRate || 0,
		},
	};
};

/**
 * Obtiene todos los archivos de audio
 */
export async function getAudios(): Promise<AudioWithStats[]> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		audioLogger.info('🎵 Obteniendo audios');

		const drizzleAudios = await db
			.select({
				id: audios.id,
				name: audios.name,
				description: audios.description,
				emoji: audios.emoji,
				color: audios.color,
				shortcut: audios.shortcut,
				category: audios.category,
				filePath: audios.filePath,
				fileName: audios.fileName,
				fileSize: audios.fileSize,
				mimeType: audios.mimeType,
				duration: audios.duration,
				bitrate: audios.bitrate,
				sampleRate: audios.sampleRate,
				channels: audios.channels,
				codec: audios.codec,
				tags: audios.tags,
				metadata: audios.metadata,
				sortBy: audios.sortBy,
				filters: audios.filters,
				featuredImage: audios.featuredImage,
				isFavorite: audios.isFavorite,
				createdAt: audios.createdAt,
				updatedAt: audios.updatedAt,
			})
			.from(audios)
			.orderBy(desc(audios.createdAt));

		// Transformar usando deserializer moderno
		const audioList = drizzleAudios.map((rawAudio) => {
			const audio = deserializeAudio({
				...rawAudio,
				size: rawAudio.fileSize || 0,
				filePath: rawAudio.filePath || '',
				format: rawAudio.codec || null,
				metadata: rawAudio.metadata || null,
				thumbnail: rawAudio.featuredImage || null,
				isPublic: false, // TODO: agregar campo isPublic al schema
				isFavorite: Boolean(rawAudio.isFavorite),
				folderId: '', // TODO: agregar relación con folder
			} as any);
			return addStatsToAudio(audio);
		});

		return audioList;
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
		// **MIGRACIÓN A DRIZZLE**
		audioLogger.info(`🔍 Obteniendo audio por ID: ${id}`);

		const drizzleAudio = await db
			.select({
				id: audios.id,
				name: audios.name,
				description: audios.description,
				emoji: audios.emoji,
				color: audios.color,
				shortcut: audios.shortcut,
				category: audios.category,
				filePath: audios.filePath,
				fileName: audios.fileName,
				fileSize: audios.fileSize,
				mimeType: audios.mimeType,
				duration: audios.duration,
				bitrate: audios.bitrate,
				sampleRate: audios.sampleRate,
				channels: audios.channels,
				codec: audios.codec,
				tags: audios.tags,
				metadata: audios.metadata,
				sortBy: audios.sortBy,
				filters: audios.filters,
				featuredImage: audios.featuredImage,
				isFavorite: audios.isFavorite,
				createdAt: audios.createdAt,
				updatedAt: audios.updatedAt,
			})
			.from(audios)
			.where(eq(audios.id, id))
			.limit(1);

		if (drizzleAudio.length === 0) {
			audioLogger.warn(`Audio no encontrado: ${id}`);
			return null;
		}

		const rawAudio = drizzleAudio[0];

		
		const transformedAudio = {
			...rawAudio,
			isFavorite: Boolean(rawAudio.isFavorite),
		};

		return deserializeAudio(transformedAudio as any);
	} catch (error) {
		audioLogger.error(`Error al obtener audio ${id}:`, error);
		throw createAudioError('Error al obtener archivo de audio', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo archivo de audio
 */
export async function createAudio(data: AudioCreateInput): Promise<AudioWithStats> {
	try {
		audioLogger.info('📝 Creando audio:', data.name);

		// **MIGRACIÓN A DRIZZLE**
		const result = await db.insert(audios).values({
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description || null,
			emoji: data.emoji || '🎵',
			color: data.color || '#3b82f6',
			shortcut: data.shortcut || null,
			category: data.category || null,
			filePath: data.filePath,
			fileName: data.fileName,
			fileSize: data.fileSize || null,
			mimeType: data.mimeType || null,
			duration: data.duration || null,
			bitrate: data.bitrate || null,
			sampleRate: data.sampleRate || null,
			channels: data.channels || null,
			codec: data.codec || null,
			tags: data.tags || null,
			metadata: data.metadata || null,
			sortBy: data.sortBy || null,
			filters: data.filters || null,
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
			createdAt: new Date(),
			updatedAt: new Date(),
		}).returning();

		const newAudio = result[0];
		const audioWithStats = deserializeAudio(newAudio as any);

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
export async function updateAudio(id: string, data: AudioUpdateInput): Promise<AudioWithStats> {
	try {
		audioLogger.info('📝 Actualizando audio:', id);

		// **MIGRACIÓN A DRIZZLE**
		const updateData: any = {
			updatedAt: new Date(),
		};

		// Solo actualizar campos que se envían
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.filePath !== undefined) updateData.filePath = data.filePath;
		if (data.fileName !== undefined) updateData.fileName = data.fileName;
		if (data.fileSize !== undefined) updateData.fileSize = data.fileSize;
		if (data.mimeType !== undefined) updateData.mimeType = data.mimeType;
		if (data.duration !== undefined) updateData.duration = data.duration;
		if (data.bitrate !== undefined) updateData.bitrate = data.bitrate;
		if (data.sampleRate !== undefined) updateData.sampleRate = data.sampleRate;
		if (data.channels !== undefined) updateData.channels = data.channels;
		if (data.codec !== undefined) updateData.codec = data.codec;
		if (data.tags !== undefined) updateData.tags = data.tags;
		if (data.metadata !== undefined) updateData.metadata = data.metadata;
		if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;
		if (data.filters !== undefined) updateData.filters = data.filters;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		await db.update(audios)
			.set(updateData)
			.where(eq(audios.id, id));

		// Obtener el audio actualizado
		const updatedAudio = await getAudioById(id);
		if (!updatedAudio) {
			throw createAudioError('No se pudo obtener el audio actualizado', EntityErrorCode.OPERATION_FAILED);
		}

		// Emitir eventos
		await emit({
			type: 'files:modified',
			id,
			data: { action: 'update', audio: updatedAudio },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE, id);

		audioLogger.info('✅ Audio actualizado:', updatedAudio.name);
		return updatedAudio;
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

		// **MIGRACIÓN A DRIZZLE**
		// Verificar que existe
		const existingAudio = await db
			.select({ id: audios.id, name: audios.name })
			.from(audios)
			.where(eq(audios.id, id))
			.limit(1);

		if (existingAudio.length === 0) {
			throw createAudioError('Audio no encontrado', EntityErrorCode.NOT_FOUND);
		}

		await db.delete(audios).where(eq(audios.id, id));

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
		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.select({ count: count() })
			.from(audios)
			.where(eq(audios.id, id));

		return result[0]?.count > 0;
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
		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.select({ count: count() })
			.from(audios);

		return result[0]?.count || 0;
	} catch (error) {
		audioLogger.error('Error al obtener conteo de audios:', error);
		throw createAudioError('Error al obtener conteo de archivos de audio', EntityErrorCode.OPERATION_FAILED, error);
	}
}

export async function getAudioFormatStats() {
	try {
		audioLogger.info('Obteniendo estadísticas de formato de audio');

		// **MIGRACIÓN A DRIZZLE**
		// Por ahora implementación básica sin groupBy (TODO: implementar groupBy en Drizzle)
		const allAudios = await db
			.select({
				format: audios.format,
				size: audios.size,
				duration: audios.duration,
				bitrate: audios.bitrate
			})
			.from(audios);

		// Agrupar manualmente por formato
		const formatGroups = allAudios.reduce((acc, audio) => {
			const format = audio.format || 'unknown';
			if (!acc[format]) {
				acc[format] = {
					format,
					count: 0,
					totalSize: 0,
					totalDuration: 0,
					totalBitrate: 0,
					validDurations: 0,
					validBitrates: 0
				};
			}
			acc[format].count++;
			acc[format].totalSize += audio.size || 0;
			if (audio.duration) {
				acc[format].totalDuration += audio.duration;
				acc[format].validDurations++;
			}
			if (audio.bitrate) {
				acc[format].totalBitrate += audio.bitrate;
				acc[format].validBitrates++;
			}
			return acc;
		}, {} as Record<string, any>);

		return Object.values(formatGroups).map((stat: any) => ({
			format: stat.format,
			count: stat.count,
			totalSize: stat.totalSize,
			avgDuration: stat.validDurations > 0 ? stat.totalDuration / stat.validDurations : null,
			avgBitrate: stat.validBitrates > 0 ? stat.totalBitrate / stat.validBitrates : null,
		})).sort((a, b) => b.count - a.count);
	} catch (error) {
		audioLogger.error('Error al obtener estadísticas de formatos:', error);
		throw createAudioError('No se pudieron obtener las estadísticas de formato de audio', EntityErrorCode.OPERATION_FAILED, error);
	}
}

export async function getAudioGenreStats() {
	try {
		audioLogger.info('Obteniendo estadísticas de géneros de audio');

		// **MIGRACIÓN A DRIZZLE**
		const allAudios = await db
			.select({ genre: audios.genre })
			.from(audios);

		// Agrupar manualmente por género
		const genreGroups = allAudios.reduce((acc, audio) => {
			const genre = audio.genre || 'unknown';
			if (!acc[genre]) {
				acc[genre] = {
					genre,
					count: 0
				};
			}
			acc[genre].count++;
			return acc;
		}, {} as Record<string, any>);

		return Object.values(genreGroups)
			.map((stat: any) => ({
				genre: stat.genre,
				count: stat.count,
			}))
			.sort((a, b) => b.count - a.count);
	} catch (error) {
		audioLogger.error('Error al obtener estadísticas de géneros:', error);
		throw createAudioError('No se pudieron obtener las estadísticas de géneros de audio', EntityErrorCode.OPERATION_FAILED, error);
	}
}