'use server';

import { logger } from '@/lib/logger/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { EventType } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { Concept } from '@/types/entities/concepts';
import type { FileItem } from '@/types/file-item';
import type { Concept as PrismaConcept } from '@prisma/client';
import type { Image } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Configuración y utilidades
const conceptLogger = logger.withContext('ConceptActions');
const REVALIDATE_PATHS = ['/settings', '/concepts', '/concepts/[id]'] as const;

// Códigos de error
enum ConceptErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Función creadora de errores (enfoque funcional)
const createConceptError = (
	message: string,
	code: ConceptErrorCode = ConceptErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'ConceptError';
	Object.assign(error, { code, cause });
	return error;
};

// Interfaces
export interface ConceptCreate {
	name: string;
	emoji?: string;
	description?: string | null;
	color?: string;
	content?: string;
	category?: string;
	tags?: string;
	featuredImage?: string | null;
}

export interface ConceptUpdate extends Partial<ConceptCreate> {
	id: string;
}

export interface ConceptWithStats extends Concept {
	_count: {
		prompts: number;
		notes: number;
		characters: number;
		places: number;
		worldItems: number;
	};
	lastUpdated: Date;
}

export interface ConceptWithImages extends PrismaConcept {
	images: FileItem[];
}

export interface ExtendedConcept extends Omit<Concept, 'characters' | 'places' | 'worldItems' | 'notes' | 'prompts'> {
	prompts?: { id: string; name: string }[];
	notes?: { id: string; title: string }[];
	characters?: { id: string; name: string }[];
	places?: { id: string; name: string }[];
	worldItems?: { id: string; name: string }[];
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
	concept: PrismaConcept | { id: string },
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
					},
				},
			},
			orderBy: {
				updatedAt: 'desc',
			},
		});

		return concepts.map((concept) => ({
			...concept,
			lastUpdated: concept.updatedAt,
		}));
	} catch (error) {
		console.error('Error al obtener conceptos:', error);
		throw new Error('Error al obtener conceptos');
	}
}

