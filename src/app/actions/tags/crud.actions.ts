'use server';

/**
 * @file Acciones CRUD específicas para Tag
 * @module app/actions/tags/crud.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { toTagWithStats } from '@/transformers/tag';
import { TagWithStats, tagCounts } from '@/types/entities/tag';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Configuración y logging
const tagLogger = serverLogger.withContext('TagCrudActions');

// Rutas para revalidar después de operaciones
const REVALIDATE_PATHS = ['/dashboard/tags', '/dashboard/images', '/dashboard/stats', '/api/tags'];

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

// Notificar cambios en etiquetas
const notifyTagChange = async (action: 'create' | 'update' | 'delete', tag: TagWithStats | { id: string }) => {
	// Emitir eventos usando el sistema del servidor
	await emit({
		type: 'tags:modified',
		data: { action, tag },
	});

	// Emitir evento de estadísticas
	statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);
};

/**
 * 📊 Obtiene un tag por ID con estadísticas calculadas
 * @param id - ID del tag
 * @returns Tag con estadísticas o null si no existe
 */
export async function getTag(id: string): Promise<TagWithStats | null> {
	try {
		tagLogger.info('🔍 Obteniendo tag:', id);

		const tag = await prisma.tag.findUnique({
			where: { id },
			include: tagCounts,
		});

		if (!tag) {
			tagLogger.warn('⚠️ Tag no encontrado:', id);
			return null;
		}

		const transformedTag = toTagWithStats(tag);
		tagLogger.info('✅ Tag obtenido:', { id: tag.id, name: tag.name });
		return transformedTag;
	} catch (error) {
		tagLogger.error('❌ Error al obtener tag:', { id, error });
		throw createTagError(`No se pudo obtener el tag: ${id}`, TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 📊 Obtiene todos los tags con estadísticas calculadas
 * @returns Array de tags con estadísticas
 */
export async function getTags(): Promise<TagWithStats[]> {
	try {
		tagLogger.info('📋 Obteniendo todos los tags...');

		const tags = await prisma.tag.findMany({
			include: tagCounts,
			orderBy: [
				{ isFavorite: 'desc' },
				{ name: 'asc' }
			],
		});

		const transformedTags = tags.map(toTagWithStats);
		tagLogger.info(`✅ ${transformedTags.length} tags obtenidos`);
		return transformedTags;
	} catch (error) {
		tagLogger.error('❌ Error al obtener tags:', error);
		throw createTagError('No se pudieron obtener los tags', TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * ➕ Crea un nuevo tag en la base de datos
 * @param data - Datos del tag a crear, compatibles con Prisma.TagCreateInput
 * @returns Tag creado con estadísticas
 */
export async function createTag(data: Prisma.TagCreateInput): Promise<TagWithStats> {
	try {
		tagLogger.info('📝 Creando etiqueta:', data.name);

		const tag = await prisma.tag.create({
			data,
			include: tagCounts,
		});

		const transformedTag = toTagWithStats(tag);

		// Notificar cambio y revalidar rutas
		await notifyTagChange('create', transformedTag);
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		tagLogger.info('✅ Etiqueta creada:', { id: tag.id, name: tag.name });
		return transformedTag;
	} catch (error) {
		tagLogger.error('❌ Error al crear etiqueta:', { data, error });
		throw createTagError('No se pudo crear la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 🔄 Actualiza un tag existente
 * @param id - ID del tag a actualizar
 * @param data - Datos a actualizar, compatibles con Prisma.TagUpdateInput
 * @returns Tag actualizado con estadísticas
 */
export async function updateTag(id: string, data: Prisma.TagUpdateInput): Promise<TagWithStats> {
	try {
		tagLogger.info('📝 Actualizando etiqueta:', { tagId: id, ...data });

		// Verificar si la etiqueta existe para evitar errores en producción.
		const existingTag = await prisma.tag.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!existingTag) {
			tagLogger.warn('⚠️ Etiqueta no encontrada para actualizar:', id);
			throw createTagError(`Etiqueta no encontrada: ${id}`, TagErrorCode.NOT_FOUND);
		}

		const tag = await prisma.tag.update({
			where: { id },
			data,
			include: tagCounts,
		});

		const transformedTag = toTagWithStats(tag);

		// Notificar cambio y revalidar rutas
		await notifyTagChange('update', transformedTag);
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		tagLogger.info('✅ Etiqueta actualizada:', { id: tag.id, name: tag.name });
		return transformedTag;
	} catch (error) {
		tagLogger.error('❌ Error al actualizar etiqueta:', { id, data, error });

		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}

		throw createTagError(`No se pudo actualizar la etiqueta: ${id}`, TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 🗑️ Elimina un tag existente
 * @param id - ID del tag a eliminar
 */
export async function deleteTag(id: string): Promise<void> {
	try {
		tagLogger.info('🗑️ Eliminando etiqueta:', id);

		// Usamos una transacción para asegurar que la notificación solo ocurra si la eliminación es exitosa.
		await prisma.$transaction(async (tx) => {
			const tag = await tx.tag.findUnique({
				where: { id },
				select: { id: true, name: true },
			});

			if (!tag) {
				tagLogger.warn('⚠️ Etiqueta no encontrada para eliminar:', id);
				throw createTagError(`Etiqueta no encontrada: ${id}`, TagErrorCode.NOT_FOUND);
			}

			await tx.tag.delete({ where: { id } });

			// Notificar cambio después de eliminar
			await notifyTagChange('delete', { id });
		});

		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		tagLogger.info('✅ Etiqueta eliminada:', id);
	} catch (error) {
		tagLogger.error('❌ Error al eliminar etiqueta:', { id, error });

		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}

		throw createTagError(`No se pudo eliminar la etiqueta: ${id}`, TagErrorCode.OPERATION_FAILED, error);
	}
}
