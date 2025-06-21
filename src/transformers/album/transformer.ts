/**
 * @file Transformador principal para la entidad Album
 * @module transformers/album/transformer
 * @description Contiene la lógica para convertir un objeto Album de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    AlbumWithStats,
    PrismaAlbumWithCounts,
} from '@/types/entities/album';

const logger = serverLogger.withContext('AlbumTransformer');

/**
 * 🔄 Transforma un objeto Album de Prisma a nuestro tipo canónico AlbumWithStats.
 *
 * @param prismaAlbum - El objeto Album obtenido de Prisma, con los conteos.
 * @returns Un objeto AlbumWithStats compatible con la aplicación, o null.
 */
export function fromPrismaAlbum(
	prismaAlbum: PrismaAlbumWithCounts | null,
): AlbumWithStats | null {
	if (!prismaAlbum) {
		return null;
	}

	try {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { _count, images, videos, ...baseData } = prismaAlbum;

		const totalImages = _count?.images ?? 0;
		const totalVideos = _count?.videos ?? 0;
		const totalItems = totalImages + totalVideos;

		const stats = {
			totalItems,
			totalImages,
			totalVideos,
			lastUpdated: prismaAlbum.updatedAt,
		};

		return {
			...baseData,
			category: baseData.category ?? 'general',
			stats,
			_count: {
				images: _count?.images,
				videos: _count?.videos,
				collections: _count?.collections,
				tags: _count?.tags,
				characters: _count?.characters,
				places: _count?.places,
				worldItems: _count?.worldItems,
				concepts: _count?.concepts,
				prompts: _count?.prompts,
				notes: _count?.notes,
				wildcards: _count?.wildcards,
				properties: _count?.properties,
				groups: _count?.groups,
			},
		};
	} catch (error) {
		logger.error('Error transformando álbum desde Prisma', {
			error,
			albumId: prismaAlbum?.id,
		});
		return null;
	}
}

/**
 * 🔄 Transforma una lista de álbumes de Prisma a una lista de AlbumWithStats.
 *
 * @param prismaAlbums - Un array de objetos Album de Prisma.
 * @returns Un array de objetos AlbumWithStats.
 */
export function fromPrismaAlbums(
	prismaAlbums: PrismaAlbumWithCounts[],
): AlbumWithStats[] {
	return prismaAlbums
		.map(fromPrismaAlbum)
		.filter((a): a is AlbumWithStats => a !== null);
}
