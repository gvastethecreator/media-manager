/**
 * @file Transformador principal para la entidad Collection
 * @module transformers/collection/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
	Collection,
	CollectionComplete,
	CollectionExtended,
	CollectionWithStats,
} from '@/types/entities/collection/types';
import { TransformerError } from '@/utils/transformers/errors';
import { fromPrismaCollection, validateCollection } from './serializers';

const logger = serverLogger.withContext('CollectionTransformer');

/**
 * 🌟 Transformador principal para la entidad Collection
 * Punto de entrada unificado para transformar objetos Collection a diferentes formatos
 *
 * @param collection Objeto Collection a transformar (puede ser de Prisma, parcial, etc)
 * @returns Objeto CollectionComplete con todas las propiedades
 * @throws Error si la colección es inválida o no se puede transformar
 */
export function transformCollection(collection: any): CollectionComplete {
	if (!collection || typeof collection !== 'object') {
		logger.error('⚠️ Intentando transformar un objeto Collection inválido:', collection);
		throw new TransformerError('Error transformando colección: objeto inválido');
	}

	try {
		// Validar datos
		validateCollection(collection);

		// Si ya es un objeto CompleteCollection o tiene la estructura correcta, devolverlo
		if ('_count' in collection) {
			return collection as CollectionComplete;
		}

		// Si proviene de Prisma, usar el deserializador
		if ('metadata' in collection && typeof collection.metadata === 'string') {
			return fromPrismaCollection(collection);
		}

		// En otros casos, extender con defaults y validar
		throw new TransformerError('Formato de colección no soportado para transformación automática');
	} catch (error) {
		logger.error('❌ Error transformando Collection:', error);
		throw new TransformerError('Error transformando colección');
	}
}

/**
 * 🌟 Transforma múltiples colecciones
 *
 * @param collections Array de colecciones a transformar
 * @returns Array de colecciones transformadas
 * @throws Error si hay un problema en la transformación
 */
export function transformCollections(collections: any[]): CollectionComplete[] {
	if (!Array.isArray(collections)) {
		logger.error('⚠️ Intentando transformar un array de colecciones inválido:', collections);
		throw new TransformerError('Error transformando colecciones: no es un array');
	}

	try {
		return collections.map((collection) => transformCollection(collection));
	} catch (error) {
		logger.error('❌ Error transformando lista de colecciones:', error);
		throw new TransformerError('Error transformando lista de colecciones');
	}
}

/**
 * 🔄 Transforma una Collection a la versión extendida para UI
 *
 * @param collection Objeto Collection a transformar
 * @param options Opciones adicionales de transformación
 * @returns Objeto CollectionExtended con propiedades de UI
 * @throws Error si hay un problema en la transformación
 */
export function transformCollectionToExtended(
	collection: Collection | CollectionComplete,
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
): CollectionExtended {
	try {
		// Primero asegurar que tenemos un CollectionComplete
		const collectionComplete = '_count' in collection ? collection : transformCollection(collection);

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
			...collectionComplete,
			isSelected,
			isHighlighted,
			isEditing,
			isExpanded,
			isLoading,
			hasError,
			isDragging,
			isDropTarget,
			// Propiedades calculadas
			parsedFilters:
				typeof collectionComplete.filters === 'string'
					? JSON.parse(collectionComplete.filters || '[]')
					: collectionComplete.filters || [],
			imageCount: collectionComplete._count?.images || 0,
			totalValue: collectionComplete.price || 0,
		};
	} catch (error) {
		logger.error('❌ Error transformando Collection a Extended:', error);
		throw new TransformerError('Error transformando colección a versión extendida');
	}
}

/**
 * 📊 Transforma una Collection a la versión con estadísticas
 *
 * @param collection Objeto Collection a transformar
 * @returns Objeto CollectionWithStats con estadísticas adicionales
 * @throws Error si hay un problema en la transformación
 */
export function transformCollectionToWithStats(collection: Collection | CollectionComplete): CollectionWithStats {
	try {
		// Primero asegurar que tenemos un CollectionComplete
		const collectionComplete = '_count' in collection ? collection : transformCollection(collection);

		// Calcular estadísticas
		const totalImages = collectionComplete._count?.images || 0;
		const totalVideos = collectionComplete._count?.videos || 0;
		const totalAlbums = collectionComplete._count?.albums || 0;
		const totalTags = collectionComplete._count?.tags || 0;
		const totalCharacters = collectionComplete._count?.characters || 0;
		const totalPlaces = collectionComplete._count?.places || 0;
		const totalWorldItems = collectionComplete._count?.worldItems || 0;
		const totalConcepts = collectionComplete._count?.concepts || 0;
		const totalPrompts = collectionComplete._count?.prompts || 0;
		const totalNotes = collectionComplete._count?.notes || 0;
		const totalGroups = collectionComplete._count?.groups || 0;

		const totalItems =
			totalImages +
			totalVideos +
			totalAlbums +
			totalTags +
			totalCharacters +
			totalPlaces +
			totalWorldItems +
			totalConcepts +
			totalPrompts +
			totalNotes +
			totalGroups;

		const totalSize = 0; // Este valor deberá calcularse desde imágenes si es necesario

		// Devolver con estadísticas
		return {
			...collectionComplete,
			totalItems,
			totalImages,
			totalVideos,
			totalAlbums,
			totalTags,
			totalSize,
			lastUpdated: collectionComplete.updatedAt,
			// Para compatibilidad con tipos existentes
			_count: collectionComplete._count || {
				images: totalImages,
				videos: totalVideos,
				albums: totalAlbums,
				tags: totalTags,
			},
		};
	} catch (error) {
		logger.error('❌ Error transformando Collection a WithStats:', error);
		throw new TransformerError('Error transformando colección a versión con estadísticas');
	}
}
