'use server';

/**
 * @file Acciones para consultas de Tag
 * @module app/actions/tags/query.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { convertServerImageToFileItem } from '@/services/image-converter.service';
import { fromPrismaTag } from '@/transformers/tag';
import type { TagBase, TagWithStats } from '@/types/entities/tag/types';
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
 * Obtiene todos los tags con estadísticas
 */
export async function getTags(): Promise<TagWithStats[]> {
	try {
		tagLogger.info('🏷️ Obteniendo etiquetas con estadísticas');

		const tags = await prisma.tag.findMany({
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
			orderBy: [{ images: { _count: 'desc' } }, { name: 'asc' }],
		});

		tagLogger.info('✅ Etiquetas obtenidas:', { count: tags.length });
		return tags.map(fromPrismaTag);
	} catch (error) {
		tagLogger.error('❌ Error al obtener etiquetas:', error);
		throw createTagError('No se pudieron obtener las etiquetas', TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un tag por su ID
 */
export async function getTag(id: string): Promise<TagWithStats | null> {
	try {
		tagLogger.info('🔍 Obteniendo etiqueta por ID:', id);

		const tag = await prisma.tag.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		if (!tag) {
			tagLogger.warn('⚠️ Etiqueta no encontrada:', id);
			return null;
		}
		tagLogger.info('✅ Etiqueta obtenida:', { tagId: tag.id, name: tag.name });
		return fromPrismaTag(tag);
	} catch (error) {
		tagLogger.error('❌ Error al obtener etiqueta:', { id, error });
		throw createTagError(`No se pudo obtener la etiqueta: ${id}`, TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene las imágenes asociadas a un tag
 */
export async function getTagImages(id: string): Promise<FileItem[]> {
	try {
		tagLogger.info('🖼️ Obteniendo imágenes para tag:', id);

		const tag = await prisma.tag.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!tag) {
			tagLogger.warn('⚠️ Etiqueta no encontrada para obtener imágenes:', id);
			throw createTagError(`Etiqueta no encontrada: ${id}`, TagErrorCode.NOT_FOUND);
		}

		const images = await prisma.image.findMany({
			where: {
				tags: {
					some: {
						id,
					},
				},
			},
		});

		tagLogger.info('✅ Imágenes obtenidas para tag:', { tagId: id, count: images.length });
		return images.map(convertServerImageToFileItem);
	} catch (error) {
		tagLogger.error('❌ Error al obtener imágenes para tag:', { id, error });
		if ((error as any).code === TagErrorCode.NOT_FOUND) {
			throw error;
		}
		throw createTagError(
			`No se pudieron obtener las imágenes para la etiqueta: ${id}`,
			TagErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Busca etiquetas por nombre o categoría
 */
export async function searchTags(query?: string, category?: string, limit = 10): Promise<TagBase[]> {
	try {
		tagLogger.info('🔎 Buscando etiquetas:', { query, category, limit });
		const tags = await prisma.tag.findMany({
			where: {
				OR: [
					{
						name: {
							contains: query,
							mode: 'insensitive',
						},
					},
					{
						category: {
							contains: category,
							mode: 'insensitive',
						},
					},
				],
			},
			take: limit,
			orderBy: {
				name: 'asc',
			},
		});

		tagLogger.info('✅ Etiquetas encontradas:', { count: tags.length });
		return tags.map((t) => ({ ...t, category: t.category || 'general' }));
	} catch (error) {
		tagLogger.error('❌ Error al buscar etiquetas:', { query, category, error });
		throw createTagError('No se pudieron buscar las etiquetas', TagErrorCode.OPERATION_FAILED, error);
	}
}
