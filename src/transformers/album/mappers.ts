/**
 * @file Funciones de mapeo para la entidad Album
 * @module transformers/album/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { AlbumBase, AlbumCreateInput, AlbumUpdateInput } from '@/types/entities/album';
import type { Album, Prisma } from '@prisma/client';

const logger = serverLogger.withContext('AlbumMappers');

/**
 * 🔄 Mapea un AlbumCreateInput a un Prisma.AlbumCreateInput.
 * Establece valores por defecto y maneja la conexión de imágenes y videos.
 */
export function mapCreateAlbumDataToPrisma(data: AlbumCreateInput): Prisma.AlbumCreateInput {
	try {
		const { images, videos, ...rest } = data;
		const prismaData: Prisma.AlbumCreateInput = {
			...rest,
			isFavorite: data.isFavorite ?? false,
			sortBy: data.sortBy ?? 'createdAt',
			filters: data.filters ?? '{}',
		};

		if (images?.connect?.length) {
			prismaData.images = {
				connect: images.connect,
			};
		}
		if (videos?.connect?.length) {
			prismaData.videos = {
				connect: videos.connect,
			};
		}

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de Album', { error, data });
		throw new Error('Error al mapear datos de creación de álbum.');
	}
}

/**
 * 🔄 Mapea un AlbumUpdateInput a un Prisma.AlbumUpdateInput.
 * Maneja la lógica de actualización de imágenes y videos.
 */
export function mapUpdateAlbumDataToPrisma(data: AlbumUpdateInput): Prisma.AlbumUpdateInput {
	try {
		const { images, videos, ...rest } = data;
		const prismaData: Prisma.AlbumUpdateInput = { ...rest };

		if (images?.set) {
			prismaData.images = {
				set: images.set.map((img) => ({ id: img.id })),
			};
		}

		if (videos?.set) {
			prismaData.videos = {
				set: videos.set.map((vid) => ({ id: vid.id })),
			};
		}

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de Album', { error, data });
		throw new Error('Error al mapear datos de actualización de álbum.');
	}
}

/**
 * 🔄 Mapea un objeto Album de Prisma a nuestro tipo canónico AlbumBase.
 * @param album - El objeto Album de Prisma.
 * @returns Un objeto compatible con AlbumBase.
 */
export function fromPrismaAlbum(album: Album): AlbumBase {
	if (!album) {
		throw new Error('Se requiere un objeto de álbum de Prisma para la transformación.');
	}

	return {
		id: album.id,
		name: album.name,
		emoji: album.emoji,
		color: album.color,
		description: album.description,
		shortcut: album.shortcut,
		category: album.category ?? 'default',
		sortBy: album.sortBy,
		filters: album.filters,
		featuredImage: album.featuredImage,
		isFavorite: album.isFavorite,
		createdAt: album.createdAt,
		updatedAt: album.updatedAt,
	};
}

/**
 * 🔄 Mapea un array de Album de Prisma a un array de nuestro tipo canónico AlbumBase.
 * @param albums - El array de objetos Album de Prisma.
 * @returns Un array de objetos compatibles con AlbumBase.
 */
export function fromPrismaAlbums(albums: Album[]): AlbumBase[] {
	if (!Array.isArray(albums)) {
		return [];
	}
	return albums.map(fromPrismaAlbum);
}