export async function getConcept(id: string): Promise<Concept> {
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
					},
				},
			},
		});

		if (!concept) {
			throw createConceptError('Concepto no encontrado', ConceptErrorCode.NOT_FOUND);
		}

		conceptLogger.info('✅ Concepto obtenido:', concept.name);
		return {
			...concept,
			_count: concept._count,
		};
	} catch (error) {
		conceptLogger.error('❌ Error al obtener concepto:', error);
		// Preservar el error si ya es un ConceptError
		if (error instanceof Error && error.name === 'ConceptError') {
			throw error;
		}
		throw createConceptError('No se pudo obtener el concepto', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

export async function createConcept(data: ConceptCreate): Promise<Concept> {
	try {
		conceptLogger.info('📝 Creando concepto:', data.name);

		// Validación de entrada
		if (!data.name?.trim()) {
			throw createConceptError('El nombre del concepto es requerido', ConceptErrorCode.VALIDATION_ERROR);
		}

		const concept = await prisma.concept.create({
			data: {
				name: data.name,
				emoji: data.emoji || '💡',
				description: data.description || null,
				color: data.color || '#3b82f6',
				content: data.content || '',
				category: data.category || 'general',
				tags: data.tags || '[]',
				featuredImage: data.featuredImage || null,
			},
		});

		await notifyConceptChange('create', concept);

		conceptLogger.info('✅ Concepto creado:', concept.name);
		await revalidateAllPaths();
		return concept;
	} catch (error) {
		conceptLogger.error('❌ Error al crear concepto:', error);
		// Preservar el error si ya es un ConceptError
		if (error instanceof Error && error.name === 'ConceptError') {
			throw error;
		}
		throw createConceptError('No se pudo crear el concepto', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateConcept(id: string, data: ConceptUpdate): Promise<Concept> {
	try {
		conceptLogger.info('📝 Actualizando concepto:', id);

		// Validación de entrada
		if (data.name === '') {
			throw createConceptError('El nombre del concepto no puede estar vacío', ConceptErrorCode.VALIDATION_ERROR);
		}

		const concept = await prisma.concept.update({
			where: { id },
			data,
		});

		await notifyConceptChange('update', concept);

		conceptLogger.info('✅ Concepto actualizado:', concept.name);
		await revalidateAllPaths();
		return concept;
	} catch (error) {
		conceptLogger.error('❌ Error al actualizar concepto:', error);
		// Preservar el error si ya es un ConceptError
		if (error instanceof Error && error.name === 'ConceptError') {
			throw error;
		}
		throw createConceptError('No se pudo actualizar el concepto', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

export async function deleteConcept(id: string): Promise<void> {
	try {
		conceptLogger.info('🗑️ Eliminando concepto:', id);
		// No necesitamos almacenar el concepto eliminado
		await prisma.concept.delete({
			where: { id },
		});

		await notifyConceptChange('delete', { id });

		conceptLogger.info('✅ Concepto eliminado');
		await revalidateAllPaths();
	} catch (error) {
		conceptLogger.error('❌ Error al eliminar concepto:', error);
		// Preservar el error si ya es un ConceptError
		if (error instanceof Error && error.name === 'ConceptError') {
			throw error;
		}
		throw createConceptError('No se pudo eliminar el concepto', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

export async function getConceptImages(conceptId: string): Promise<FileItem[]> {
	try {
		conceptLogger.info('🔍 Obteniendo imágenes del concepto:', conceptId);

		// Verificar que el concepto existe
		const concept = await prisma.concept.findUnique({
			where: { id: conceptId },
		});

		if (!concept) {
			throw createConceptError('Concepto no encontrado', ConceptErrorCode.NOT_FOUND);
		}

		// Solución temporal hasta que se implementen las relaciones correctamente
		conceptLogger.info('✅ Este concepto no tiene imágenes definidas aún en el esquema');
		return [];
	} catch (error) {
		conceptLogger.error('❌ Error al obtener imágenes del concepto:', error);
		if (error instanceof Error && error.name === 'ConceptError') {
			throw error;
		}
		throw createConceptError('No se pudo obtener las imágenes del concepto', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

export async function addConceptToImage(conceptId: string, imageId: string): Promise<void> {
	try {
		conceptLogger.info('➕ Agregando concepto a imagen:', { conceptId, imageId });

		// Actualizar relaciones
		// Verificamos que el concepto existe
		const conceptExists = await prisma.concept.findUnique({
			where: { id: conceptId },
			select: { id: true },
		});

		if (!conceptExists) {
			throw createConceptError('Concepto no encontrado', ConceptErrorCode.NOT_FOUND);
		}

		// En lugar de actualizar directamente, usamos la API de Prisma para gestionar la relación
		// Actualizamos la tabla de unión entre imágenes y conceptos
		await prisma.$executeRaw`
			INSERT INTO _ConceptToImage (A, B)
			VALUES (${conceptId}, ${imageId})
			ON CONFLICT DO NOTHING
		`;

		await notifyConceptChange('update', { id: conceptId }, imageId);

		conceptLogger.info('✅ Concepto agregado a imagen');
		await revalidateAllPaths();
	} catch (error) {
		conceptLogger.error('❌ Error al agregar concepto a imagen:', error);
		// Preservar el error si ya es un ConceptError
		if (error instanceof Error && error.name === 'ConceptError') {
			throw error;
		}
		throw createConceptError('No se pudo agregar el concepto a la imagen', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

export async function removeConceptFromImage(conceptId: string, imageId: string): Promise<void> {
	try {
		conceptLogger.info('➖ Removiendo concepto de imagen:', { conceptId, imageId });

		// Verificamos que el concepto existe
		const conceptExists = await prisma.concept.findUnique({
			where: { id: conceptId },
			select: { id: true },
		});

		if (!conceptExists) {
			throw createConceptError('Concepto no encontrado', ConceptErrorCode.NOT_FOUND);
		}

		// En lugar de actualizar directamente, usamos la API de Prisma para gestionar la relación
		// Eliminamos la relación de la tabla de unión
		await prisma.$executeRaw`
			DELETE FROM _ConceptToImage
			WHERE A = ${conceptId} AND B = ${imageId}
		`;

		await notifyConceptChange('update', { id: conceptId }, imageId);

		conceptLogger.info('✅ Concepto removido de imagen');
		await revalidateAllPaths();
	} catch (error) {
		conceptLogger.error('❌ Error al remover concepto de imagen:', error);
		// Preservar el error si ya es un ConceptError
		if (error instanceof Error && error.name === 'ConceptError') {
			throw error;
		}
		throw createConceptError('No se pudo remover el concepto de la imagen', ConceptErrorCode.OPERATION_FAILED, error);
	}
}
