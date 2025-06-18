'use server';

/**
 * @file Acciones CRUD específicas para Tag
 * @module app/actions/tags/crud.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import {
    fromPrismaTag,
    toCreateTagData,
    toUpdateTagData,
} from '@/transformers/tag';
import type {
    TagComplete,
    TagCreateInput,
    TagUpdateInput,
} from '@/types/entities/tag';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Configuración y logging
const tagLogger = serverLogger.withContext('TagCrudActions');

// Rutas para revalidar después de operaciones
const REVALIDATE_PATHS = [
	'/dashboard/tags',
	'/dashboard/images',
	'/dashboard/stats',
	'/api/tags',
];

// Manejo de errores - enfoque funcional
enum TagErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

const createTagError = (
	message: string,
	code: TagErrorCode = TagErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'TagError';
	Object.assign(error, { code, cause });
	return error;
};

const tagInclude = {
	images: true,
	videos: true,
	albums: true,
	collections: true,
	characters: true,
	places: true,
	worldItems: true,
	concepts: true,
	prompts: true,
	notes: true,
	wildcards: true,
	properties: true,
	groups: true,
	_count: {
		select: {
			images: true,
			videos: true,
			albums: true,
			collections: true,
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
} satisfies Prisma.TagInclude;

// Notificar cambios en etiquetas
const notifyTagChange = async (
	action: 'create' | 'update' | 'delete',
	tag: TagComplete | { id: string }
) => {
	// Emitir eventos usando el sistema del servidor
	await emit({
		type: 'tags:modified',
		data: { action, tag },
	});

	// Emitir evento de estadísticas
	statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);
};

/**
 * Crea un nuevo tag en la base de datos
 */
export async function createTag(data: TagCreateInput): Promise<TagComplete> {
	try {
		tagLogger.info('📝 Creando etiqueta:', data.name);

		// Usar el transformer para mapear datos
		const prismaData = toCreateTagData(data);

		// Crear la etiqueta
		const tag = await prisma.tag.create({
			data: prismaData,
			include: tagInclude,
		});

		// Notificar cambio y revalidar rutas
		await notifyTagChange('create', fromPrismaTag(tag));
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		tagLogger.info('✅ Etiqueta creada:', { id: tag.id, name: tag.name });
		return fromPrismaTag(tag);
	} catch (error) {
		tagLogger.error('❌ Error al crear etiqueta:', { data, error });
		throw createTagError(
			'No se pudo crear la etiqueta',
			TagErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Actualiza un tag existente
 */
export async function updateTag(
	id: string,
	data: TagUpdateInput
): Promise<TagComplete> {
	try {
		tagLogger.info('📝 Actualizando etiqueta:', { tagId: id, ...data });

		// Verificar si la etiqueta existe
		const existingTag = await prisma.tag.findUnique({
			where: { id },
		});

		if (!existingTag) {
			tagLogger.warn('⚠️ Etiqueta no encontrada para actualizar:', id);
			throw createTagError(`Etiqueta no encontrada: ${id}`, TagErrorCode.NOT_FOUND);
		}

		// Usar el transformer para mapear datos
		const prismaData = toUpdateTagData(data);

		// Actualizar la etiqueta
		const tag = await prisma.tag.update({
			where: { id },
			data: prismaData,
			include: tagInclude,
		});

		// Notificar cambio y revalidar rutas
		await notifyTagChange('update', fromPrismaTag(tag));
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		tagLogger.info('✅ Etiqueta actualizada:', { id: tag.id, name: tag.name });
		return fromPrismaTag(tag);
	} catch (error) {
		tagLogger.error('❌ Error al actualizar etiqueta:', { id, data, error });

		// Manejar error específico de etiqueta no encontrada
		if ((error as any).code === TagErrorCode.NOT_FOUND) {
			throw error;
		}

		throw createTagError(
			`No se pudo actualizar la etiqueta: ${id}`,
			TagErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Elimina un tag existente
 */
export async function deleteTag(id: string): Promise<void> {
	try {
		tagLogger.info('🗑️ Eliminando etiqueta:', id);

		// Verificar si la etiqueta existe
		const tag = await prisma.tag.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!tag) {
			tagLogger.warn('⚠️ Etiqueta no encontrada para eliminar:', id);
			throw createTagError(`Etiqueta no encontrada: ${id}`, TagErrorCode.NOT_FOUND);
		}

		// Eliminar la etiqueta
		await prisma.tag.delete({ where: { id } });

		// Notificar cambio y revalidar rutas
		await notifyTagChange('delete', { id });
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		tagLogger.info('✅ Etiqueta eliminada:', { id, name: tag.name });
	} catch (error) {
		tagLogger.error('❌ Error al eliminar etiqueta:', { id, error });

		// Manejar error específico de etiqueta no encontrada
		if ((error as any).code === TagErrorCode.NOT_FOUND) {
			throw error;
		}

		throw createTagError(
			`No se pudo eliminar la etiqueta: ${id}`,
			TagErrorCode.OPERATION_FAILED,
			error
		);
	}
}
