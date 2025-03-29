'use server';

import { EntityErrorCode, type SerializableError, createEntityErrorObject } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { EventType } from '@/lib/server/events.server';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import { revalidatePath } from 'next/cache';

// Importar tipos y transformers actualizados
import { mapCreateConceptDataToPrisma, mapUpdateConceptDataToPrisma, toConceptWithStats } from '@/transformers/concept';
import type {
    ConceptBase,
    ConceptCreateInput,
    ConceptExtended,
    ConceptUpdateInput,
    ConceptWithStats,
} from '@/types/entities/concept';

// Configuración y utilidades
const conceptLogger = serverLogger.withContext('ConceptActions');
const REVALIDATE_PATHS = ['/settings', '/concepts', '/concepts/[id]'] as const;

// Función creadora de errores (enfoque funcional)
const createConceptError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
): SerializableError => {
	return createEntityErrorObject('ConceptError', message, code, cause);
};

// Interfaces adicionales para compatibilidad
export interface ConceptWithImages extends ConceptBase {
	images: FileItem[];
}

// Funciones utilitarias
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	conceptLogger.info('🔄 Rutas revalidadas');
};

const notifyConceptChange = async (
	action: 'create' | 'update' | 'delete',
	concept: ConceptBase | { id: string },
	imageId?: string
) => {
	// Definir el evento y payload correctamente
	const eventType = 'objects:modified' as EventType; // Usando 'objects:modified' para conceptos

	// Construir el payload según la acción
	if (action === 'create' || action === 'update') {
		await emit({
			type: eventType,
			data: { action, concept },
		});
	} else if (action === 'delete') {
		await emit({
			type: eventType,
			data: { action, id: concept.id },
		});
	} else if (imageId) {
		// Para acciones relacionadas con imágenes
		await emit({
			type: eventType,
			data: { action: 'addImage', conceptId: concept.id, imageId },
		});
	}

	statsEventEmitter.emit(STATS_EVENTS.CONCEPT_CHANGE);
};

// Acciones del servidor
/**
 * Obtiene todos los conceptos con estadísticas
 */
