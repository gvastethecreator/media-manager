/**
 * @file Transformador principal para la entidad Album
 * @module transformers/album/transformer
 * @description Contiene la lógica para convertir un objeto Album de Prisma a nuestro tipo canónico.
 */
import { serverLogger } from '@/lib/logger/server-logger';
import type { AlbumWithRelations } from '@/types/entities/album';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('AlbumTransformer');

// Define el tipo de payload de Prisma que esperamos, con las relaciones y conteos.
type AlbumFromPrisma = Prisma.AlbumGetPayload<{
	include: {
		images: true;
		videos: true;
		_count: {
			select: {
				images: true;
				videos: true;
			};
		};
	};
}>;

/**
 * 🔄 Transforma un objeto Album de Prisma a nuestro tipo canónico AlbumWithRelations.
 *
 * @param prismaAlbum - El objeto Album obtenido de Prisma.
 * @returns Un objeto AlbumWithRelations compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaAlbum(prismaAlbum: AlbumFromPrisma | null): AlbumWithRelations {
	if (!prismaAlbum) {
		throw new TransformerError('El objeto de álbum de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaAlbum;

		return {
			...baseData,
			images: baseData.images ?? [],
			videos: baseData.videos ?? [],
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando álbum desde Prisma', {
			error,
			albumId: prismaAlbum.id,
		});
		throw new TransformerError(
			`Error al transformar el álbum: ${(error as Error).message}`
		);
	}
}

/**
 * 🔄 Transforma una lista de álbumes de Prisma a una lista de AlbumWithRelations.
 *
 * @param prismaAlbums - Un array de objetos Album de Prisma.
 * @returns Un array de objetos AlbumWithRelations.
 */
export function fromPrismaAlbums(prismaAlbums: AlbumFromPrisma[]): AlbumWithRelations[] {
	return prismaAlbums.map(fromPrismaAlbum);
}
