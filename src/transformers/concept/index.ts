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

import {
    toCreateConceptData,
    toSearchOptions,
    toSearchResult,
    toUpdateConceptData
} from './mappers';

// Importar funciones de serialización
import * as serializers from './serializers';

// Re-exportar todo desde los módulos principales
export * from './mappers';
export * from './serializers';
export * from './transformer';

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
        const concepts = items.map(item => serializers.fromPrismaConcept(item, {
            includeStats: options.includeCount,
            includeRelations: options.includeRelations,
            includeUI: true
        }));

        // Usar toSearchResult con los parámetros correctos
        return toSearchResult(concepts, total, options);
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
                _count: true,
            },
        });

        if (!concept) {
            return null;
        }

        return serializers.fromPrismaConcept(concept, {
            includeRelations: false,
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
        serializers.validateConcept(data);

        // Mapear datos a formato Prisma
        const createData = toCreateConceptData(data);

        // Crear concepto
        const concept = await prisma.concept.create({
            data: createData,
            include: {
                _count: true,
            },
        });

        return serializers.fromPrismaConcept(concept, {
            includeRelations: false,
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
        serializers.validateConcept(data);

        // Mapear datos a formato Prisma
        const updateData = toUpdateConceptData(data);

        // Actualizar concepto
        const concept = await prisma.concept.update({
            where: { id },
            data: updateData,
            include: {
                _count: true,
            },
        });

        return serializers.fromPrismaConcept(concept, {
            includeRelations: false,
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
                _count: true,
            },
        });

        return concepts.map(concept => serializers.fromPrismaConcept(concept, {
            includeRelations: false,
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
    fromPrismaConcept: serializers.fromPrismaConcept,
    toPrismaConcept: serializers.toPrismaConcept,
    serializeTags: serializers.serializeTags,
    deserializeTags: serializers.deserializeTags,
    validateConcept: serializers.validateConcept,
    extendConcept: serializers.extendConcept,

    // Mappers
    toCreateConceptData,
    toUpdateConceptData,
    toSearchOptions,
    toSearchResult
};

