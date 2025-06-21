/**
 * @file Funciones para serializar y deserializar datos de álbumes
 * @module transformers/album/serializers
 */

import type {
    AlbumCreateInput,
    AlbumUpdateInput,
} from '@/types/entities/album';
import type { Prisma } from '@prisma/client';

/**
 * 🔄 Serializa los datos para crear un álbum en Prisma.
 */
export function toPrismaAlbumCreate(
	data: AlbumCreateInput,
): Prisma.AlbumCreateInput {
	const { images, videos, ...rest } = data;
	const prismaData: Prisma.AlbumCreateInput = {
		...rest,
	};

	if (images && images.length > 0) {
		prismaData.images = { connect: images.map((img) => ({ id: img.id })) };
	}

	if (videos && videos.length > 0) {
		prismaData.videos = { connect: videos.map((vid) => ({ id: vid.id })) };
	}

	return prismaData;
}

/**
 * 🔄 Serializa los datos para actualizar un álbum en Prisma.
 */
export function toPrismaAlbumUpdate(
	data: AlbumUpdateInput,
): Prisma.AlbumUpdateInput {
	const { images, videos, ...rest } = data;
	const prismaData: Prisma.AlbumUpdateInput = {
		...rest,
	};

	if (images) {
		prismaData.images = { set: images.map((img) => ({ id: img.id })) };
	}

	if (videos) {
		prismaData.videos = { set: videos.map((vid) => ({ id: vid.id })) };
	}

	return prismaData;
}
