/**
 * @file Transformador principal para la entidad Tag
 * @module transformers/tag/transformer
 */

import { Logger } from '@/lib/logger';
import type { Tag, TagComplete, TagExtended, TagWithStats } from '@/types/entities/tag/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import { extendTag } from './serializers';
import { mapTagToComplete } from './v2/converters';

const logger = new Logger('TagTransformer');

/**
 * Opciones para la transformación de tags
 */
export interface TransformTagOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	customFields?: string[];
}

/**
 * 🏷️ Transformador principal para la entidad Tag
 * Punto de entrada unificado para transformar objetos Tag a diferentes formatos
 *
 * @param tag Objeto Tag a transformar (puede ser de Prisma, parcial, etc)
 * @returns Objeto TagComplete con todas las propiedades
 * @throws Error si el tag es inválido o no se puede transformar
 */
export function transformTag(tag: any): TagComplete {
	if (!tag || typeof tag !== 'object') {
		logger.warn('⚠️ Intentando transformar un objeto Tag inválido:', tag);
		throw new Error('Invalid tag object');
	}

	try {
		// Convertir a formato completo
		const tagComplete = mapTagToComplete(tag);

		// Extender con propiedades adicionales
		return extendTag(tagComplete);
	} catch (error) {
		logger.error('❌ Error transformando Tag:', error);
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Transforma un Tag a la versión extendida para UI
 *
 * @param tag Objeto Tag a transformar
 * @param options Opciones adicionales de transformación
 * @returns Objeto TagExtended con propiedades de UI
 * @throws Error si hay un problema en la transformación
 */
export function transformTagToExtended(
	tag: Tag | TagComplete,
	options: {
		isSelected?: boolean;
		isHighlighted?: boolean;
		isEditing?: boolean;
		isExpanded?: boolean;
		isLoading?: boolean;
		hasError?: boolean;
		isDragging?: boolean;
		isDropTarget?: boolean;
	} = {}
): TagExtended {
	try {
		// Primero asegurar que tenemos un TagComplete
		const tagComplete = '_count' in tag ? tag : transformTag(tag);

		// Opciones con valores por defecto
		const {
			isSelected = false,
			isHighlighted = false,
			isEditing = false,
			isExpanded = false,
			isLoading = false,
			hasError = false,
			isDragging = false,
			isDropTarget = false,
		} = options;

		// Extender con propiedades de UI
		return {
			...tagComplete,
			isSelected,
			isHighlighted,
			isEditing,
			isExpanded,
			isLoading,
			hasError,
			isDragging,
			isDropTarget,
		};
	} catch (error) {
		logger.error('❌ Error transformando Tag a Extended:', error);
		throw handleTransformerError(error);
	}
}

/**
 * 📊 Transforma un Tag a la versión con estadísticas
 *
 * @param tag Objeto Tag a transformar
 * @returns Objeto TagWithStats con estadísticas adicionales
 * @throws Error si hay un problema en la transformación
 */
export function transformTagToWithStats(tag: Tag | TagComplete): TagWithStats {
	try {
		// Primero asegurar que tenemos un TagComplete
		const tagComplete = '_count' in tag ? tag : transformTag(tag);

		// Calcular estadísticas
		const totalImages = tagComplete._count?.images || 0;
		const totalVideos = tagComplete._count?.videos || 0;
		const totalAlbums = tagComplete._count?.albums || 0;
		const totalCollections = tagComplete._count?.collections || 0;
		const totalCharacters = tagComplete._count?.characters || 0;
		const totalPlaces = tagComplete._count?.places || 0;
		const totalWorldItems = tagComplete._count?.worldItems || 0;
		const totalConcepts = tagComplete._count?.concepts || 0;
		const totalPrompts = tagComplete._count?.prompts || 0;
		const totalNotes = tagComplete._count?.notes || 0;
		const totalWildcards = tagComplete._count?.wildcards || 0;
		const totalProperties = tagComplete._count?.properties || 0;
		const totalGroups = tagComplete._count?.groups || 0;

		const totalItems =
			totalImages +
			totalVideos +
			totalAlbums +
			totalCollections +
			totalCharacters +
			totalPlaces +
			totalWorldItems +
			totalConcepts +
			totalPrompts +
			totalNotes +
			totalWildcards +
			totalProperties +
			totalGroups;

		// Devolver con estadísticas
		return {
			...tagComplete,
			stats: {
				totalItems,
				totalImages,
				totalVideos,
				totalAlbums,
				totalCollections,
				totalCharacters,
				totalPlaces,
				totalWorldItems,
				totalConcepts,
				totalPrompts,
				totalNotes,
				totalWildcards,
				totalProperties,
				totalGroups,
				lastUsed: null, // Esto podría calcularse con lógica adicional
			},
		};
	} catch (error) {
		logger.error('❌ Error transformando Tag a WithStats:', error);
		throw handleTransformerError(error);
	}
}

/**
 * 🔖 Transforma múltiples tags
 * Función de utilidad para transformar arrays de tags
 *
 * @param tags Array de tags a transformar
 * @returns Array de tags transformados
 */
export function transformTags(tags: any[]): TagComplete[] {
	if (!Array.isArray(tags)) {
		logger.warn('⚠️ Intentando transformar un array no válido:', tags);
		return [];
	}

	return tags
		.map((tag) => {
			try {
				return transformTag(tag);
			} catch (error) {
				logger.error(`❌ Error transformando tag ${tag?.id || 'desconocido'}:`, error);
				return null;
			}
		})
		.filter((tag): tag is TagComplete => tag !== null);
}