export async function getConcepts(): Promise<ConceptWithStats[]> {
	try {
		const concepts = await prisma.concept.findMany({
			include: {
				_count: {
					select: {
						prompts: true,
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

		return concepts.map(toConceptWithStats);
	} catch (error) {
		conceptLogger.error('Error al obtener conceptos:', error);
		throw createConceptError('Error al obtener conceptos', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un concepto específico por su ID
 */
export async function getConcept(id: string): Promise<ConceptExtended> {
	try {
		conceptLogger.info('🔍 Obteniendo concepto:', id);
		const concept = await prisma.concept.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						prompts: true,
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

		if (!concept) {
			throw createConceptError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
		}

		conceptLogger.info('✅ Concepto obtenido:', concept.name);
		return toConceptWithStats(concept);
	} catch (error) {
		conceptLogger.error('❌ Error al obtener concepto:', error);
		// Preservar el error si ya es un ConceptError
		if (error instanceof Error && error.name === 'ConceptError') {
			throw error;
		}
		throw createConceptError('No se pudo obtener el concepto', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un concepto con todas sus relaciones
 */
export async function getConceptWithRelations(id: string): Promise<ConceptExtended> {
	try {
		conceptLogger.info('🔍 Obteniendo concepto con relaciones:', id);
		const concept = await prisma.concept.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						prompts: true,
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
				prompts: {
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

		if (!concept) {
			throw createConceptError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
		}

		conceptLogger.info('✅ Concepto con relaciones obtenido:', concept.name);
		return toConceptWithStats(concept);
	} catch (error) {
		conceptLogger.error('❌ Error al obtener concepto con relaciones:', error);
		// Preservar el error si ya es un ConceptError
		if (error instanceof Error && error.name === 'ConceptError') {
			throw error;
		}
		throw createConceptError('No se pudo obtener el concepto con relaciones', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo concepto
 */
export async function createConcept(data: ConceptCreateInput): Promise<ConceptBase> {
	try {
		conceptLogger.info('📝 Creando concepto:', data.name);

		// Usar el mapper para transformar los datos
		const createData = mapCreateConceptDataToPrisma(data);

		const concept = await prisma.concept.create({
			data: createData,
		});

		await emit({
			type: 'concepts:modified',
			data: { action: 'create', concept },
		});
		statsEventEmitter.emit(STATS_EVENTS.CONCEPT_CHANGE);

		conceptLogger.info('✅ Concepto creado:', concept.name);
		await revalidateAllPaths();
		return concept;
	} catch (error) {
		conceptLogger.error('❌ Error al crear concepto:', error);
		throw createConceptError('No se pudo crear el concepto', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un concepto existente
 */
export async function updateConcept(id: string, data: ConceptUpdateInput): Promise<ConceptBase> {
	try {
		conceptLogger.info('📝 Actualizando concepto:', id);

		// Usar el mapper para transformar los datos
		const updateData = mapUpdateConceptDataToPrisma(data);

		const concept = await prisma.concept.update({
			where: { id },
			data: updateData,
		});

		await emit({
			type: 'concepts:modified',
			id,
			data: { action: 'update', concept },
		});
		statsEventEmitter.emit(STATS_EVENTS.CONCEPT_CHANGE);

		conceptLogger.info('✅ Concepto actualizado:', concept.name);
		await revalidateAllPaths();
		return concept;
	} catch (error) {
		conceptLogger.error('❌ Error al actualizar concepto:', error);
		throw createConceptError('No se pudo actualizar el concepto', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un concepto
 */
export async function deleteConcept(id: string): Promise<{ success: boolean }> {
	try {
		conceptLogger.info('🗑️ Eliminando concepto:', id);
		const concept = await prisma.concept.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!concept) {
			throw createConceptError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Primero desconectar todas las relaciones
		await prisma.$transaction([
			prisma.concept.update({
				where: { id },
				data: {
					prompts: { set: [] },
					notes: { set: [] },
					characters: { set: [] },
					places: { set: [] },
					worldItems: { set: [] },
					images: { set: [] },
					groups: { set: [] },
					properties: { set: [] },
					wildcards: { set: [] },
				},
			}),
			prisma.concept.delete({
				where: { id },
			}),
		]);

		await emit({
			type: 'concepts:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.CONCEPT_CHANGE);

		conceptLogger.info('✅ Concepto eliminado:', id);
		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		conceptLogger.error('❌ Error al eliminar concepto:', error);
		throw createConceptError('No se pudo eliminar el concepto', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Asocia una entidad con un concepto
 */
export async function linkEntityToConcept(
	conceptId: string,
	entityId: string,
	entityType: string
): Promise<{ success: boolean }> {
	try {
		conceptLogger.info('🔗 Vinculando entidad con concepto', { conceptId, entityId, entityType });

		// Validar que el concepto existe
		const concept = await prisma.concept.findUnique({
			where: { id: conceptId },
			select: { id: true },
		});

		if (!concept) {
			throw createConceptError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Vincular basado en el tipo de entidad
		switch (entityType) {
			case 'image':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						images: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'character':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						characters: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'place':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						places: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'worldItem':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						worldItems: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'note':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						notes: {
							connect: { id: entityId },
						},
					},
				});
				break;
			case 'prompt':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						prompts: {
							connect: { id: entityId },
						},
					},
				});
				break;
			default:
				throw createConceptError(`Tipo de entidad no válido: ${entityType}`, EntityErrorCode.VALIDATION_ERROR);
		}

		emit({
			type: 'concepts:relation',
			data: {
				action: 'link',
				conceptId,
				entityId,
				entityType,
			},
		});

		conceptLogger.info('✅ Entidad vinculada con concepto');
		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		conceptLogger.error('❌ Error al vincular entidad con concepto:', error);
		throw createConceptError(
			'No se pudo vincular la entidad con el concepto',
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Desasocia una entidad de un concepto
 */
export async function unlinkEntityFromConcept(
	conceptId: string,
	entityId: string,
	entityType: string
): Promise<{ success: boolean }> {
	try {
		conceptLogger.info('🔗 Desvinculando entidad de concepto', { conceptId, entityId, entityType });

		// Validar que el concepto existe
		const concept = await prisma.concept.findUnique({
			where: { id: conceptId },
			select: { id: true },
		});

		if (!concept) {
			throw createConceptError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Desvincular basado en el tipo de entidad
		switch (entityType) {
			case 'image':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						images: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'character':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						characters: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'place':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						places: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'worldItem':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						worldItems: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'note':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						notes: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			case 'prompt':
				await prisma.concept.update({
					where: { id: conceptId },
					data: {
						prompts: {
							disconnect: { id: entityId },
						},
					},
				});
				break;
			default:
				throw createConceptError(`Tipo de entidad no válido: ${entityType}`, EntityErrorCode.VALIDATION_ERROR);
		}

		emit({
			type: 'concepts:relation',
			data: {
				action: 'unlink',
				conceptId,
				entityId,
				entityType,
			},
		});

		conceptLogger.info('✅ Entidad desvinculada de concepto');
		await revalidateAllPaths();
		return { success: true };
	} catch (error) {
		conceptLogger.error('❌ Error al desvincular entidad de concepto:', error);
		throw createConceptError(
			'No se pudo desvincular la entidad del concepto',
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene las imágenes asociadas a un concepto
 */
export async function getConceptImages(conceptId: string): Promise<{ images: FileItem[] }> {
	try {
		conceptLogger.info('🖼️ Obteniendo imágenes para concepto:', conceptId);
		const concept = await prisma.concept.findUnique({
			where: { id: conceptId },
			include: {
				images: true,
			},
		});

		if (!concept) {
			throw createConceptError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Adaptar imágenes al formato FileItem
		const images = concept.images.map((image) => {
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

		conceptLogger.info('✅ Imágenes obtenidas para concepto', { count: images.length });
		return { images };
	} catch (error) {
		conceptLogger.error('❌ Error al obtener imágenes para concepto:', error);
		throw createConceptError(
			'No se pudieron obtener las imágenes para el concepto',
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Añade una imagen a un concepto
 */
export async function addImageToConcept(conceptId: string, imageId: string): Promise<{ success: boolean }> {
	try {
		conceptLogger.info('➕ Añadiendo imagen a concepto:', { conceptId, imageId });

		// Verificar que el concepto existe
		const concept = await prisma.concept.findUnique({
			where: { id: conceptId },
			select: { id: true, name: true }
		});

		if (!concept) {
			throw createConceptError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Verificar que la imagen existe
		const image = await prisma.image.findUnique({
			where: { id: imageId },
			select: { id: true }
		});

		if (!image) {
			throw createConceptError('Imagen no encontrada', EntityErrorCode.NOT_FOUND);
		}

		// Crear relación entre la imagen y el concepto
		await prisma.concept.update({
			where: { id: conceptId },
			data: {
				images: {
					connect: { id: imageId }
				}
			}
		});

		// Notificar cambio y revalidar rutas
		await notifyConceptChange('update', concept, imageId);
		await revalidateAllPaths();

		conceptLogger.info('✅ Imagen añadida al concepto:', { conceptId, imageId });
		return { success: true };
	} catch (error) {
		conceptLogger.error('❌ Error al añadir imagen a concepto:', error);
		throw createConceptError('No se pudo añadir la imagen al concepto', EntityErrorCode.OPERATION_FAILED, error);
	}
}
