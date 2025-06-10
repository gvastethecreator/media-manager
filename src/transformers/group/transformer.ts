/**
 * @file Transformador principal para la entidad Group
 * @module transformers/group/transformer
 */

import { TransformerError } from '@/utils/transformers/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Group, GroupComplete, GroupExtended, GroupWithStats } from '@/types/entities/group/types';
import { extendGroup } from './serializers';

const logger = serverLogger.withContext('GroupTransformer');

/**
 * 👥 Transformador principal para la entidad Group
 * Punto de entrada unificado para transformar objetos Group a diferentes formatos
 *
 * @param group Objeto Group a transformar (puede ser de Prisma, parcial, etc)
 * @returns Objeto GroupComplete con todas las propiedades
 * @throws Error si el grupo es inválido o no se puede transformar
 */
export function transformGroup(group: any): GroupComplete {
	if (!group || typeof group !== 'object') {
		logger.error('⚠️ Intentando transformar un objeto Group inválido:', group);
		throw new TransformerError('Error transformando grupo: objeto inválido');
	}

	try {
		// Extender con propiedades adicionales
		return extendGroup(group);
	} catch (error) {
		logger.error('❌ Error transformando Group:', error);
		throw new TransformerError('Error transformando grupo');
	}
}

/**
 * 👥 Transforma múltiples grupos
 *
 * @param groups Array de grupos a transformar
 * @returns Array de grupos transformados
 * @throws Error si hay un problema en la transformación
 */
export function transformGroups(groups: any[]): GroupComplete[] {
	if (!Array.isArray(groups)) {
		logger.error('⚠️ Intentando transformar un array de grupos inválido:', groups);
		throw new TransformerError('Error transformando grupos: no es un array');
	}

	try {
		return groups.map((group) => transformGroup(group));
	} catch (error) {
		logger.error('❌ Error transformando lista de grupos:', error);
		throw new TransformerError('Error transformando lista de grupos');
	}
}

/**
 * 🔄 Transforma un Group a la versión extendida para UI
 *
 * @param group Objeto Group a transformar
 * @param options Opciones adicionales de transformación
 * @returns Objeto GroupExtended con propiedades de UI
 * @throws Error si hay un problema en la transformación
 */
export function transformGroupToExtended(
	group: Group | GroupComplete,
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
): GroupExtended {
	try {
		// Primero asegurar que tenemos un GroupComplete
		const groupComplete = '_count' in group ? group : transformGroup(group);

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
			...groupComplete,
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
		logger.error('❌ Error transformando Group a Extended:', error);
		throw new TransformerError('Error transformando grupo a versión extendida');
	}
}

/**
 * 📊 Transforma un Group a la versión con estadísticas
 *
 * @param group Objeto Group a transformar
 * @returns Objeto GroupWithStats con estadísticas adicionales
 * @throws Error si hay un problema en la transformación
 */
export function transformGroupToWithStats(group: Group | GroupComplete): GroupWithStats {
	try {
		// Primero asegurar que tenemos un GroupComplete
		const groupComplete = '_count' in group ? group : transformGroup(group);

		// Calcular estadísticas
		const totalImages = groupComplete._count?.images || 0;
		const totalVideos = groupComplete._count?.videos || 0;
		const totalAlbums = groupComplete._count?.albums || 0;
		const totalCollections = groupComplete._count?.collections || 0;
		const totalTags = groupComplete._count?.tags || 0;
		const totalCharacters = groupComplete._count?.characters || 0;
		const totalPlaces = groupComplete._count?.places || 0;
		const totalWorldItems = groupComplete._count?.worldItems || 0;
		const totalConcepts = groupComplete._count?.concepts || 0;
		const totalPrompts = groupComplete._count?.prompts || 0;
		const totalNotes = groupComplete._count?.notes || 0;
		const totalWildcards = groupComplete._count?.wildcards || 0;
		const totalProperties = groupComplete._count?.properties || 0;

		const totalItems =
			totalImages +
			totalVideos +
			totalAlbums +
			totalCollections +
			totalTags +
			totalCharacters +
			totalPlaces +
			totalWorldItems +
			totalConcepts +
			totalPrompts +
			totalNotes +
			totalWildcards +
			totalProperties;

		// Devolver con estadísticas
		return {
			...groupComplete,
			stats: {
				totalItems,
				totalImages,
				totalVideos,
				totalAlbums,
				totalCollections,
				totalTags,
				totalCharacters,
				totalPlaces,
				totalWorldItems,
				totalConcepts,
				totalPrompts,
				totalNotes,
				totalWildcards,
				totalProperties,
				lastUpdated: groupComplete.updatedAt,
			},
		};
	} catch (error) {
		logger.error('❌ Error transformando Group a WithStats:', error);
		throw new TransformerError('Error transformando grupo a versión con estadísticas');
	}
}
