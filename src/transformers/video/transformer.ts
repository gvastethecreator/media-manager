/**
 * @file Transformador principal para la entidad Video.
 * @module transformers/video/transformer
 * @description Contiene la lógica para convertir un objeto Video de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { VideoComplete } from '@/types/entities/video';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('VideoTransformer');

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones.
type VideoFromPrisma = Prisma.VideoGetPayload<{
	include: {
		folder: true;
		tags: true;
		albums: true;
		collections: true;
		characters: true;
		places: true;
		worldItems: true;
		concepts: true;
		prompts: true;
		notes: true;
		wildcards: true;
		properties: true;
		groups: true;
		_count: {
			select: {
				albums: true;
				collections: true;
				tags: true;
				characters: true;
				places: true;
				worldItems: true;
				concepts: true;
				prompts: true;
				notes: true;
				wildcards: true;
				properties: true;
				groups: true;
			};
		};
	};
}>;

/**
 * 🔄 Transforma un objeto Video de Prisma a nuestro tipo canónico VideoComplete.
 * @param videoFromPrisma - El objeto de video obtenido de Prisma.
 * @returns Un objeto VideoComplete.
 * @throws {TransformerError} si la transformación falla.
 */
export function fromPrismaVideo(videoFromPrisma: VideoFromPrisma): VideoComplete {
	try {
		const { _count, ...baseData } = videoFromPrisma;

		return {
			...baseData,
			metadata: baseData.metadata || null,
			thumbnail: baseData.thumbnail ? Buffer.from(baseData.thumbnail) : null,
			tags: baseData.tags ?? [],
			albums: baseData.albums ?? [],
			collections: baseData.collections ?? [],
			characters: baseData.characters ?? [],
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
			notes: baseData.notes ?? [],
			wildcards: baseData.wildcards ?? [],
			properties: baseData.properties ?? [],
			groups: baseData.groups ?? [],
			_count: {
				albums: _count?.albums ?? 0,
				collections: _count?.collections ?? 0,
				tags: _count?.tags ?? 0,
				characters: _count?.characters ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};
	} catch (error) {
		logger.error(`Error transformando video desde Prisma: ${videoFromPrisma.id}`, {
			error,
			videoId: videoFromPrisma.id,
		});
		throw new TransformerError('No se pudo transformar el video desde la base de datos.');
	}
}

/**
 * 🔄 Transforma un array de videos de Prisma a un array de VideoComplete.
 * @param videos - El array de videos de Prisma.
 * @returns Un array de VideoComplete.
 */
export function fromPrismaVideos(videos: VideoFromPrisma[]): VideoComplete[] {
	return videos.map(fromPrismaVideo);
}
