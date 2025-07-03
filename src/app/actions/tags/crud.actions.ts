'use server';

/**
 * @file Acciones CRUD específicas para Tag
 * @module app/actions/tags/crud.actions
 * @description Controladores delgados que llaman al servicio de etiquetas
 * @updated 2025-01-27
 */

import { Prisma } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import tagService, { type GetTagsOptions } from '@/services/tag/tag.service';
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';

// Configuración y logging
const logger = serverLogger.withContext('TagActions');

/**
 * Obtiene un tag por ID con estadísticas calculadas
 */
export async function getTag(id: string): Promise<TagWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo tag ${id} via action`);
		return await tagService.getTag(id);
	} catch (error) {
		logger.error(`❌ Error en action getTag: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene todos los tags con estadísticas calculadas
 */
export async function getTags(options?: GetTagsOptions): Promise<TagWithStats[]> {
	try {
		logger.info('📋 Obteniendo tags via action', { options });
		const result = await tagService.getTags(options);
		return result.tags;
	} catch (error) {
		logger.error('❌ Error en action getTags', { error, options });
		throw error;
	}
}

/**
 * Crea un nuevo tag en la base de datos
 */
export async function createTag(data: TagCreateInput): Promise<TagWithStats> {
	try {
		logger.info('📝 Creando tag via action', { name: data.name });
		return await tagService.createTag(data);
	} catch (error) {
		logger.error('❌ Error en action createTag', { error, data });
		throw error;
	}
}

/**
 * Actualiza un tag existente
 */
export async function updateTag(id: string, data: TagUpdateInput): Promise<TagWithStats> {
	try {
		logger.info(`📝 Actualizando tag ${id} via action`);
		return await tagService.updateTag(id, data);
	} catch (error) {
		logger.error(`❌ Error en action updateTag: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un tag existente
 */
export async function deleteTag(id: string): Promise<void> {
	try {
		logger.info(`🗑️ Eliminando tag ${id} via action`);
		await tagService.deleteTag(id);
	} catch (error) {
		logger.error(`❌ Error en action deleteTag: ${id}`, { error });
		throw error;
	}
}

/**
 * Cambia el estado de favorito de un tag
 */
export async function toggleTagFavorite(id: string): Promise<TagWithStats> {
	try {
		logger.info(`⭐ Cambiando favorito de tag ${id} via action`);
		return await tagService.toggleTagFavorite(id);
	} catch (error) {
		logger.error(`❌ Error en action toggleTagFavorite: ${id}`, { error });
		throw error;
	}
}

/**
 * Cambia el estado de archivo de un tag
 */
export async function toggleTagArchive(id: string): Promise<TagWithStats> {
	try {
		logger.info(`📦 Cambiando archivo de tag ${id} via action`);
		return await tagService.toggleTagArchive(id);
	} catch (error) {
		logger.error(`❌ Error en action toggleTagArchive: ${id}`, { error });
		throw error;
	}
}

// Mantener compatibilidad con código legacy que usa Prisma types
export async function createTagLegacy(data: Prisma.TagCreateInput): Promise<TagWithStats> {
	const tagInput: TagCreateInput = {
		name: data.name,
		description: data.description || undefined,
		color: data.color || undefined,
		emoji: data.emoji || undefined,
		category: data.category || undefined,
		shortcut: data.shortcut || undefined,
		featuredImage: data.featuredImage || undefined,
		isFavorite: data.isFavorite || false,
	};
	return createTag(tagInput);
}

export async function updateTagLegacy(id: string, data: Prisma.TagUpdateInput): Promise<TagWithStats> {
	const tagInput: TagUpdateInput = {};
	if (data.name !== undefined) tagInput.name = data.name as string;
	if (data.description !== undefined) tagInput.description = data.description as string | undefined;
	if (data.color !== undefined) tagInput.color = data.color as string | undefined;
	if (data.emoji !== undefined) tagInput.emoji = data.emoji as string | undefined;
	if (data.category !== undefined) tagInput.category = data.category as string | undefined;
	if (data.shortcut !== undefined) tagInput.shortcut = data.shortcut as string | undefined;
	if (data.featuredImage !== undefined) tagInput.featuredImage = data.featuredImage as string | undefined;
	if (data.isFavorite !== undefined) tagInput.isFavorite = data.isFavorite as boolean;

	return updateTag(id, tagInput);
}
