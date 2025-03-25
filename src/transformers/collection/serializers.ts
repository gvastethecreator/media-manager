/**
 * @file Funciones de serialización/deserialización para la entidad Collection
 * @module transformers/collection/serializers
 */

import type {
    CollectionExtended,
    CollectionFilter,
    CollectionSummary,
} from '@/types/entities/collection';
import type { Collection as PrismaCollection } from '@prisma/client';

/**
 * Transforma un objeto Collection de Prisma a un objeto CollectionExtended
 * @param collection Collection de Prisma
 * @returns CollectionExtended con propiedades adicionales
 */
export function toCollectionExtended(collection: PrismaCollection): CollectionExtended {
    return {
        ...collection,
        // Propiedades adicionales de UI
        isSelected: false,
        isHovered: false,
        isOpen: false,
        isLoading: false,
        hasError: false,
        // Calculados/runtime
        parsedFilters: collection.filters ? parseCollectionFilters(collection.filters) : [],
        imageCount: 0,
        totalValue: collection.price || 0,
    };
}

/**
 * Transforma un Collection en un resumen para listados
 * @param collection Collection a resumir
 * @param imageCount Cantidad de imágenes opcional
 * @returns CollectionSummary con datos básicos
 */
export function toCollectionSummary(
    collection: PrismaCollection | CollectionExtended,
    imageCount?: number
): CollectionSummary {
    return {
        id: collection.id,
        name: collection.name,
        emoji: collection.emoji || '🌟',
        color: collection.color || '#3b82f6',
        imageCount: imageCount || 0,
        category: collection.category,
        rarity: collection.rarity,
    };
}

/**
 * Prepara los datos de una colección para guardar en la base de datos
 * Elimina propiedades que no son parte del modelo Prisma
 * @param collection Collection con datos extendidos
 * @returns Datos limpios para guardar en BD
 */
export function toPrismaCollection(collection: Partial<CollectionExtended>): Partial<PrismaCollection> {
    // Extraer solo las propiedades que existen en PrismaCollection
    const {
        id,
        name,
        emoji,
        description,
        color,
        shortcut,
        sortBy,
        filters,
        url,
        alternativeUrl,
        sourceImage,
        platform,
        price,
        editions,
        featuredImage,
        isFavorite,
        createdAt,
        updatedAt,
        category,
        rarity,
        texture,
        presetId,
    } = collection;

    // Serializar filtros si es necesario
    const serializedFilters = collection.parsedFilters
        ? JSON.stringify(collection.parsedFilters)
        : filters;

    return {
        id,
        name,
        emoji,
        description,
        color,
        shortcut,
        sortBy,
        filters: serializedFilters,
        url,
        alternativeUrl,
        sourceImage,
        platform,
        price,
        editions,
        featuredImage,
        isFavorite,
        createdAt,
        updatedAt,
        category,
        rarity,
        texture,
        presetId,
    };
}

/**
 * Parsea una cadena de filtros a un array de objetos CollectionFilter
 * @param filtersStr Cadena serializada de filtros
 * @returns Array de objetos CollectionFilter
 */
export function parseCollectionFilters(filtersStr: string): CollectionFilter[] {
    try {
        // Si es "empty_array", retornar un array vacío
        if (filtersStr === 'empty_array') {
            return [];
        }

        // Intentar parsear el JSON
        const parsedFilters = JSON.parse(filtersStr);

        // Validar que sea un array
        if (!Array.isArray(parsedFilters)) {
            return [];
        }

        return parsedFilters;
    } catch (error) {
        console.error('Error al parsear filtros de colección:', error);
        return [];
    }
}

/**
 * Serializa un array de filtros a formato JSON string
 * @param filters Array de CollectionFilter
 * @returns String serializado
 */
export function serializeCollectionFilters(filters: CollectionFilter[]): string {
    try {
        if (!filters || filters.length === 0) {
            return 'empty_array';
        }

        return JSON.stringify(filters);
    } catch (error) {
        console.error('Error al serializar filtros de colección:', error);
        return 'empty_array';
    }
}