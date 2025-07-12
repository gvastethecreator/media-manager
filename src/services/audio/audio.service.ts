/**
 * 🎵 Servicio para la entidad Audio
 * @file Servicio de Audio con lógica de negocio
 * @module services/audio.service
 * @description Capa de servicio para la entidad Audio que maneja la lógica de negocio
 * @updated 2025-07-03 - ✅ MIGRADO A DRIZZLE + TRANSFORMADORES MODERNOS
 */

import * as crypto from 'crypto';
import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { audios } from '@/lib/drizzle/schema/index';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { deserializeAudio } from '@/transformers/audio';
import type { Audio, AudioCreateInput, AudioUpdateInput, AudioWithStats } from '@/types/entities/audio';

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
				path: audios.path,
				size: audios.size,
				hash: audios.hash,
				mimeType: audios.mimeType,
				extension: audios.extension,
				folderId: audios.folderId,
				isFavorite: audios.isFavorite,
				isArchived: audios.isArchived,
				duration: audios.duration,
				bitrate: audios.bitrate,
				sampleRate: audios.sampleRate,
				channels: audios.channels,
				format: audios.format,
				codec: audios.codec,
				title: audios.title,
				artist: audios.artist,
				album: audios.album,
				year: audios.year,
				genre: audios.genre,
				track: audios.track,
				disc: audios.disc,
				albumArtist: audios.albumArtist,
				composer: audios.composer,
				comment: audios.comment,
				lyrics: audios.lyrics,
				bpm: audios.bpm,
				key: audios.key,
				mood: audios.mood,
				createdAt: audios.createdAt,
				updatedAt: audios.updatedAt,
			})
			.from(audios)
			.orderBy(desc(audios.createdAt));

		// Transformar usando deserializer moderno
		// Normalización defensiva: solo campos válidos según schema Drizzle
		const audioList = drizzleAudios.map((rawAudio) => {
			const audio = deserializeAudio({
				...rawAudio,
				// Normalización mínima para compatibilidad con el schema de la app
				size: rawAudio.size || 0,
				path: rawAudio.path || '',
				format: rawAudio.format || rawAudio.codec || '',
				isFavorite: Boolean(rawAudio.isFavorite),
				folderId: rawAudio.folderId || '',
			} as any);
			return audio;
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
				path: audios.path,
				size: audios.size,
				hash: audios.hash,
				mimeType: audios.mimeType,
				extension: audios.extension,
				folderId: audios.folderId,
				isFavorite: audios.isFavorite,
				isArchived: audios.isArchived,
				duration: audios.duration,
				bitrate: audios.bitrate,
				sampleRate: audios.sampleRate,
				channels: audios.channels,
				format: audios.format,
				codec: audios.codec,
				title: audios.title,
				artist: audios.artist,
				album: audios.album,
				year: audios.year,
				genre: audios.genre,
				track: audios.track,
				disc: audios.disc,
				albumArtist: audios.albumArtist,
				composer: audios.composer,
				comment: audios.comment,
				lyrics: audios.lyrics,
				bpm: audios.bpm,
				key: audios.key,
				mood: audios.mood,
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
			size: rawAudio.size || 0,
			path: rawAudio.path || '',
			format: rawAudio.format || rawAudio.codec || '',
			folderId: rawAudio.folderId || '',
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
		const result = await db
			.insert(audios)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				path: data.path,
				size: data.size || 0,
				hash: data.hash,
				mimeType: data.mimeType,
				extension: data.extension,
				folderId: data.folderId,
				isFavorite: data.isFavorite || false,
				isArchived: data.isArchived || false,
				duration: data.duration || null,
				bitrate: data.bitrate || null,
				sampleRate: data.sampleRate || null,
				channels: data.channels || null,
				format: data.format || null,
				codec: data.codec || null,
				title: data.title || null,
				artist: data.artist || null,
				album: data.album || null,
				year: data.year || null,
				genre: data.genre || null,
				track: data.track || null,
				disc: data.disc || null,
				albumArtist: data.albumArtist || null,
				composer: data.composer || null,
				comment: data.comment || null,
				lyrics: data.lyrics || null,
				bpm: data.bpm || null,
				key: data.key || null,
				mood: data.mood || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

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
		if (data.path !== undefined) updateData.path = data.path;
		if (data.size !== undefined) updateData.size = data.size;
		if (data.hash !== undefined) updateData.hash = data.hash;
		if (data.mimeType !== undefined) updateData.mimeType = data.mimeType;
		if (data.extension !== undefined) updateData.extension = data.extension;
		if (data.folderId !== undefined) updateData.folderId = data.folderId;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;
		if (data.duration !== undefined) updateData.duration = data.duration;
		if (data.bitrate !== undefined) updateData.bitrate = data.bitrate;
		if (data.sampleRate !== undefined) updateData.sampleRate = data.sampleRate;
		if (data.channels !== undefined) updateData.channels = data.channels;
		if (data.format !== undefined) updateData.format = data.format;
		if (data.codec !== undefined) updateData.codec = data.codec;
		if (data.title !== undefined) updateData.title = data.title;
		if (data.artist !== undefined) updateData.artist = data.artist;
		if (data.album !== undefined) updateData.album = data.album;
		if (data.year !== undefined) updateData.year = data.year;
		if (data.genre !== undefined) updateData.genre = data.genre;
		if (data.track !== undefined) updateData.track = data.track;
		if (data.disc !== undefined) updateData.disc = data.disc;
		if (data.albumArtist !== undefined) updateData.albumArtist = data.albumArtist;
		if (data.composer !== undefined) updateData.composer = data.composer;
		if (data.comment !== undefined) updateData.comment = data.comment;
		if (data.lyrics !== undefined) updateData.lyrics = data.lyrics;
		if (data.bpm !== undefined) updateData.bpm = data.bpm;
		if (data.key !== undefined) updateData.key = data.key;
		if (data.mood !== undefined) updateData.mood = data.mood;

		await db.update(audios).set(updateData).where(eq(audios.id, id));

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
		const result = await db.select({ count: count() }).from(audios).where(eq(audios.id, id));

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
		const result = await db.select({ count: count() }).from(audios);

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
				bitrate: audios.bitrate,
			})
			.from(audios);

		// Agrupar manualmente por formato
		const formatGroups = allAudios.reduce(
			(acc, audio) => {
				const format = audio.format || 'unknown';
				if (!acc[format]) {
					acc[format] = {
						format,
						count: 0,
						totalSize: 0,
						totalDuration: 0,
						totalBitrate: 0,
						validDurations: 0,
						validBitrates: 0,
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
			},
			{} as Record<string, any>
		);

		return Object.values(formatGroups)
			.map((stat: any) => ({
				format: stat.format,
				count: stat.count,
				totalSize: stat.totalSize,
				avgDuration: stat.validDurations > 0 ? stat.totalDuration / stat.validDurations : null,
				avgBitrate: stat.validBitrates > 0 ? stat.totalBitrate / stat.validBitrates : null,
			}))
			.sort((a, b) => b.count - a.count);
	} catch (error) {
		audioLogger.error('Error al obtener estadísticas de formatos:', error);
		throw createAudioError(
			'No se pudieron obtener las estadísticas de formato de audio',
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function getAudioGenreStats() {
	try {
		audioLogger.info('Obteniendo estadísticas de géneros de audio');

		// **MIGRACIÓN A DRIZZLE**
		const allAudios = await db.select({ genre: audios.genre }).from(audios);

		// Agrupar manualmente por género
		const genreGroups = allAudios.reduce(
			(acc, audio) => {
				const genre = audio.genre || 'unknown';
				if (!acc[genre]) {
					acc[genre] = {
						genre,
						count: 0,
					};
				}
				acc[genre].count++;
				return acc;
			},
			{} as Record<string, any>
		);

		return Object.values(genreGroups)
			.map((stat: any) => ({
				genre: stat.genre,
				count: stat.count,
			}))
			.sort((a, b) => b.count - a.count);
	} catch (error) {
		audioLogger.error('Error al obtener estadísticas de géneros:', error);
		throw createAudioError(
			'No se pudieron obtener las estadísticas de géneros de audio',
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Busca un audio por su hash
 * @param hash Hash del audio
 * @returns Audio o null
 */
export async function getAudioByHash(hash: string): Promise<AudioWithStats | null> {
	try {
		audioLogger.info('🔍 Buscando audio por hash:', hash);

		// **MIGRACIÓN A DRIZZLE**
		const result = await db.select().from(audios).where(eq(audios.hash, hash)).limit(1);

		if (result.length === 0) {
			audioLogger.info('Audio no encontrado por hash:', hash);
			return null;
		}

		const audio = result[0];
		audioLogger.info('✅ Audio encontrado por hash:', audio.name);
		return audio as AudioWithStats;
	} catch (error) {
		audioLogger.error('❌ Error al buscar audio por hash:', error);
		throw createAudioError('No se pudo buscar el audio por hash', EntityErrorCode.OPERATION_FAILED, error);
	}
}
