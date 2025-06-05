/**
 * @file Transformer para la entidad Tag
 * @module entities/tag/transformer
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type {
	RelatedTag,
	Tag,
	TagComplete,
	TagCreateInput,
	TagSearchOptions,
	TagUpdateInput,
} from '@/types/entities/tag/types';
import { mapCreateTagDataToPrisma, mapTagSearchOptionsToPrisma, mapUpdateTagDataToPrisma } from './mappers';
import { extendTag, validateTag } from './serializers';

/**
 * Busca múltiples etiquetas con opciones de filtrado y paginación
 */
export async function findManyTags(
	options: TagSearchOptions = {}
): Promise<{ items: TagComplete[]; total: number; hasMore: boolean }> {
	try {
		const prismaOptions = mapTagSearchOptionsToPrisma(options);
		const [items, total] = await Promise.all([
			prisma.tag.findMany(prismaOptions),
			prisma.tag.count({ where: prismaOptions.where }),
		]);

		const extendedItems = items.map((item) => extendTag(item as Tag));
		const hasMore = (options.skip || 0) + items.length < total;

		return { items: extendedItems, total, hasMore };
	} catch (error) {
		logger.error('Error buscando etiquetas:', error);
		throw error;
	}
}

/**
 * Busca una etiqueta por su ID
 */
export async function findTagById(id: string, include?: TagSearchOptions['include']): Promise<TagComplete | null> {
	try {
		const tag = await prisma.tag.findUnique({
			where: { id },
			include: {
				_count: true,
				...(include?.images && { images: true }),
				...(include?.videos && { videos: true }),
				...(include?.collections && { collections: true }),
				...(include?.characters && { characters: true }),
				...(include?.places && { places: true }),
				...(include?.concepts && { concepts: true }),
				...(include?.worldItems && { worldItems: true }),
				...(include?.prompts && { prompts: true }),
				...(include?.notes && { notes: true }),
				...(include?.wildcards && { wildcards: true }),
				...(include?.properties && { properties: true }),
				...(include?.groups && { groups: true }),
			},
		});

		return tag ? extendTag(tag as Tag) : null;
	} catch (error) {
		logger.error(`Error buscando etiqueta con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Crea una nueva etiqueta
 */
export async function createTag(data: TagCreateInput): Promise<TagComplete> {
	try {
		const prismaData = mapCreateTagDataToPrisma(data);
		const tag = await prisma.tag.create({
			data: prismaData,
			include: {
				_count: true,
			},
		});

		return extendTag(tag as Tag);
	} catch (error) {
		logger.error('Error creando etiqueta:', error);
		throw error;
	}
}

/**
 * Actualiza una etiqueta existente
 */
export async function updateTag(id: string, data: TagUpdateInput): Promise<TagComplete> {
	try {
		const prismaData = mapUpdateTagDataToPrisma(data);
		const tag = await prisma.tag.update({
			where: { id },
			data: prismaData,
			include: {
				_count: true,
			},
		});

		return extendTag(tag as Tag);
	} catch (error) {
		logger.error(`Error actualizando etiqueta con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Elimina una etiqueta
 */
export async function deleteTag(id: string): Promise<TagComplete> {
	try {
		const tag = await prisma.tag.delete({
			where: { id },
			include: {
				_count: true,
			},
		});

		return extendTag(tag as Tag);
	} catch (error) {
		logger.error(`Error eliminando etiqueta con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Encuentra tags relacionados con el tag especificado
 */
export async function findRelatedTags(tagId: string, limit = 10): Promise<RelatedTag[]> {
	try {
		// Este es un ejemplo simplificado. En una implementación real, se buscarían
		// tags que comparten relaciones con las mismas entidades
		const tag = await prisma.tag.findUnique({
			where: { id: tagId },
			include: {
				images: { select: { id: true } },
				videos: { select: { id: true } },
				albums: { select: { id: true } },
			},
		});

		if (!tag) return [];

		const imageIds = tag.images.map((img) => img.id);
		const videoIds = tag.videos.map((vid) => vid.id);
		const albumIds = tag.albums.map((alb) => alb.id);

		const relatedTags = await prisma.tag.findMany({
			where: {
				id: { not: tagId },
				OR: [
					{ images: { some: { id: { in: imageIds } } } },
					{ videos: { some: { id: { in: videoIds } } } },
					{ albums: { some: { id: { in: albumIds } } } },
				],
			},
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
					},
				},
			},
			take: limit,
		});

		return relatedTags
			.map((relatedTag) => {
				// Calcular una puntuación de "fuerza" basada en elementos compartidos
				const sharedImages = relatedTag.images.filter((img) => imageIds.includes(img.id)).length;
				const sharedVideos = relatedTag.videos.filter((vid) => videoIds.includes(vid.id)).length;
				const sharedAlbums = relatedTag.albums.filter((alb) => albumIds.includes(alb.id)).length;

				const totalShared = sharedImages + sharedVideos + sharedAlbums;
				const totalRelated = relatedTag._count.images + relatedTag._count.videos + relatedTag._count.albums;

				// Crear un objeto RelatedTag con los datos necesarios
				return {
					id: relatedTag.id,
					name: relatedTag.name,
					emoji: relatedTag.emoji,
					color: relatedTag.color,
					count: totalRelated,
					strength: totalShared,
				};
			})
			.sort((a, b) => b.strength - a.strength);
	} catch (error) {
		logger.error(`Error buscando tags relacionados para tag ${tagId}:`, error);
		throw error;
	}
}

/**
 * Extiende una etiqueta con campos calculados
 */
export function extendTagTransform(tag: Tag): TagComplete {
	return extendTag(tag);
}

/**
 * Valida que una etiqueta tenga los campos requeridos
 */
export function validateTagData(tag: Tag): boolean {
	return validateTag(tag);
}
