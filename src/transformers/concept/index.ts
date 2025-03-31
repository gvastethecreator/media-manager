/**
 * @file Exportaciones para el transformer de Concept
 * @module transformers/concept
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type {
    ConceptComplete,
    ConceptCreateInput,
    ConceptFilters,
    ConceptSearchOptions,
    ConceptSearchResult,
    ConceptUpdateInput
} from '@/types/entities/concept/types';
import { handleTransformerError } from '@/utils/transformers/errors';

// Importar directamente las funciones necesarias
import {
    ConceptTransformOptions,
    deserializeTags,
    extendConcept,
    extendConcepts,
    fromConceptComplete,
    fromPrismaConcept,
    serializeTags,
    toConceptComplete,
    toConceptExtendedComplete,
    toConceptWithRelationsComplete,
    toConceptWithRelationsExtendedComplete,
    toConceptWithStatsComplete,
    toExtendedConcept,
    toPrismaConcept,
    validateConcept
} from './serializers';

// Exportar serializadores
export {
    // Tipos
    ConceptTransformOptions,
    deserializeTags,
    extendConcept,
    extendConcepts,
    fromConceptComplete,
    // Funciones principales
    fromPrismaConcept,
    // Funciones de deserialización/serialización
    serializeTags,
    // Funciones obsoletas
    toConceptComplete,
    toConceptExtendedComplete,
    toConceptWithRelationsComplete,
    toConceptWithRelationsExtendedComplete,
    toConceptWithStatsComplete,
    toExtendedConcept,
    toPrismaConcept,
    // Funciones de validación y extensión
    validateConcept
};

// Importar mappers
    import {
        filterConcepts,
        mapCreateConceptDataToPrisma,
        mapUpdateConceptDataToPrisma,
        paginateConcepts,
        processConcepts,
        sortConcepts,
        toCreateConceptData,
        toRelatedConcept,
        toSearchFilters,
        toSearchOptions,
        toSearchResult,
        toUpdateConceptData
    } from './mappers';

// Exportar mappers
export {
    filterConcepts,
    // Funciones obsoletas
    mapCreateConceptDataToPrisma,
    mapUpdateConceptDataToPrisma,
    paginateConcepts,
    processConcepts,
    sortConcepts,
    // Funciones principales
    toCreateConceptData,
    toRelatedConcept,
    toSearchFilters,
    toSearchOptions,
    toSearchResult,
    toUpdateConceptData
};

const logger = serverLogger.withContext('ConceptTransformer');

/**
 * 🔍 Busca conceptos según los criterios especificados
 */
export async function searchConcepts(options: ConceptSearchOptions = {}): Promise<ConceptSearchResult> {
    try {
        // Mapear opciones de búsqueda a formato Prisma
        const prismaOptions = toSearchOptions(options);

        // Realizar búsqueda
        const [items, total] = await Promise.all([
            prisma.concept.findMany(prismaOptions),
            prisma.concept.count({ where: prismaOptions.where }),
        ]);

        // Deserializar resultados
        const concepts = items.map(item => fromPrismaConcept(item, {
            includeStats: options.includeCount,
            includeRelations: options.includeRelations,
            includeUI: true
        }));

        return toSearchResult(concepts, options, total);
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔍 Obtiene un concepto por su ID
 */
export async function getConceptById(id: string): Promise<ConceptComplete | null> {
    try {
        const concept = await prisma.concept.findUnique({
            where: { id },
            include: {
                images: true,
                videos: true,
                albums: true,
                collections: true,
                tagEntities: true,
                characters: true,
                places: true,
                worldItems: true,
                prompts: true,
                notes: true,
                wildcards: true,
                properties: true,
                groups: true,
                _count: true,
            },
        });

        if (!concept) {
            return null;
        }

        return fromPrismaConcept(concept, {
            includeRelations: true,
            includeStats: true,
            includeUI: true
        });
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * ✨ Crea un nuevo concepto
 */
export async function createConcept(data: ConceptCreateInput): Promise<ConceptComplete> {
    try {
        // Validar datos de entrada
        validateConcept(data);

        // Mapear datos a formato Prisma
        const createData = toCreateConceptData(data);

        // Crear concepto
        const concept = await prisma.concept.create({
            data: createData,
            include: {
                images: true,
                videos: true,
                albums: true,
                collections: true,
                tagEntities: true,
                characters: true,
                places: true,
                worldItems: true,
                prompts: true,
                notes: true,
                wildcards: true,
                properties: true,
                groups: true,
                _count: true,
            },
        });

        return fromPrismaConcept(concept, {
            includeRelations: true,
            includeStats: true,
            includeUI: true
        });
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 📝 Actualiza un concepto existente
 */
export async function updateConcept(id: string, data: ConceptUpdateInput): Promise<ConceptComplete> {
    try {
        // Validar datos de entrada
        validateConcept(data);

        // Mapear datos a formato Prisma
        const updateData = toUpdateConceptData(data);

        // Actualizar concepto
        const concept = await prisma.concept.update({
            where: { id },
            data: updateData,
            include: {
                images: true,
                videos: true,
                albums: true,
                collections: true,
                tagEntities: true,
                characters: true,
                places: true,
                worldItems: true,
                prompts: true,
                notes: true,
                wildcards: true,
                properties: true,
                groups: true,
                _count: true,
            },
        });

        return fromPrismaConcept(concept, {
            includeRelations: true,
            includeStats: true,
            includeUI: true
        });
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🗑️ Elimina un concepto por su ID
 */
export async function deleteConcept(id: string): Promise<void> {
    try {
        await prisma.concept.delete({
            where: { id },
        });
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔍 Obtiene conceptos por sus IDs
 */
export async function getConceptsByIds(ids: string[]): Promise<ConceptComplete[]> {
    try {
        if (!ids.length) return [];

        const concepts = await prisma.concept.findMany({
            where: { id: { in: ids } },
            include: {
                images: true,
                videos: true,
                albums: true,
                collections: true,
                tagEntities: true,
                characters: true,
                places: true,
                worldItems: true,
                prompts: true,
                notes: true,
                wildcards: true,
                properties: true,
                groups: true,
                _count: true,
            },
        });

        return concepts.map(concept => fromPrismaConcept(concept, {
            includeRelations: true,
            includeStats: true,
            includeUI: true
        }));
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🏷️ Parsea filtros de búsqueda desde un string
 */
export function parseConceptFilters(filtersStr: string): ConceptFilters {
    try {
        return JSON.parse(filtersStr) as ConceptFilters;
    } catch (error) {
        logger.error('Error parseando filtros de conceptos:', error);
        return {};
    }
}

// Objeto de compatibilidad para mantener la API pública actual
// Este objeto se mantendrá para compatibilidad con código existente
// pero se recomienda usar las funciones exportadas directamente
export default {
    // Funciones principales
    searchConcepts,
    getConceptById,
    createConcept,
    updateConcept,
    deleteConcept,
    getConceptsByIds,
    parseConceptFilters,

    // Serializers
    fromPrismaConcept,
    toPrismaConcept,
    serializeTags,
    deserializeTags,
    validateConcept,
    extendConcept,

    // Mappers
    toCreateConceptData,
    toUpdateConceptData,
    toSearchOptions,
    toSearchFilters,
    toSearchResult,
    toRelatedConcept
};

