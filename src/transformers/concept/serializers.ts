/**
 * @file Serializadores para la entidad Concept
 * @module transformers/concept/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ConceptBase, ConceptComplete } from '@/types/entities/concept/types';
import { ConceptSchema } from '@/types/entities/concept/types';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('ConceptSerializers');

// Define el tipo de payload de Prisma que esperamos
export type ConceptFromPrisma = Prisma.ConceptGetPayload<{
	include: {
		_count: true;
	};
}>;

/**
 * Opciones para la función fromPrismaConcept
 */
export interface FromPrismaConceptOptions {
	includeRelations?: boolean;
	includeStats?: boolean;
	includeUI?: boolean;
}

/**
 * 🔄 Transforma un objeto Concept de Prisma a nuestro tipo canónico ConceptComplete.
 *
 * @param prismaConcept - El objeto Concept obtenido de Prisma.
 * @param options - Opciones de transformación.
 * @returns Un objeto ConceptComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaConcept<_T extends ConceptBase>(
	prismaConcept: ConceptFromPrisma | null,
	options: FromPrismaConceptOptions = {}
): ConceptComplete {
	if (!prismaConcept) {
		throw new TransformerError('El objeto de concepto de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaConcept;

		return {
			...baseData,
			_count: options.includeStats ? _count : undefined,
		};
	} catch (error) {
		logger.error('Error transformando concepto desde Prisma', {
			error,
			conceptId: prismaConcept.id,
		});
		throw new TransformerError(`Error al transformar el concepto: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de conceptos de Prisma a una lista de ConceptComplete.
 *
 * @param prismaConcepts - Un array de objetos Concept de Prisma.
 * @param options - Opciones de transformación.
 * @returns Un array de objetos ConceptComplete.
 */
export function fromPrismaConcepts(
	prismaConcepts: ConceptFromPrisma[],
	options: FromPrismaConceptOptions = {}
): ConceptComplete[] {
	return prismaConcepts.map((concept) => fromPrismaConcept(concept, options));
}

/**
 * 🔄 Valida un objeto Concept usando Zod.
 *
 * @param data - Los datos a validar.
 * @returns Los datos validados.
 * @throws {TransformerError} Si los datos son inválidos.
 */
export function validateConcept(data: Partial<ConceptBase>): Partial<ConceptBase> {
	try {
		// Para validación parcial, solo validamos los campos presentes
		const presentFields = Object.keys(data);
		const partialSchema = ConceptSchema.pick(
			presentFields.reduce((acc, field) => {
				acc[field as keyof ConceptBase] = true;
				return acc;
			}, {} as Record<keyof ConceptBase, true>)
		);

		return partialSchema.parse(data);
	} catch (error) {
		logger.error('Error validando concepto:', error);
		throw new TransformerError(`Error de validación: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Serializa tags para almacenamiento.
 */
export function serializeTags(tags: string[]): string {
	return JSON.stringify(tags);
}

/**
 * 🔄 Deserializa tags desde almacenamiento.
 */
export function deserializeTags(tagsJson: string | null): string[] {
	if (!tagsJson) return [];
	try {
		const parsed = JSON.parse(tagsJson);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando tags:', error);
		return [];
	}
}

/**
 * 🔄 Extiende un concepto con propiedades adicionales para UI.
 */
export function extendConcept<T extends ConceptBase>(
	concept: T,
	options: { includePreview?: boolean } = {}
): T & { previewContent?: string } {
	const extended = { ...concept };

	if (options.includePreview && concept.content) {
		// Generar una vista previa del contenido (primeros 150 caracteres)
		extended.previewContent = concept.content.substring(0, 150) + (concept.content.length > 150 ? '...' : '');
	}

	return extended;
}

/**
 * 🔄 Prepara un objeto Concept para envío a Prisma.
 */
export function toPrismaConcept(data: Partial<ConceptBase>): Prisma.ConceptCreateInput {
	// Validar datos
	validateConcept(data);

	// Mapear a formato Prisma
	return {
		name: data.name || '',
		emoji: data.emoji || '📝',
		color: data.color || '#4A5568',
		description: data.description || null,
		content: data.content || '',
		category: data.category || 'general',
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
	};
}
