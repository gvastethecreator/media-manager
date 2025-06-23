/**
 * @file Exportaciones para el transformer de Prompt
 * @module transformers/prompt
 */

// Importar funciones de mapeo
import {
    filterPrompts,
    mapCreatePromptDataToPrisma,
    mapPromptsToRelated,
    mapPromptToRelated,
    mapUpdatePromptDataToPrisma,
    paginatePrompts,
    processPrompts,
    sortPrompts,
    toPromptWithStats,
} from './mappers';

// Importar funciones de serialización
import {
    deserializeParameters,
    deserializeTags,
    serializeParameters,
    serializeTags,
} from './serializers';

// Importar funciones del transformer
export { PromptTransformer } from './transformer';

import { PromptTransformer } from './transformer';

// Exportar funciones individuales
export {
    // Serializers
    deserializeParameters,
    deserializeTags,
    serializeParameters,
    serializeTags,
    // Mappers
    filterPrompts,
    mapCreatePromptDataToPrisma,
    mapPromptsToRelated,
    mapPromptToRelated,
    mapUpdatePromptDataToPrisma,
    paginatePrompts,
    processPrompts,
    sortPrompts,
    toPromptWithStats
};

// Re-exportar funciones del transformer para compatibilidad
export const {
    fromPrismaPrompt,
    fromPrismaPrompts
} = PromptTransformer;

// Aliases para compatibilidad con código existente
export const transformPrompt = fromPrismaPrompt;
export const transformPrompts = fromPrismaPrompts;

