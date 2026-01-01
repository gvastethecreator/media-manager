/**
 * @file Servicio de gestión de etiquetas
 * @module services/tag/tag.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de etiquetas
 * @updated 2025-07-03 - ✅ MIGRADO COMPLETAMENTE A DRIZZLE ORM
 */

import * as crypto from 'crypto';
import { and, asc, count, desc, eq, isNotNull, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { images, imageTags, tags } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { revalidatePath } from '@/lib/server/revalidate';
import { recomputeAggregatesForTag } from '@/server/services/aggregates.service';
import { toTagWithStats } from '@/transformers/tag';
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';
import { TagServiceError } from './tag-errors';
import { notifyTagChange, TAG_EVENTS } from './tag-events';
import type { GetTagsOptions, GetTagsResult } from './tag-types';

// Re-exports para compatibilidad backward
export { createTagError, TagServiceError } from './tag-errors';
export { notifyTagChange, TAG_EVENTS } from './tag-events';
export type { GetTagsOptions, GetTagsResult } from './tag-types';

// Logger específico para el servicio
const logger = serverLogger.withContext('TagService');

// Constantes del servicio
const REVALIDATE_PATHS = ['/dashboard/tags', '/dashboard/images', '/dashboard/stats', '/api/tags'];

/**
 * Revalida las rutas de caché relacionadas con las etiquetas
 */
const revalidateTagPaths = async (): Promise<void> => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
};

/**
 * Obtiene una etiqueta por su ID
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
 * Crea una nueva etiqueta
 */
