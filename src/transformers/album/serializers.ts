/**
 * @file Funciones para serializar y deserializar datos de álbumes
 * @module transformers/album/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    AlbumComplete,
    AlbumCreateInput,
    AlbumRelations
} from '@/types/entities/album';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma, Album as PrismaAlbum } from '@prisma/client';

const logger = serverLogger.withContext('AlbumSerializer');

type PrismaAlbumWithRelations = PrismaAlbum & {
	images?: { id: string }[];
	videos?: { id: string }[];
	children?: PrismaAlbum[];
	_count?: {
		images?: number;
		videos?: number;
		children?: number;
	};
};

/**
 * 🔄 Serializa un Album para crearlo en Prisma.
 */
export function toPrismaAlbum(data: AlbumCreateInput): Prisma.AlbumCreateInput {
	const { images, videos, ...rest } = data;
	const prismaData: Prisma.AlbumCreateInput = {
		...rest,
	};
	if (images) {
		prismaData.images = { connect: images.connect };
	}
	if (videos) {
		prismaData.videos = { connect: videos.connect };
	}
	return prismaData;
}

/**
 * 🔄 Deserializa un Album desde Prisma.
 */
export function fromPrismaAlbum(prismaAlbum: PrismaAlbumWithRelations): AlbumComplete {
	try {
		const { _count, ...baseData } = prismaAlbum;

		const relations: AlbumRelations = {};
		if (baseData.images) {
			relations.images = baseData.images;
		}
		if (baseData.videos) {
			relations.videos = baseData.videos;
		}

		const completeAlbum: AlbumComplete = {
			...baseData,
			...relations,
			filters: baseData.filters ? JSON.parse(baseData.filters) : {},
			sortBy: baseData.sortBy ?? 'createdAt_desc',
			isRecent: false,
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		return completeAlbum;
	} catch (error) {
		logger.error('Error al transformar álbum desde Prisma', {
			error,
			albumId: prismaAlbum?.id,
		});
		throw new TransformerError(`Error al transformar el álbum: ${(error as Error).message}`);
	}
}
