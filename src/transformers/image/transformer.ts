/**
 * @file Transformador principal para la entidad Image
 * @module transformers/image
 * @description Funciones para transformar imágenes de su formato Prisma al formato de la aplicación
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ImageComplete, ImageMetadata } from '@/types/entities/image';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('ImageTransformer');

/**
 * 🦾 Tipo de Prisma para una imagen con todas sus relaciones y conteos.
 */
type PrismaImageComplete = Prisma.ImageGetPayload<{
	include: {
		folder: true;
		stats: true;
		activities: true;
		uploadedImages: true;
		profiles: true;
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
		_count: {
			select: {
				activities: true;
				uploadedImages: true;
				profiles: true;
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
 * 🔄 Transforma un objeto Image de Prisma a nuestro tipo canónico ImageComplete.
 *
 * @param prismaImage - El objeto Image obtenido de Prisma, con todas las relaciones.
 * @returns Un objeto ImageComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaImage(prismaImage: PrismaImageComplete): ImageComplete {
	if (!prismaImage) {
		throw new TransformerError('El objeto de imagen de Prisma no puede ser nulo.');
	}

	try {
		const { metadata, _count, ...baseData } = prismaImage;

		let parsedMetadata: ImageMetadata | null = null;
		if (metadata) {
			try {
				parsedMetadata = JSON.parse(metadata);
			} catch (error) {
				logger.warn('Error parseando metadatos de la imagen, se usarán valores por defecto.', {
					imageId: prismaImage.id,
					error,
				});
			}
		}

		return {
			...baseData,
			metadata: parsedMetadata,
			_count: {
				activities: _count?.activities ?? 0,
				uploadedImages: _count?.uploadedImages ?? 0,
				profiles: _count?.profiles ?? 0,
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
		logger.error('Error transformando imagen desde Prisma', {
			error,
			imageId: prismaImage?.id,
		});
		throw new TransformerError(`Error al transformar la imagen: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de imágenes de Prisma a una lista de ImageComplete.
 *
 * @param prismaImages - Un array de objetos Image de Prisma.
 * @returns Un array de objetos ImageComplete.
 */
export function fromPrismaImages(prismaImages: PrismaImageComplete[]): ImageComplete[] {
	return prismaImages.map(fromPrismaImage);
}
