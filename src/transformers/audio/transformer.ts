/**
 * @file Transformador principal para la entidad Audio
 * @module transformers/audio/transformer
 * @description Contiene la lógica para convertir un objeto Audio de Prisma a nuestro tipo canónico.
 */
import { serverLogger } from '@/lib/logger/server-logger';
import type { AudioComplete } from '@/types/entities/audio/types';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('AudioTransformer');

/**
 * 🔄 Transforma un objeto Audio de Prisma a nuestro tipo canónico AudioComplete.
 *
 * @param prismaAudio - El objeto Audio obtenido de Prisma.
 * @returns Un objeto AudioComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaAudio(prismaAudio: any): AudioComplete {
	if (!prismaAudio) {
		throw new TransformerError('El objeto de audio de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...audioData } = prismaAudio;

		const audioComplete: AudioComplete = {
			...audioData,
			// Conteos
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
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
				file3d: _count?.file3d ?? 0,
			},
		};

		return audioComplete;
	} catch (error) {
		logger.error('Error transformando audio desde Prisma', {
			error,
			audioId: prismaAudio?.id,
		});
		throw new TransformerError(`Error al transformar el audio: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de audios de Prisma a una lista de AudioComplete.
 *
 * @param prismaAudios - Un array de objetos Audio de Prisma.
 * @returns Un array de objetos AudioComplete.
 */
export function fromPrismaAudios(prismaAudios: any[]): AudioComplete[] {
	return prismaAudios.map(fromPrismaAudio);
}
