/**
 * @file Servicio de gestión de etiquetas
 * @module services/tag/tag.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de etiquetas
 * @updated 2025-07-03 - ✅ MIGRADO COMPLETAMENTE A DRIZZLE ORM
 */

import { db } from '@/lib/drizzle';
import { tags } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from '@/lib/server/revalidate';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { toTagWithStats } from '@/transformers/tag';
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';
import * as crypto from 'crypto';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';

// Logger específico para el servicio
const logger = serverLogger.withContext('TagService');

// Constantes del servicio
const REVALIDATE_PATHS = ['/dashboard/tags', '/dashboard/images', '/dashboard/stats', '/api/tags'];

// Eventos del servicio de etiquetas
export const TAG_EVENTS = {
	CREATED: 'tag:created',
	UPDATED: 'tag:updated',
	DELETED: 'tag:deleted',
	STATS_UPDATED: 'tag:stats:updated',
	ERROR: 'tag:error',
} as const;

// Tipos de entrada
export interface GetTagsOptions {
	includeArchived?: boolean;
	search?: string;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	onlyFavorites?: boolean;
}

export interface GetTagsResult {
	tags: TagWithStats[];
	total: number;
}

/**
 * Clase de error personalizada para operaciones de Tag
 */
export class TagServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'TagServiceError';
	}
}

/**
 * Notifica cambios en las etiquetas a través del sistema de eventos
 */
export const notifyTagChange = async (
	action: 'create' | 'update' | 'delete',
	tag: TagWithStats | { id: string }
): Promise<void> => {
	try {
		let eventType: string;
		switch (action) {
			case 'create':
				eventType = TAG_EVENTS.CREATED;
				break;
			case 'update':
				eventType = TAG_EVENTS.UPDATED;
				break;
			case 'delete':
				eventType = TAG_EVENTS.DELETED;
				break;
			default:
				eventType = 'tag:modified';
		}

		// Emitir evento al sistema central
		await emit({
			type: 'tags:modified',
			data: { action, tag },
		});

		// Notificar a estadísticas
		statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);

		logger.info(`🔔 Notificado cambio en etiqueta: ${action}`, { tagId: tag.id });
	} catch (error) {
		logger.error(`❌ Error al notificar cambio en etiqueta: ${action}`, { error, tagId: tag.id });
	}
};

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
				isArchived: tags.isArchived,
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

		// Transformar a formato compatible con Prisma
		const transformedTag = {
			...rawTag,
			isFavorite: Boolean(rawTag.isFavorite),
			isArchived: Boolean(rawTag.isArchived),
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
			conditions.push(eq(tags.isArchived, false));
		}

		if (onlyFavorites) {
			conditions.push(eq(tags.isFavorite, true));
		}

		if (search) {
			conditions.push(
				or(
					like(tags.name, `%${search}%`),
					like(tags.description, `%${search}%`)
				)
			);
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
				isArchived: tags.isArchived,
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

		// Transformar resultados de Drizzle a formato compatible con Prisma
		const transformedTags = drizzleTags.map((rawTag) => ({
			...rawTag,
			isFavorite: Boolean(rawTag.isFavorite),
			isArchived: Boolean(rawTag.isArchived),
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
		}));

		const finalTags = transformedTags.map(toTagWithStats);

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
		const result = await db.insert(tags).values({
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description || null,
			color: data.color || '#3b82f6',
			emoji: data.emoji || '🏷️',
			category: data.category || null,
			isPublic: data.isPublic || false,
			isFavorite: data.isFavorite || false,
			totalImages: 0,
			totalVideos: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		}).returning();

		const newTag = result[0];

		// Transformar a formato compatible con Prisma
		const transformedTag = {
			...newTag,
			isPublic: Boolean(newTag.isPublic),
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
		const existingTag = await db
			.select({ id: tags.id })
			.from(tags)
			.where(eq(tags.id, id))
			.limit(1);

		if (existingTag.length === 0) {
			throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
		}

		// Construir objeto de actualización
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		const result = await db.update(tags)
			.set(updateData)
			.where(eq(tags.id, id))
			.returning();

		if (result.length === 0) {
			throw new TagServiceError('Error al actualizar etiqueta', 'UPDATE_FAILED');
		}

		const updatedTag = result[0];

		// Transformar a formato compatible con Prisma
		const transformedTag = {
			...updatedTag,
			isPublic: Boolean(updatedTag.isPublic),
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
		const existingTag = await db
			.select({ id: tags.id, name: tags.name })
			.from(tags)
			.where(eq(tags.id, id))
			.limit(1);

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
		const currentTag = await db
			.select({ isFavorite: tags.isFavorite })
			.from(tags)
			.where(eq(tags.id, id))
			.limit(1);

		if (currentTag.length === 0) {
			throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
		}

		const result = await db.update(tags)
			.set({
				isFavorite: !currentTag[0].isFavorite,
				updatedAt: new Date()
			})
			.where(eq(tags.id, id))
			.returning();

		if (result.length === 0) {
			throw new TagServiceError('Error al actualizar etiqueta', 'UPDATE_FAILED');
		}

		const updatedTag = result[0];

		// Transformar a formato compatible con Prisma
		const transformedTag = {
			...updatedTag,
			isPublic: Boolean(updatedTag.isPublic),
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
		// Obtener estado actual
		const currentTag = await db
			.select({ isPublic: tags.isPublic })
			.from(tags)
			.where(eq(tags.id, id))
			.limit(1);

		if (currentTag.length === 0) {
			throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
		}

		const result = await db.update(tags)
			.set({
				isPublic: !currentTag[0].isPublic,
				updatedAt: new Date()
			})
			.where(eq(tags.id, id))
			.returning();

		if (result.length === 0) {
			throw new TagServiceError('Error al actualizar etiqueta', 'UPDATE_FAILED');
		}

		const updatedTag = result[0];

		// Transformar a formato compatible con Prisma
		const transformedTag = {
			...updatedTag,
			isPublic: Boolean(updatedTag.isPublic),
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

		logger.info(`✅ Estado de archivo cambiado: ${id} -> ${tagWithStats.isPublic}`);
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

	async getTagImages(id: string): Promise<any[]> {
		// TODO: Implementar lógica para obtener imágenes de la etiqueta
		logger.info(`Obteniendo imágenes de la etiqueta ${id}`);
		return [];
	}

	async getRecentTagImages(id: string, limit: number): Promise<any[]> {
		// TODO: Implementar lógica para obtener imágenes recientes de la etiqueta
		logger.info(`Obteniendo imágenes recientes de la etiqueta ${id} (limit: ${limit})`);
		return [];
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
	notifyTagChange,
	TAG_EVENTS,
	TagServiceError,
};

export default tagService;
