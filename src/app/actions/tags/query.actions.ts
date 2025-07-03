'use server';

/**
 * @file Acciones para consultas de Tag
 * @module app/actions/tags/query.actions
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import { convertServerImageToFileItem } from '@/services/image/converter.service';
import { toTagWithStats } from '@/transformers/tag';
import { TagWithStats, tagCounts } from '@/types/entities/tag';
import type { FileItem } from '@/types/files';

const tagLogger = serverLogger.withContext('TagQueryActions');

// Manejo de errores - enfoque funcional
enum TagErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

const createTagError = (message: string, code: TagErrorCode = TagErrorCode.OPERATION_FAILED, cause?: unknown) => {
	const error = new Error(message);
	error.name = 'TagError';
	Object.assign(error, { code, cause });
	return error;
};

/**
 * 🔍 Busca tags por término de búsqueda
 * @param query - Término de búsqueda
 * @param options - Opciones de búsqueda
 * @returns Array de tags que coinciden con la búsqueda
 */
export async function searchTags(
	query = '',
	options: {
		limit?: number;
		includeStats?: boolean;
		categories?: string[];
		isFavorite?: boolean;
	} = {}
): Promise<TagWithStats[]> {
	try {
		const { limit = 50, categories, isFavorite } = options;

		tagLogger.info('🔍 Buscando tags:', { query, limit, categories, isFavorite });

		// Construir filtros de búsqueda
		const where: Prisma.TagWhereInput = {
			AND: [
				// Filtro por término de búsqueda
				query.trim()
					? {
							OR: [
								{ name: { contains: query } },
								{ description: { contains: query } },
								{ category: { contains: query } },
							],
						}
					: {},
				// Filtro por categorías
				categories && categories.length > 0
					? {
							category: { in: categories },
						}
					: {},
				// Filtro por favoritos
				isFavorite !== undefined
					? {
							isFavorite,
						}
					: {},
			],
		};

		const tags = await prisma.tag.findMany({
			where,
			include: tagCounts,
			orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
			take: limit,
		});

		const transformedTags = tags.map(toTagWithStats);
		tagLogger.info(`✅ ${transformedTags.length} tags encontrados`);
		return transformedTags;
	} catch (error) {
		tagLogger.error('❌ Error al buscar tags:', { query, error });
		throw createTagError('No se pudieron buscar los tags', TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 📊 Obtiene tags populares basados en el número de asociaciones
 * @param limit - Número máximo de tags a retornar
 * @returns Array de tags ordenados por popularidad
 */
export async function getPopularTags(limit = 20): Promise<TagWithStats[]> {
	try {
		tagLogger.info('📈 Obteniendo tags populares:', { limit });

		const tags = await prisma.tag.findMany({
			include: tagCounts,
			orderBy: [{ images: { _count: 'desc' } }, { name: 'asc' }],
			take: limit,
		});

		const transformedTags = tags.map(toTagWithStats);
		tagLogger.info(`✅ ${transformedTags.length} tags populares obtenidos`);
		return transformedTags;
	} catch (error) {
		tagLogger.error('❌ Error al obtener tags populares:', error);
		throw createTagError('No se pudieron obtener los tags populares', TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 🏷️ Obtiene tags por categoría
 * @param category - Categoría de tags
 * @param limit - Número máximo de tags a retornar
 * @returns Array de tags de la categoría especificada
 */
export async function getTagsByCategory(category: string, limit = 100): Promise<TagWithStats[]> {
	try {
		tagLogger.info('📂 Obteniendo tags por categoría:', { category, limit });

		const tags = await prisma.tag.findMany({
			where: { category },
			include: tagCounts,
			orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
			take: limit,
		});

		const transformedTags = tags.map(toTagWithStats);
		tagLogger.info(`✅ ${transformedTags.length} tags de categoría '${category}' obtenidos`);
		return transformedTags;
	} catch (error) {
		tagLogger.error('❌ Error al obtener tags por categoría:', { category, error });
		throw createTagError(
			`No se pudieron obtener los tags de la categoría: ${category}`,
			TagErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * 📷 Obtiene las imágenes asociadas a un tag específico
 * @param tagId - ID del tag
 * @param limit - Número máximo de imágenes a retornar
 * @returns Array de imágenes asociadas al tag
 */
export async function getTagImages(tagId: string, limit = 50): Promise<FileItem[]> {
	try {
		tagLogger.info('🖼️ Obteniendo imágenes del tag:', { tagId, limit });

		// Verificar que el tag existe
		const tag = await prisma.tag.findUnique({
			where: { id: tagId },
			select: { id: true, name: true },
		});

		if (!tag) {
			throw createTagError(`Tag no encontrado: ${tagId}`, TagErrorCode.NOT_FOUND);
		}

		// Obtener imágenes asociadas al tag
		const images = await prisma.image.findMany({
			where: {
				tags: {
					some: { id: tagId },
				},
			},
			include: {
				tags: {
					select: {
						id: true,
						name: true,
						color: true,
					},
				},
				collections: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
					},
				},
				albums: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
					},
				},
				characters: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
						level: true,
						class: true,
						race: true,
					},
				},
				places: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
						region: true,
						type: true,
						climate: true,
					},
				},
				worldItems: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
						type: true,
						rarity: true,
					},
				},
				concepts: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
					},
				},
				prompts: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
					},
				},
				notes: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
					},
				},
				groups: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
					},
				},
				properties: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
					},
				},
				wildcards: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		// Convertir a FileItems
		const fileItems: FileItem[] = [];
		for (const image of images) {
			try {
				// Cast seguro: la consulta incluye todos los campos necesarios para ServerImage
				const fileItem = convertServerImageToFileItem(image as any);
				fileItems.push(fileItem);
			} catch (conversionError) {
				tagLogger.warn('⚠️ Error convirtiendo imagen a FileItem:', { imageId: image.id, error: conversionError });
			}
		}

		tagLogger.info(`✅ ${fileItems.length} imágenes del tag '${tag.name}' obtenidas`);
		return fileItems;
	} catch (error) {
		tagLogger.error('❌ Error al obtener imágenes del tag:', { tagId, error });

		if ((error as any).code === TagErrorCode.NOT_FOUND) {
			throw error;
		}

		throw createTagError(`No se pudieron obtener las imágenes del tag: ${tagId}`, TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 🏷️ Obtiene todos los tags con estadísticas
 * @param options - Opciones de consulta
 * @returns Array de todos los tags con estadísticas
 */
export async function getTags(includeStats = false, includeImages = false, limit?: number): Promise<TagWithStats[]> {
	try {
		tagLogger.info('🔄 Obteniendo tags:', { includeStats, includeImages, limit });

		const tags = await prisma.tag.findMany({
			include: {
				images: includeImages,
				_count: includeStats
					? {
							images: true,
							albums: true,
							collections: true,
							characters: true,
						}
					: false,
			},
			orderBy: {
				name: 'asc',
			},
			take: limit,
		});

		// Solo transformar si includeStats es true, de lo contrario devolver tags base con stats vacías
		const transformedTags = includeStats
			? tags.map(toTagWithStats)
			: tags.map(
					(tag) =>
						({
							...tag,
							stats: {
								totalRelations: 0,
								usageDiversity: 0,
								popularity: 0,
								completenessScore: 0,
							},
						}) as TagWithStats
				);

		tagLogger.info('✅ Tags obtenidos exitosamente:', transformedTags.length);
		return transformedTags;
	} catch (error) {
		tagLogger.error('❌ Error obteniendo tags:', error);
		throw new Error(`Error obteniendo tags: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}
