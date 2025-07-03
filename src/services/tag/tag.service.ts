/**
 * @file Servicio de gestión de etiquetas
 * @module services/tag/tag.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de etiquetas
 * @updated 2025-01-27
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
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

		const tag = await prisma.tag.findUnique({
			where: { id },
			include: tagCounts,
		});

		if (!tag) {
			logger.warn(`Etiqueta no encontrada: ${id}`);
			return null;
		}

		const result = toTagWithStats(tag);
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

		// Construir filtros
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

		// Obtener etiquetas
		const [tags, total] = await Promise.all([
			prisma.tag.findMany({
				where,
				include: tagCounts,
				orderBy:
					orderBy === 'name' ? [{ isFavorite: 'desc' }, { name: orderDirection }] : { [orderBy]: orderDirection },
			}),
			prisma.tag.count({ where }),
		]);

		const transformedTags = tags.map(toTagWithStats);

		logger.info(`✅ ${transformedTags.length} etiquetas obtenidas`);
		return {
			tags: transformedTags,
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
