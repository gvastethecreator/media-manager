/**
 * @file Servicio de gestión de etiquetas
 * @module services/tag/tag.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de etiquetas
 * @updated 2025-01-27
 */

import { Prisma } from '@prisma/client';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
// Drizzle imports
import { prisma } from '@/lib/database/prisma';
import { db } from '@/lib/drizzle';
import { tags } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from '@/lib/server/revalidate';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { toTagWithStats } from '@/transformers/tag';
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';
import { tagCounts } from '@/types/entities/tag';

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

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prismaTag = await prisma.tag.findUnique({
					where: { id },
					include: tagCounts,
				});

				if (prismaTag && transformedTag) {
					logger.info('✅ Validación dual exitosa getTag:', {
						tagName: transformedTag.name
					});
				} else if (!prismaTag && !transformedTag) {
					logger.info('✅ Validación dual exitosa getTag: ambos null');
				} else {
					logger.warn('⚠️ Diferencia en getTag:', {
						drizzleFound: !!transformedTag,
						prismaFound: !!prismaTag
					});
				}
			} catch (validationError) {
				logger.error('❌ Error en validación dual getTag:', validationError);
			}
		}

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

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				// Construir filtros para Prisma (código original)
				const where: Prisma.TagWhereInput = {};

				if (!includeArchived) {
					where.isArchived = false;
				}

				if (onlyFavorites) {
					where.isFavorite = true;
				}

				if (search) {
					where.OR = [{ name: { contains: search } }, { description: { contains: search } }];
				}

				const [prismaTotal] = await Promise.all([
					prisma.tag.count({ where }),
				]);

				// Comparar resultados básicos
				if (Math.abs(total - prismaTotal) > 0) {
					logger.warn('⚠️ Diferencia en conteo total getTags:', {
						drizzle: total,
						prisma: prismaTotal,
						options
					});
				} else {
					logger.info('✅ Validación dual exitosa getTags:', {
						total,
						tags: transformedTags.length
					});
				}
			} catch (validationError) {
				logger.error('❌ Error en validación dual getTags:', validationError);
			}
		}

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

		const tagData: Prisma.TagCreateInput = {
			name: data.name,
			description: data.description,
			color: data.color,
			emoji: data.emoji,
			isPrivate: data.isPrivate ?? false,
			isArchived: data.isArchived ?? false,
			isFavorite: data.isFavorite ?? false,
		};

		const newTag = await prisma.tag.create({
			data: tagData,
			include: tagCounts,
		});

		// Revalidar rutas
		await revalidateTagPaths();

		const result = toTagWithStats(newTag);

		// Notificar creación
		await notifyTagChange('create', result);

		logger.info(`✅ Etiqueta creada exitosamente: ${result.name}`, { id: result.id });
		return result;
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

		// Verificar si la etiqueta existe
		const existingTag = await prisma.tag.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!existingTag) {
			throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
		}

		const tagData: Prisma.TagUpdateInput = {};

		if (data.name !== undefined) tagData.name = data.name;
		if (data.description !== undefined) tagData.description = data.description;
		if (data.color !== undefined) tagData.color = data.color;
		if (data.emoji !== undefined) tagData.emoji = data.emoji;
		if (data.isPrivate !== undefined) tagData.isPrivate = data.isPrivate;
		if (data.isArchived !== undefined) tagData.isArchived = data.isArchived;
		if (data.isFavorite !== undefined) tagData.isFavorite = data.isFavorite;

		const updatedTag = await prisma.tag.update({
			where: { id },
			data: tagData,
			include: tagCounts,
		});

		// Revalidar rutas
		await revalidateTagPaths();

		const result = toTagWithStats(updatedTag);

		// Notificar actualización
		await notifyTagChange('update', result);

		logger.info(`✅ Etiqueta actualizada exitosamente: ${result.name}`, { id });
		return result;
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

		// Usar transacción para asegurar consistencia
		await prisma.$transaction(async (tx) => {
			const tag = await tx.tag.findUnique({
				where: { id },
				select: { id: true, name: true },
			});

			if (!tag) {
				throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
			}

			await tx.tag.delete({ where: { id } });

			// Notificar eliminación
			await notifyTagChange('delete', { id });
		});

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

		// Obtener estado actual
		const currentTag = await prisma.tag.findUnique({
			where: { id },
			select: { isFavorite: true },
		});

		if (!currentTag) {
			throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
		}

		const updatedTag = await prisma.tag.update({
			where: { id },
			data: { isFavorite: !currentTag.isFavorite },
			include: tagCounts,
		});

		// Revalidar rutas
		await revalidateTagPaths();

		const result = toTagWithStats(updatedTag);

		// Notificar actualización
		await notifyTagChange('update', result);

		logger.info(`✅ Estado de favorito cambiado: ${id} -> ${result.isFavorite}`);
		return result;
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

		// Obtener estado actual
		const currentTag = await prisma.tag.findUnique({
			where: { id },
			select: { isArchived: true },
		});

		if (!currentTag) {
			throw new TagServiceError('Etiqueta no encontrada', 'TAG_NOT_FOUND');
		}

		const updatedTag = await prisma.tag.update({
			where: { id },
			data: { isArchived: !currentTag.isArchived },
			include: tagCounts,
		});

		// Revalidar rutas
		await revalidateTagPaths();

		const result = toTagWithStats(updatedTag);

		// Notificar actualización
		await notifyTagChange('update', result);

		logger.info(`✅ Estado de archivo cambiado: ${id} -> ${result.isArchived}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al cambiar estado de archivo de la etiqueta ${id}`, { error });
		throw new TagServiceError(
			`Error al cambiar estado de archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'TOGGLE_ARCHIVE_FAILED',
			error
		);
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
