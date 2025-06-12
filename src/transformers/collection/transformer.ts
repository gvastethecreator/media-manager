/**
 * @file Transformador principal para la entidad Collection
 * @module transformers/collection/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { CollectionComplete } from '@/types/entities/collection/types';
import { TransformerError } from '@/utils/transformers/errors';
import { fromPrismaCollection } from './serializers';

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
		// validateCollection(collection); // Opcional: descomentar si se requiere validación estricta

		// Si ya es un objeto CollectionComplete o tiene la estructura correcta, devolverlo
		if ('_count' in collection && 'type' in collection && 'isPublic' in collection) {
			return collection as CollectionComplete;
		}

		// Si proviene de Prisma, usar el deserializador
		if ('metadata' in collection && typeof collection.metadata === 'string') {
			return fromPrismaCollection(collection);
		}

		// En otros casos, lanzar error
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

// Definición de tipo extendido para UI y estadísticas
export interface CollectionUIExtended extends CollectionComplete {
	// Propiedades de UI
	isSelected?: boolean;
	isHighlighted?: boolean;
	isEditing?: boolean;
	isExpanded?: boolean;
	isLoading?: boolean;
	hasError?: boolean;
	isDragging?: boolean;
	isDropTarget?: boolean;
	parsedFilters?: any[];
	imageCount?: number;
	totalValue?: number;
	// Estadísticas
	totalItems?: number;
	totalImages?: number;
	totalVideos?: number;
	totalAlbums?: number;
	totalTags?: number;
	lastUpdated?: Date;
}

/**
 * 🔄 Transforma una Collection a la versión extendida para UI
 * Devuelve un objeto CollectionUIExtended (NO modificar CollectionComplete canónico)
 */
export function transformCollectionToExtended(
	collection: CollectionComplete,
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
): CollectionUIExtended {
	try {
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

		return {
			...collection,
			isSelected,
			isHighlighted,
			isEditing,
			isExpanded,
			isLoading,
			hasError,
			isDragging,
			isDropTarget,
			parsedFilters: [], // Si necesitas parsear filtros, agrégalo aquí
			imageCount: collection._count?.images || 0,
			totalValue: (collection as any).price || 0,
		};
	} catch (error) {
		logger.error('❌ Error transformando Collection a Extended:', error);
		throw new TransformerError('Error transformando colección a versión extendida');
	}
}

/**
 * 📊 Transforma una Collection a la versión con estadísticas
 * Devuelve un objeto CollectionUIExtended (NO modificar CollectionComplete canónico)
 */
export function transformCollectionToWithStats(collection: CollectionComplete): CollectionUIExtended {
	try {
		const totalImages = collection._count?.images || 0;
		const totalVideos = collection._count?.videos || 0;
		const totalAlbums = collection._count?.albums || 0;
		const totalTags = collection._count?.tags || 0;
		const totalGroups = collection._count?.groups || 0;
		const totalCharacters = collection._count?.characters || 0;
		const totalPlaces = collection._count?.places || 0;
		const totalNotes = collection._count?.notes || 0;

		const totalItems =
			totalImages + totalVideos + totalAlbums + totalTags + totalGroups + totalCharacters + totalPlaces + totalNotes;

		return {
			...collection,
			totalItems,
			totalImages,
			totalVideos,
			totalAlbums,
			totalTags,
			lastUpdated: collection.updatedAt,
		};
	} catch (error) {
		logger.error('❌ Error transformando Collection a WithStats:', error);
		throw new TransformerError('Error transformando colección a versión con estadísticas');
	}
}
