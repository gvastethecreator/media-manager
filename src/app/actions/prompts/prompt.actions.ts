'use server';

import { getPrismaClient } from '@/lib/db';
import { createEntityErrorObject, EntityErrorCode, PromptError, type SerializableError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { revalidatePath } from 'next/cache';
// Importar tipos y transformers actualizados
import {
	mapCreatePromptDataToPrisma,
	mapUpdatePromptDataToPrisma,
	toExtendedPrompt,
	toPromptWithStats,
} from '@/transformers/prompt';
import { type ExtendedPrompt } from '@/transformers/prompt/serializers';
import type { PromptBase, PromptCreateInput, PromptUpdateInput, PromptWithStats } from '@/types/entities/prompt';
import type { FileItem } from '@/types/files';

const promptLogger = serverLogger.withContext('PromptActions');

const REVALIDATE_PATHS = ['/settings', '/prompts', '/prompts/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	promptLogger.info('🔄 Rutas revalidadas');
};

// Función creadora de errores (enfoque funcional)
const createPromptError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
): SerializableError => {
	return createEntityErrorObject('PromptError', message, code, cause);
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
		const prisma = await getPrismaClient();
		const prompts = await prisma.prompt.findMany({
			include: {
				_count: {
					select: {
						concepts: true,
						notes: true,
						characters: true,
						places: true,
						worldItems: true,
						images: true,
						groups: true,
						properties: true,
						wildcards: true,
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
		throw createPromptError('Error al obtener prompts', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un prompt específico por su ID
 */
export async function getPrompt(id: string): Promise<ExtendedPrompt> {
	try {
		promptLogger.info('🔍 Obteniendo prompt:', id);
		const prisma = await getPrismaClient();
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
						images: true,
						groups: true,
						properties: true,
						wildcards: true,
					},
				},
			},
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', EntityErrorCode.NOT_FOUND);
		}

		promptLogger.info('✅ Prompt obtenido:', prompt.name);
		return toExtendedPrompt(prompt);
	} catch (error) {
		promptLogger.error('❌ Error al obtener prompt:', error);
		if (error instanceof PromptError) {
			throw error;
		}
		throw createPromptError('No se pudo obtener el prompt', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un prompt con todas sus relaciones
 */
export async function getPromptWithRelations(id: string): Promise<ExtendedPrompt> {
	try {
		promptLogger.info('🔍 Obteniendo prompt con relaciones:', id);
		const prisma = await getPrismaClient();
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
						images: true,
						groups: true,
						properties: true,
						wildcards: true,
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
				groups: {
					select: {
						id: true,
						name: true,
					},
				},
				properties: {
					select: {
						id: true,
						name: true,
					},
				},
				wildcards: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', EntityErrorCode.NOT_FOUND);
		}

		promptLogger.info('✅ Prompt con relaciones obtenido:', prompt.name);
		return toExtendedPrompt(prompt);
	} catch (error) {
		promptLogger.error('❌ Error al obtener prompt con relaciones:', error);
		if (error instanceof PromptError) {
			throw error;
		}
		throw createPromptError('No se pudo obtener el prompt con relaciones', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo prompt
 */
export async function createPrompt(data: PromptCreateInput): Promise<PromptBase> {
	try {
		promptLogger.info('📝 Creando prompt:', data.name);

		// Usar el mapper para preparar los datos
		const createData = mapCreatePromptDataToPrisma(data);

		const prisma = await getPrismaClient();
		const prompt = await prisma.prompt.create({
			data: createData,
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
		throw createPromptError('No se pudo crear el prompt', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un prompt existente
 */
export async function updatePrompt(id: string, data: PromptUpdateInput): Promise<PromptBase> {
	try {
		promptLogger.info('📝 Actualizando prompt:', id);

		// Usar el mapper para preparar los datos
		const updateData = mapUpdatePromptDataToPrisma(id, data);

		const prisma = await getPrismaClient();
		const prompt = await prisma.prompt.update({
			where: { id },
			data: updateData.data,
		});

		await emit({
			type: 'prompts:modified',
			id,
			data: { action: 'update', prompt },
		});
		statsEventEmitter.emit(STATS_EVENTS.PROMPT_CHANGE, id);

		promptLogger.info('✅ Prompt actualizado:', prompt.name);
		await revalidateAllPaths();
		return prompt;
	} catch (error) {
		promptLogger.error('❌ Error al actualizar prompt:', error);
		throw createPromptError('No se pudo actualizar el prompt', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un prompt existente
 */
export async function deletePrompt(id: string): Promise<{ success: boolean }> {
	try {
		promptLogger.info('🗑️ Eliminando prompt:', id);

		// Verificar que el prompt existe
		const prisma = await getPrismaClient();
		const prompt = await prisma.prompt.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
			},
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Primero desconectar todas las relaciones
		await prisma.$transaction([
			prisma.prompt.update({
				where: { id },
				data: {
					images: { set: [] },
					concepts: { set: [] },
					notes: { set: [] },
					characters: { set: [] },
					places: { set: [] },
					worldItems: { set: [] },
					groups: { set: [] },
					properties: { set: [] },
					wildcards: { set: [] },
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
		throw createPromptError('No se pudo eliminar el prompt', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Vincula una entidad a un prompt
 */
export async function linkEntityToPrompt(
	promptId: string,
	entityId: string,
	entityType: string
): Promise<{ success: boolean }> {
	try {
		promptLogger.info('🔄 Vinculando entidad a prompt:', { promptId, entityId, entityType });

		// Verificar que el prompt existe
		const prisma = await getPrismaClient();
		const prompt = await prisma.prompt.findUnique({
			where: { id: promptId },
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Actualizar según el tipo de entidad
		switch (entityType) {
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
			case 'group':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						groups: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'property':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						properties: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'wildcard':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						wildcards: {
							connect: { id: entityId },
						},
					},
				});
				break;
			default:
				throw createPromptError(`Tipo de entidad no soportado: ${entityType}`, EntityErrorCode.VALIDATION_ERROR);
		}

		await emit({
			type: 'prompts:modified',
			id: promptId,
			data: { action: 'update', promptId, entityId, entityType },
		});

		promptLogger.info('✅ Entidad vinculada a prompt:', { promptId, entityId, entityType });
		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		promptLogger.error('❌ Error al vincular entidad a prompt:', { promptId, entityId, entityType, error });
		throw createPromptError('No se pudo vincular la entidad al prompt', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Desvincula una entidad de un prompt
 */
export async function unlinkEntityFromPrompt(
	promptId: string,
	entityId: string,
	entityType: string
): Promise<{ success: boolean }> {
	try {
		promptLogger.info('🔄 Desvinculando entidad de prompt:', { promptId, entityId, entityType });

		// Verificar que el prompt existe
		const prisma = await getPrismaClient();
		const prompt = await prisma.prompt.findUnique({
			where: { id: promptId },
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Actualizar según el tipo de entidad
		switch (entityType) {
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
			case 'group':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						groups: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'property':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						properties: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'wildcard':
				await prisma.prompt.update({
					where: { id: promptId },
					data: {
						wildcards: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			default:
				throw createPromptError(`Tipo de entidad no soportado: ${entityType}`, EntityErrorCode.VALIDATION_ERROR);
		}

		await emit({
			type: 'prompts:modified',
			id: promptId,
			data: { action: 'update', promptId, entityId, entityType },
		});

		promptLogger.info('✅ Entidad desvinculada de prompt:', { promptId, entityId, entityType });
		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		promptLogger.error('❌ Error al desvincular entidad de prompt:', { promptId, entityId, entityType, error });
		throw createPromptError('No se pudo desvincular la entidad del prompt', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene las imágenes asociadas a un prompt
 */
export async function getPromptImages(promptId: string): Promise<{ images: FileItem[] }> {
	try {
		promptLogger.info('🔍 Obteniendo imágenes del prompt:', promptId);

		// Verificar que el prompt existe
		const prisma = await getPrismaClient();
		const prompt = await prisma.prompt.findUnique({
			where: { id: promptId },
			include: {
				images: {
					select: {
						id: true,
						name: true,
						path: true,
						width: true,
						height: true,
						size: true,
						createdAt: true,
						updatedAt: true,
						metadata: true,
					},
				},
			},
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Transformar a FileItem[]
		const images: FileItem[] = prompt.images.map((image) => ({
			id: image.id,
			name: image.name,
			path: image.path,
			type: 'image' as const,
			size: image.size,
			width: image.width || 0,
			height: image.height || 0,
			src: `/api/images/${image.id}/thumbnail`,
			createdAt: image.createdAt,
			updatedAt: image.updatedAt,
			tags: [],
			metadata: image.metadata || {},
			isSelected: false,
			isVisible: true,
		}));

		promptLogger.info('✅ Imágenes del prompt obtenidas:', { promptId, count: images.length });
		return { images };
	} catch (error) {
		promptLogger.error('❌ Error al obtener imágenes del prompt:', { promptId, error });
		throw createPromptError('No se pudieron obtener las imágenes del prompt', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Agrega una imagen a un prompt
 */
export async function addImageToPrompt(promptId: string, imageId: string): Promise<{ success: boolean }> {
	try {
		promptLogger.info('🔄 Agregando imagen a prompt:', { promptId, imageId });

		// Verificar que el prompt y la imagen existen
		const prisma = await getPrismaClient();
		const prompt = await prisma.prompt.findUnique({
			where: { id: promptId },
		});

		if (!prompt) {
			throw createPromptError('Prompt no encontrado', EntityErrorCode.NOT_FOUND);
		}

		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw createPromptError('Imagen no encontrada', EntityErrorCode.NOT_FOUND);
		}

		// Agregar la imagen al prompt
		await prisma.prompt.update({
			where: { id: promptId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		await emit({
			type: 'prompts:modified',
			id: promptId,
			data: { action: 'update', promptId, imageId },
		});

		promptLogger.info('✅ Imagen agregada a prompt:', { promptId, imageId });
		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		promptLogger.error('❌ Error al agregar imagen a prompt:', { promptId, imageId, error });
		throw createPromptError('No se pudo agregar la imagen al prompt', EntityErrorCode.OPERATION_FAILED, error);
	}
}
