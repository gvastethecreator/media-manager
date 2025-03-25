'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import { revalidatePath } from 'next/cache';

// Importar tipos y transformers actualizados
import {
    toExtendedPrompt,
    toPromptWithStats
} from '@/transformers/prompt';
import {
    PromptBase,
    PromptCreateInput,
    PromptExtended,
    PromptUpdateInput,
    PromptWithStats
} from '@/types/entities/prompt';

const promptLogger = serverLogger.withContext('PromptActions');

const REVALIDATE_PATHS = ['/settings', '/prompts', '/prompts/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	promptLogger.info('🔄 Rutas revalidadas');
};

enum PromptErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

const createPromptError = (
	message: string,
	code: PromptErrorCode = PromptErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'PromptError';
	Object.assign(error, { code, cause });
	return error;
};

// Interfaces adicionales para compatibilidad
export interface PromptWithImages extends PromptBase {
	images: FileItem[];
}

/**
 * Obtiene todos los prompts con estadísticas
 */
export async function getPrompts(): Promise<PromptWithStats[]> {
	try {
		const prompts = await prisma.prompt.findMany({
			include: {
				_count: {
					select: {
						concepts: true,
						notes: true,
						characters: true,
						places: true,
						worldItems: true,
						images: true
					},
				},
			},
			orderBy: {
				updatedAt: 'desc',
			},
		});

		return prompts.map(toPromptWithStats);
	} catch (error) {
		promptLogger.error('Error al obtener prompts:', error);
		throw createPromptError('Error al obtener prompts', PromptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un prompt específico por su ID
 */
export async function getPrompt(id: string): Promise<PromptExtended> {
	try {
		promptLogger.info('🔍 Obteniendo prompt:', id);
		const prompt = await prisma.prompt.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						concepts: true,
						notes: true,
						characters: true,
						places: true,
						worldItems: true,
						images: true
					},
				},
			},
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', PromptErrorCode.NOT_FOUND);
		}

		promptLogger.info('✅ Prompt obtenido:', prompt.name);
		return toExtendedPrompt(prompt);
	} catch (error) {
		promptLogger.error('❌ Error al obtener prompt:', error);
		if (error instanceof Error && error.name === 'PromptError') {
			throw error;
		}
		throw createPromptError('No se pudo obtener el prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un prompt con todas sus relaciones
 */
export async function getPromptWithRelations(id: string): Promise<PromptExtended> {
	try {
		promptLogger.info('🔍 Obteniendo prompt con relaciones:', id);
		const prompt = await prisma.prompt.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						concepts: true,
						notes: true,
						characters: true,
						places: true,
						worldItems: true,
						images: true
					},
				},
				concepts: {
					select: {
						id: true,
						name: true,
					},
				},
				notes: {
					select: {
						id: true,
						title: true,
					},
				},
				characters: {
					select: {
						id: true,
						name: true,
					},
				},
				places: {
					select: {
						id: true,
						name: true,
					},
				},
				worldItems: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', PromptErrorCode.NOT_FOUND);
		}

		promptLogger.info('✅ Prompt con relaciones obtenido:', prompt.name);
		return toExtendedPrompt(prompt);
	} catch (error) {
		promptLogger.error('❌ Error al obtener prompt con relaciones:', error);
		if (error instanceof Error && error.name === 'PromptError') {
			throw error;
		}
		throw createPromptError('No se pudo obtener el prompt con relaciones', PromptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo prompt
 */
export async function createPrompt(data: PromptCreateInput): Promise<PromptBase> {
	try {
		promptLogger.info('📝 Creando prompt:', data.name);
		const prompt = await prisma.prompt.create({
			data: {
				name: data.name,
				emoji: data.emoji || '🎯',
				description: data.description || null,
				color: data.color || '#3b82f6',
				content: data.content || '',
				category: data.category || 'general',
				parameters: data.parameters || '{}',
				tags: data.tags || '[]',
				featuredImage: data.featuredImage || null,
				isFavorite: data.isFavorite || false,
			},
		});

		await emit({
			type: 'prompts:modified',
			data: { action: 'create', prompt },
		});
		statsEventEmitter.emit(STATS_EVENTS.PROMPT_CHANGE);

		promptLogger.info('✅ Prompt creado:', prompt.name);
		await revalidateAllPaths();
		return prompt;
	} catch (error) {
		promptLogger.error('❌ Error al crear prompt:', error);
		throw createPromptError('No se pudo crear el prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un prompt existente
 */
export async function updatePrompt(id: string, data: PromptUpdateInput): Promise<PromptBase> {
	try {
		promptLogger.info('📝 Actualizando prompt:', id);
		const prompt = await prisma.prompt.update({
			where: { id },
			data,
		});

		await emit({
			type: 'prompts:modified',
			id,
			data: { action: 'update', prompt },
		});
		statsEventEmitter.emit(STATS_EVENTS.PROMPT_CHANGE);

		promptLogger.info('✅ Prompt actualizado:', prompt.name);
		await revalidateAllPaths();
		return prompt;
	} catch (error) {
		promptLogger.error('❌ Error al actualizar prompt:', error);
		throw createPromptError('No se pudo actualizar el prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un prompt
 */
export async function deletePrompt(id: string): Promise<{ success: boolean }> {
	try {
		promptLogger.info('🗑️ Eliminando prompt:', id);
		const prompt = await prisma.prompt.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', PromptErrorCode.NOT_FOUND);
		}

		// Primero desconectar todas las relaciones
		await prisma.$transaction([
			prisma.prompt.update({
				where: { id },
				data: {
					concepts: { set: [] },
					notes: { set: [] },
					characters: { set: [] },
					places: { set: [] },
					worldItems: { set: [] },
					images: { set: [] },
				},
			}),
			prisma.prompt.delete({
				where: { id },
			}),
		]);

		await emit({
			type: 'prompts:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.PROMPT_CHANGE);

		promptLogger.info('✅ Prompt eliminado:', id);
		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		promptLogger.error('❌ Error al eliminar prompt:', error);
		throw createPromptError('No se pudo eliminar el prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Asocia una entidad con un prompt
 */
export async function linkEntityToPrompt(
	promptId: string,
	entityId: string,
	entityType: string
): Promise<{ success: boolean }> {
	try {
		promptLogger.info('🔗 Vinculando entidad con prompt', { promptId, entityId, entityType });

		// Validar que el prompt existe
		const prompt = await prisma.prompt.findUnique({
			where: { id: promptId },
			select: { id: true },
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', PromptErrorCode.NOT_FOUND);
		}

		// Vincular basado en el tipo de entidad
		switch (entityType) {
			case 'image':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						images: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'character':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						characters: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'place':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						places: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'worldItem':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						worldItems: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'note':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						notes: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'concept':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						concepts: {
							connect: { id: entityId },
						},
					},
				});
				break;
			default:
				throw createPromptError(`Tipo de entidad no válido: ${entityType}`, PromptErrorCode.VALIDATION_ERROR);
		}

		emit({
			type: 'prompts:relation',
			data: {
				action: 'link',
				promptId,
				entityId,
				entityType,
			},
		});

		promptLogger.info('✅ Entidad vinculada con prompt');
		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		promptLogger.error('❌ Error al vincular entidad con prompt:', error);
		throw createPromptError('No se pudo vincular la entidad con el prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Desasocia una entidad de un prompt
 */
export async function unlinkEntityFromPrompt(
	promptId: string,
	entityId: string,
	entityType: string
): Promise<{ success: boolean }> {
	try {
		promptLogger.info('🔗 Desvinculando entidad de prompt', { promptId, entityId, entityType });

		// Validar que el prompt existe
		const prompt = await prisma.prompt.findUnique({
			where: { id: promptId },
			select: { id: true },
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', PromptErrorCode.NOT_FOUND);
		}

		// Desvincular basado en el tipo de entidad
		switch (entityType) {
			case 'image':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						images: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'character':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						characters: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'place':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						places: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'worldItem':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						worldItems: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'note':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						notes: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'concept':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						concepts: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			default:
				throw createPromptError(`Tipo de entidad no válido: ${entityType}`, PromptErrorCode.VALIDATION_ERROR);
		}

		emit({
			type: 'prompts:relation',
			data: {
				action: 'unlink',
				promptId,
				entityId,
				entityType,
			},
		});

		promptLogger.info('✅ Entidad desvinculada de prompt');
		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		promptLogger.error('❌ Error al desvincular entidad de prompt:', error);
		throw createPromptError('No se pudo desvincular la entidad del prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene las imágenes asociadas a un prompt
 */
export async function getPromptImages(promptId: string): Promise<{ images: FileItem[] }> {
	try {
		promptLogger.info('🖼️ Obteniendo imágenes para prompt:', promptId);
		const prompt = await prisma.prompt.findUnique({
			where: { id: promptId },
			include: {
				images: true,
			},
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', PromptErrorCode.NOT_FOUND);
		}

		// Adaptar imágenes al formato FileItem
		const images = prompt.images.map((image) => {
			return {
				id: image.id,
				name: image.name,
				path: image.path,
				type: 'image',
				size: image.size,
				width: image.width || 0,
				height: image.height || 0,
				createdAt: image.createdAt,
				updatedAt: image.updatedAt,
				thumbnail: '',
				thumbnailSize: image.thumbnailSize || 0,
				thumbnailWidth: image.thumbnailWidth || 0,
				thumbnailHeight: image.thumbnailHeight || 0,
				src: `/api/images/${image.id}`,
			} as FileItem;
		});

		promptLogger.info('✅ Imágenes obtenidas para prompt', { count: images.length });
		return { images };
	} catch (error) {
		promptLogger.error('❌ Error al obtener imágenes para prompt:', error);
		throw createPromptError('No se pudieron obtener las imágenes para el prompt', PromptErrorCode.OPERATION_FAILED, error);
	}
}
