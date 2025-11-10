/**
 * @file Funciones de mutación (create, update, delete) para el servicio de etiquetas
 * @module services/tag/mutations
 */

import * as crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { imageTags, tags } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { recomputeAggregatesForTag } from '@/server/services/aggregates.service';
import { toTagWithStats } from '@/transformers/tag';
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';
import { TagServiceError } from '../types/tag-service.types';
import { notifyTagChange, revalidateTagPaths } from '../events/tag-events';

const logger = serverLogger.withContext('TagService');

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

/**
 * Agrega una imagen a una etiqueta
 */
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
