/**
 * @file Serializadores para la entidad Property
 * @module entities/property/serializers
 */

import { logger } from '@/lib/logger';
import { PropertySchema } from '@/types/entities/property/schema';
import type { PropertyBase, PropertyWithRelations } from '@/types/entities/property/types';

/**
 * Extiende una propiedad con campos deserializados
 */
export function extendProperty(property: PropertyBase): PropertyWithRelations {
	try {
		return {
			...property,
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				groups: 0,
			},
		};
	} catch (error) {
		logger.error('Error extendiendo propiedad:', error);
		throw error;
	}
}

/**
 * Valida una propiedad usando el esquema definido
 */
export function validateProperty(property: PropertyBase): boolean {
	try {
		PropertySchema.parse(property);
		return true;
	} catch (error) {
		logger.error('Error validando propiedad:', error);
		return false;
	}
}

/**
 * Calcula estadísticas para una propiedad
 */
export function calculatePropertyStats(property: PropertyWithRelations): {
	usageCount: number;
	relatedEntitiesCount: number;
} {
	try {
		const _count = property._count || {};

		// Calcular el número total de entidades relacionadas
		const relatedEntitiesCount =
			(_count.images || 0) +
			(_count.videos || 0) +
			(_count.albums || 0) +
			(_count.collections || 0) +
			(_count.tags || 0) +
			(_count.characters || 0) +
			(_count.places || 0) +
			(_count.worldItems || 0) +
			(_count.concepts || 0) +
			(_count.prompts || 0) +
			(_count.notes || 0) +
			(_count.wildcards || 0) +
			(_count.groups || 0);

		return {
			usageCount: relatedEntitiesCount,
			relatedEntitiesCount,
		};
	} catch (error) {
		logger.error('Error calculando estadísticas de propiedad:', error);
		return {
			usageCount: 0,
			relatedEntitiesCount: 0,
		};
	}
}
