/**
 * @file Funciones de consulta (queries) para el servicio de etiquetas
 * @module services/tag/queries
 */

import { and, asc, count, desc, eq, isNotNull, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { images, imageTags, tags } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { toTagWithStats } from '@/transformers/tag';
import type { TagWithStats } from '@/types/entities/tag';
import { TagServiceError, type GetTagsOptions, type GetTagsResult } from '../types/tag-service.types';

const logger = serverLogger.withContext('TagService');

/**
 * Obtiene una etiqueta por ID
 */
export async function getTag(id: string): Promise<TagWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo etiqueta por ID: ${id}`);

		// **MIGRACIÓN A DRIZZLE**
		const drizzleTag = await db
			.select({
				id: tags.id,
				name: tags.name,
				description: tags.description,
				color: tags.color,
				emoji: tags.emoji,
				isFavorite: tags.isFavorite,
				createdAt: tags.createdAt,
				updatedAt: tags.updatedAt,
			})
			.from(tags)
			.where(eq(tags.id, id))
			.limit(1);

		if (drizzleTag.length === 0) {
			logger.warn(`Etiqueta no encontrada: ${id}`);
			return null;
		}

		const rawTag = drizzleTag[0];

		// Transformar a formato compatible con transformadores legacy
		const transformedTag = {
			...rawTag,
			isFavorite: Boolean(rawTag.isFavorite),
		};

		const result = toTagWithStats(transformedTag as any);
		logger.info(`✅ Etiqueta encontrada: ${result.name}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al obtener etiqueta ${id}`, { error });
		throw new TagServiceError(
			`Error al obtener etiqueta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_TAG_FAILED',
			error
		);
	}
}

/**
 * Obtiene etiquetas con opciones de filtrado
 */
export async function getTags(options: GetTagsOptions = {}): Promise<GetTagsResult> {
	try {
		const { includeArchived = true, search, orderBy = 'name', orderDirection = 'asc', onlyFavorites = false } = options;

		logger.info('🏷️ Obteniendo etiquetas', { options });

		// **MIGRACIÓN A DRIZZLE**
		// Construir filtros dinámicamente
		const conditions: any[] = [];

		if (!includeArchived) {
			// Como no existe isArchived en el schema, no agregar condición
			// conditions.push(eq(tags.isArchived, false));
		}

		if (onlyFavorites) {
			conditions.push(eq(tags.isFavorite, true));
		}

		if (search) {
			conditions.push(or(like(tags.name, `%${search}%`), like(tags.description, `%${search}%`)));
		}

		// Determinar el ordenamiento
		const orderDirection_fn = orderDirection === 'desc' ? desc : asc;
		let orderByField: any;

		switch (orderBy) {
			case 'createdAt':
				orderByField = orderDirection_fn(tags.createdAt);
				break;
			case 'updatedAt':
				orderByField = orderDirection_fn(tags.updatedAt);
				break;
			default: // 'name'
				orderByField = orderDirection_fn(tags.name);
		}

		// Consulta principal
		let drizzleQuery = db
			.select({
				id: tags.id,
				name: tags.name,
				description: tags.description,
				color: tags.color,
				emoji: tags.emoji,
				isFavorite: tags.isFavorite,
				createdAt: tags.createdAt,
				updatedAt: tags.updatedAt,
			})
			.from(tags);

		// Aplicar filtros si existen
		if (conditions.length > 0) {
			drizzleQuery = drizzleQuery.where(and(...conditions));
		}

		// Aplicar ordenamiento
		const drizzleTags = await drizzleQuery.orderBy(orderByField);

		// Consulta de conteo total (con los mismos filtros)
		let countQuery = db.select({ count: count() }).from(tags);

		if (conditions.length > 0) {
			countQuery = countQuery.where(and(...conditions));
		}

		const [{ count: total }] = await countQuery;

		// Transformar resultados de Drizzle a formato compatible con transformadores legacy
		const transformedTags = drizzleTags.map((rawTag: any) => ({
			...rawTag,
			isFavorite: Boolean(rawTag.isFavorite),
		}));

		const finalTags = transformedTags.map((tag: any) => toTagWithStats(tag));

		logger.info(`✅ ${finalTags.length} etiquetas obtenidas`);
		return {
			tags: finalTags,
			total,
		};
	} catch (error) {
		logger.error('❌ Error al obtener etiquetas', { error, options });
		throw new TagServiceError(
			`Error al obtener etiquetas: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_TAGS_FAILED',
			error
		);
	}
}

/**
 * Obtiene los thumbnails de las imágenes asociadas a una etiqueta
 */
export async function getTagThumbnails(
	tagId: string,
	limit = 6
): Promise<Array<{ id: string; name?: string | null; thumbnailUrl: string }>> {
	try {
		logger.info(`🔄 Obteniendo thumbnails para etiqueta: ${tagId}, límite: ${limit}`);

		// Obtener imágenes asociadas a la etiqueta con thumbnails
		const tagImages = await db
			.select({
				id: images.id,
				name: images.name,
				path: images.path,
			})
			.from(images)
			.innerJoin(imageTags, eq(imageTags.A, images.id))
			.where(and(eq(imageTags.B, tagId), isNotNull(images.thumbnail)))
			.orderBy(desc(images.updatedAt))
			.limit(limit);

		// Mapear a formato de respuesta con URL de thumbnail
		const thumbnails = tagImages.map((image: { id: string; name: string | null; path: string }) => ({
			id: image.id,
			name: image.name,
			thumbnailUrl: `/api/images/${image.id}/thumbnail`,
		}));

		logger.info(`✅ Obtenidos ${thumbnails.length} thumbnails para etiqueta ${tagId}`);
		return thumbnails;
	} catch (error) {
		logger.error('❌ Error obteniendo thumbnails de etiqueta', { error, tagId, limit });
		throw new TagServiceError(
			`Error al obtener thumbnails de etiqueta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_TAG_THUMBNAILS_FAILED',
			error
		);
	}
}
