/**
 * @file Serializadores para la entidad Wildcard
 * @module entities/wildcard/serializers
 */

import { logger } from '@/lib/logger';
import { WildcardSchema } from '@/types/entities/wildcard/schema';
import type { WildcardBase, WildcardWithRelations } from '@/types/entities/wildcard/types';

/**
 * Extiende un comodín con campos deserializados y relaciones
 */
export function extendWildcard(wildcard: WildcardBase): WildcardWithRelations {
	try {
		// Inicializar objeto de conteo
		const extendedWildcard: WildcardWithRelations = {
			...wildcard,
			_count: {
				childWildcards: 0,
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
				properties: 0,
				groups: 0,
			},
		};

		return extendedWildcard;
	} catch (error) {
		logger.error('Error extendiendo el comodín:', error);
		// Devolver el comodín original si hay error
		return {
			...wildcard,
			_count: {},
		};
	}
}

/**
 * Serializa el campo de hijos de un comodín
 */
export function serializeWildcardChildren(children: any[]): string {
	try {
		return JSON.stringify(children || []);
	} catch (error) {
		logger.error('Error serializando hijos del comodín:', error);
		return '[]';
	}
}

/**
 * Deserializa el campo de hijos de un comodín
 */
export function deserializeWildcardChildren(childrenStr: string): any[] {
	try {
		if (!childrenStr) return [];
		return JSON.parse(childrenStr);
	} catch (error) {
		logger.error('Error deserializando hijos del comodín:', error);
		return [];
	}
}

/**
 * Valida un comodín
 */
export function validateWildcard(wildcard: WildcardBase): boolean {
	try {
		WildcardSchema.parse(wildcard);
		return true;
	} catch (error) {
		logger.error('Error validando comodín:', error);
		return false;
	}
}

/**
 * Construye un árbol jerárquico a partir de una lista plana de comodines
 */
export function buildWildcardTree(wildcards: WildcardWithRelations[]): WildcardWithRelations[] {
	try {
		const map = new Map<string, WildcardWithRelations>();
		const tree: WildcardWithRelations[] = [];

		// Crear un mapa para búsqueda rápida
		for (const wildcard of wildcards) {
			wildcard.childWildcards = [];
			map.set(wildcard.id, wildcard);
		}

		// Construir la jerarquía
		for (const wildcard of wildcards) {
			if (wildcard.parentId) {
				// Obtener el padre si existe
				const parent = map.get(wildcard.parentId);
				if (parent) {
					// Agregar como hijo
					parent.childWildcards.push(wildcard);

					// Si el padre tiene color o emoji y el hijo no, heredar
					if (!wildcard.color && parent.color) {
						wildcard.color = parent.color;
					}
					if (!wildcard.emoji && parent.emoji) {
						wildcard.emoji = parent.emoji;
					}
				} else {
					// Si no se encuentra el padre, agregar a la raíz
					tree.push(wildcard);
				}
			} else {
				// Si no tiene padre, es un nodo raíz
				tree.push(wildcard);
			}
		}

		return tree;
	} catch (error) {
		logger.error('Error construyendo árbol de comodines:', error);
		return [...wildcards];
	}
}

/**
 * Calcula estadísticas para un comodín
 */
export function calculateWildcardStats(wildcard: WildcardWithRelations): {
	usageCount: number;
	relatedEntitiesCount: number;
} {
	try {
		const counts = wildcard._count || {};

		// Sumar todas las entidades relacionadas
		const relatedEntitiesCount =
			(counts.images || 0) +
			(counts.videos || 0) +
			(counts.albums || 0) +
			(counts.collections || 0) +
			(counts.tags || 0) +
			(counts.characters || 0) +
			(counts.places || 0) +
			(counts.worldItems || 0) +
			(counts.concepts || 0) +
			(counts.prompts || 0) +
			(counts.notes || 0) +
			(counts.properties || 0) +
			(counts.groups || 0);

		// El conteo de uso incluye también los hijos
		const usageCount = relatedEntitiesCount + (counts.childWildcards || 0);

		return {
			usageCount,
			relatedEntitiesCount,
		};
	} catch (error) {
		logger.error('Error calculando estadísticas del comodín:', error);
		return {
			usageCount: 0,
			relatedEntitiesCount: 0,
		};
	}
}
