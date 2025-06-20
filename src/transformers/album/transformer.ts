/**
 * @file Transformador principal para la entidad Album
 * @module transformers/album/transformer
 * @description Contiene la lógica para convertir un objeto Album de Prisma a nuestro tipo canónico.
 */
import { serverLogger } from '@/lib/logger/server-logger';
import type { AlbumWithRelations } from '@/types/entities/album';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('AlbumTransformer');

/**
 * 🔄 Transforma un objeto Album de Prisma a nuestro tipo canónico AlbumWithRelations.
 *
 * @param prismaAlbum - El objeto Album obtenido de Prisma.
 * @returns Un objeto AlbumWithRelations compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaAlbum(prismaAlbum: any): AlbumWithRelations {
	if (!prismaAlbum) {
		throw new TransformerError('El objeto de álbum de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaAlbum;

		return {
			...baseData,
			category: baseData.category ?? 'general',
			// Asegurar que las relaciones opcionales no sean undefined
			images: baseData.images ?? [],
			videos: baseData.videos ?? [],
			collections: baseData.collections ?? [],
			tags: baseData.tags ?? [],
			characters: baseData.characters ?? [],
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
			notes: baseData.notes ?? [],
			wildcards: baseData.wildcards ?? [],
			properties: baseData.properties ?? [],
			groups: baseData.groups ?? [],
			// Asignar el conteo de forma segura
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
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
		logger.error('Error transformando álbum desde Prisma', {
			error,
			albumId: prismaAlbum?.id,
		});
		throw new TransformerError(`Error al transformar el álbum: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de álbumes de Prisma a una lista de AlbumWithRelations.
 *
 * @param prismaAlbums - Un array de objetos Album de Prisma.
 * @returns Un array de objetos AlbumWithRelations.
 */
export function fromPrismaAlbums(prismaAlbums: any[]): AlbumWithRelations[] {
	return prismaAlbums.map(fromPrismaAlbum);
}