export async function createTag(data: TagCreateInput): Promise<TagWithStats> {
	try {
		logger.info('📝 Creando nueva etiqueta', { name: data.name });

		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.insert(tags)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				description: data.description || null,
				color: data.color || '#3b82f6',
				emoji: data.emoji || '🏷️',
				isFavorite: data.isFavorite,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		const newTag = result[0];

		// Transformar a formato compatible con transformadores legacy
		const transformedTag = {
			...newTag,
			isFavorite: Boolean(newTag.isFavorite),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				documents: 0,
				file3Ds: 0,
				jsonFiles: 0,
				audios: 0,
				albums: 0,
				collections: 0,
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

		// Revalidar rutas
		await revalidateTagPaths();

		const tagWithStats = toTagWithStats(transformedTag as any);

		// Notificar creación
		await notifyTagChange('create', tagWithStats);

		// Recompute agregados (no bloqueante)
		recomputeAggregatesForTag(tagWithStats.id).catch((err) =>
			logger.warn('No se pudo recomputar agregados para tag tras crear', { err, tagId: tagWithStats.id })
		);

		logger.info(`✅ Etiqueta creada exitosamente: ${tagWithStats.name}`, { id: tagWithStats.id });
		return tagWithStats;
	} catch (error) {
		logger.error('❌ Error al crear etiqueta', { error, data });
		throw new TagServiceError(
			`Error al crear etiqueta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'CREATE_TAG_FAILED',
			error
		);
	}
}

/**
 * Actualiza una etiqueta existente
 */
export async function updateTag(id: string, data: TagUpdateInput): Promise<TagWithStats> {
	try {
		logger.info(`📝 Actualizando etiqueta: ${id}`);

		// **MIGRACIÓN A DRIZZLE**
		// Verificar si la etiqueta existe
		const existingTag = await db.select({ id: tags.id }).from(tags).where(eq(tags.id, id)).limit(1);

		if (existingTag.length === 0) {
			throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
		}

		// Construir objeto de actualización
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (data.name !== undefined) {
			updateData.name = data.name;
		}
		if (data.description !== undefined) {
			updateData.description = data.description;
		}
		if (data.color !== undefined) {
			updateData.color = data.color;
		}
		if (data.emoji !== undefined) {
			updateData.emoji = data.emoji;
		}
		if (data.isFavorite !== undefined) {
			updateData.isFavorite = data.isFavorite;
		}

		const result = await db.update(tags).set(updateData).where(eq(tags.id, id)).returning();

		if (result.length === 0) {
			throw new TagServiceError('Error al actualizar etiqueta', 'UPDATE_FAILED');
		}

		const updatedTag = result[0];

		// Transformar a formato compatible con transformadores legacy
		const transformedTag = {
			...updatedTag,
			isFavorite: Boolean(updatedTag.isFavorite),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				documents: 0,
				file3Ds: 0,
				jsonFiles: 0,
				audios: 0,
				albums: 0,
				collections: 0,
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

		// Revalidar rutas
		await revalidateTagPaths();

		const tagWithStats = toTagWithStats(transformedTag as any);

		// Notificar actualización
		await notifyTagChange('update', tagWithStats);

		// Recompute agregados (no bloqueante)
		recomputeAggregatesForTag(tagWithStats.id).catch((err) =>
			logger.warn('No se pudo recomputar agregados para tag tras actualizar', { err, tagId: tagWithStats.id })
		);

		logger.info(`✅ Etiqueta actualizada exitosamente: ${tagWithStats.name}`, { id });
		return tagWithStats;
	} catch (error) {
		logger.error(`❌ Error al actualizar etiqueta ${id}`, { error, data });
		throw new TagServiceError(
			`Error al actualizar etiqueta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'UPDATE_TAG_FAILED',
			error
		);
	}
}

/**
 * Elimina una etiqueta
 */
export async function deleteTag(id: string): Promise<void> {
	try {
		logger.info(`🗑️ Eliminando etiqueta: ${id}`);

		// **MIGRACIÓN A DRIZZLE**
		// Verificar si la etiqueta existe
		const existingTag = await db.select({ id: tags.id, name: tags.name }).from(tags).where(eq(tags.id, id)).limit(1);

		if (existingTag.length === 0) {
			throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
		}

		// Eliminar etiqueta
		await db.delete(tags).where(eq(tags.id, id));

		// Notificar eliminación
		await notifyTagChange('delete', { id });

		// Revalidar rutas
		await revalidateTagPaths();

		logger.info(`✅ Etiqueta eliminada exitosamente: ${id}`);
	} catch (error) {
		logger.error(`❌ Error al eliminar etiqueta ${id}`, { error });
		throw new TagServiceError(
			`Error al eliminar etiqueta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'DELETE_TAG_FAILED',
			error
		);
	}
}

/**
 * Cambia el estado de favorito de una etiqueta
 */
export async function toggleTagFavorite(id: string): Promise<TagWithStats> {
	try {
		logger.info(`⭐ Cambiando estado de favorito de la etiqueta: ${id}`);

		// **MIGRACIÓN A DRIZZLE**
		// Obtener estado actual
		const currentTag = await db.select({ isFavorite: tags.isFavorite }).from(tags).where(eq(tags.id, id)).limit(1);

		if (currentTag.length === 0) {
			throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
		}

		const result = await db
			.update(tags)
			.set({
				isFavorite: !currentTag[0].isFavorite,
				updatedAt: new Date(),
			})
			.where(eq(tags.id, id))
			.returning();

		if (result.length === 0) {
			throw new TagServiceError('Error al actualizar etiqueta', 'UPDATE_FAILED');
		}

		const updatedTag = result[0];

		// Transformar a formato compatible con transformadores legacy
		const transformedTag = {
			...updatedTag,
			isFavorite: Boolean(updatedTag.isFavorite),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				documents: 0,
				file3Ds: 0,
				jsonFiles: 0,
				audios: 0,
				albums: 0,
				collections: 0,
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

		// Revalidar rutas
		await revalidateTagPaths();

		const tagWithStats = toTagWithStats(transformedTag as any);

		// Notificar actualización
		await notifyTagChange('update', tagWithStats);

		// Recompute agregados (no bloqueante)
		recomputeAggregatesForTag(tagWithStats.id).catch((err) =>
			logger.warn('No se pudo recomputar agregados para tag tras toggle favorito', { err, tagId: tagWithStats.id })
		);

		logger.info(`✅ Estado de favorito cambiado: ${id} -> ${tagWithStats.isFavorite}`);
		return tagWithStats;
	} catch (error) {
		logger.error(`❌ Error al cambiar estado de favorito de la etiqueta ${id}`, { error });
		throw new TagServiceError(
			`Error al cambiar estado de favorito: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'TOGGLE_FAVORITE_FAILED',
			error
		);
	}
}

/**
 * Cambia el estado de archivo de una etiqueta
 */
export async function toggleTagArchive(id: string): Promise<TagWithStats> {
	try {
		logger.info(`📦 Cambiando estado de archivo de la etiqueta: ${id}`);

		// **MIGRACIÓN A DRIZZLE**
		// Verificar si la etiqueta existe
		const existingTag = await db.select({ id: tags.id }).from(tags).where(eq(tags.id, id)).limit(1);

		if (existingTag.length === 0) {
			throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
		}

		// Como no existe isPublic, esta función no hace nada útil
		// Simplemente devolvemos la etiqueta actual
		const result = await db
			.update(tags)
			.set({
				updatedAt: new Date(),
			})
			.where(eq(tags.id, id))
			.returning();

		if (result.length === 0) {
			throw new TagServiceError('Error al actualizar etiqueta', 'UPDATE_FAILED');
		}

		const updatedTag = result[0];

		// Transformar a formato compatible con transformadores legacy
		const transformedTag = {
			...updatedTag,
			isFavorite: Boolean(updatedTag.isFavorite),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				documents: 0,
				file3Ds: 0,
				jsonFiles: 0,
				audios: 0,
				albums: 0,
				collections: 0,
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

		// Revalidar rutas
		await revalidateTagPaths();

		const tagWithStats = toTagWithStats(transformedTag as any);

		// Notificar actualización
		await notifyTagChange('update', tagWithStats);

		logger.info(`✅ Estado favorito cambiado: ${id} -> ${tagWithStats.isFavorite}`);
		return tagWithStats;
	} catch (error) {
		logger.error(`❌ Error al cambiar estado de archivo de la etiqueta ${id}`, { error });
		throw new TagServiceError(
			`Error al cambiar estado de archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'TOGGLE_ARCHIVE_FAILED',
			error
		);
	}
}

export async function addImageToTag(tagId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🏷️ Agregando imagen ${imageId} a etiqueta ${tagId}`);

		// **MIGRACIÓN A DRIZZLE**
		await db.insert(imageTags).values({
			A: imageId, // imageId
			B: tagId, // tagId
		});

		// Revalidar rutas y notificar
		await revalidateTagPaths();
		await notifyTagChange('update', { id: tagId });

		// Recompute agregados (no bloqueante)
		recomputeAggregatesForTag(tagId).catch((err) =>
			logger.warn('No se pudo recomputar agregados para tag tras añadir imagen', { err, tagId })
		);

		logger.info(`✅ Imagen ${imageId} agregada a etiqueta ${tagId}`);
	} catch (error) {
		logger.error('❌ Error al agregar imagen a etiqueta', { error, tagId, imageId });
		throw new TagServiceError(
			`Error al agregar imagen a etiqueta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'ADD_IMAGE_TO_TAG_FAILED',
			error
		);
	}
}

/**
 * Obtener thumbnails de imágenes asociadas a una etiqueta
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

/**
 * Clase de servicio para gestión de etiquetas
 */
export class TagService {
	async getTags(filters?: any): Promise<{ tags: TagWithStats[]; total: number }> {
		const result = await getTags(filters || {});
		return result;
	}

	async getTagById(id: string): Promise<TagWithStats | null> {
		return await getTag(id);
	}

	async createTag(data: TagCreateInput): Promise<TagWithStats> {
		return await createTag(data);
	}

	async updateTag(id: string, data: TagUpdateInput): Promise<TagWithStats | null> {
		try {
			return await updateTag(id, data);
		} catch (error) {
			if (error instanceof TagServiceError && error.code === 'TAG_NOT_FOUND') {
				return null;
			}
			throw error;
		}
	}

	async deleteTag(id: string): Promise<boolean> {
		try {
			await deleteTag(id);
			return true;
		} catch (error) {
			if (error instanceof TagServiceError && error.code === 'TAG_NOT_FOUND') {
				return false;
			}
			throw error;
		}
	}

	async getTagImages(
		id: string
	): Promise<Array<{ id: string; name: string; path: string; thumbnailPath?: string | null }>> {
		logger.info(`Obteniendo imágenes de la etiqueta ${id}`);
		try {
			const result = await db
				.select({
					id: images.id,
					name: images.name,
					path: images.path,
					thumbnailPath: images.thumbnail,
				})
				.from(imageTags)
				.innerJoin(images, eq(imageTags.A, images.id))
				.where(eq(imageTags.B, id))
				.orderBy(desc(images.createdAt));

			return result;
		} catch (error) {
			logger.error(`Error obteniendo imágenes de la etiqueta ${id}:`, error);
			return [];
		}
	}

	async getRecentTagImages(
		id: string,
		limit: number
	): Promise<Array<{ id: string; name: string; path: string; thumbnailPath?: string | null }>> {
		logger.info(`Obteniendo imágenes recientes de la etiqueta ${id} (limit: ${limit})`);
		try {
			const result = await db
				.select({
					id: images.id,
					name: images.name,
					path: images.path,
					thumbnailPath: images.thumbnail,
				})
				.from(imageTags)
				.innerJoin(images, eq(imageTags.A, images.id))
				.where(eq(imageTags.B, id))
				.orderBy(desc(images.createdAt))
				.limit(limit);

			return result;
		} catch (error) {
			logger.error(`Error obteniendo imágenes recientes de la etiqueta ${id}:`, error);
			return [];
		}
	}

	async addImageToTag(tagId: string, imageId: string): Promise<void> {
		logger.info(`Agregando imagen ${imageId} a etiqueta ${tagId}`);
		try {
			// Verificar que no exista ya
			const existing = await db
				.select()
				.from(imageTags)
				.where(and(eq(imageTags.A, imageId), eq(imageTags.B, tagId)))
				.limit(1);

			if (existing.length > 0) {
				logger.info('La imagen ya está asociada a la etiqueta');
				return;
			}

			await db.insert(imageTags).values({ A: imageId, B: tagId });
			logger.info(`✅ Imagen ${imageId} agregada a etiqueta ${tagId}`);
		} catch (error) {
			logger.error(`Error agregando imagen ${imageId} a etiqueta ${tagId}:`, error);
			throw error;
		}
	}

	async getTagThumbnails(
		id: string,
		limit = 6
	): Promise<Array<{ id: string; name?: string | null; thumbnailUrl: string }>> {
		return await getTagThumbnails(id, limit);
	}
}

// Servicio principal
const tagService = {
	getTag,
	getTags,
	createTag,
	updateTag,
	deleteTag,
	toggleTagFavorite,
	toggleTagArchive,
	addImageToTag, // <-- Añadir aquí
	notifyTagChange,
	TAG_EVENTS,
	TagServiceError,
};

export default tagService;
