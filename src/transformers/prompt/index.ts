/**
 * @file Exportaciones para el transformer de Prompt
 * @module transformers/prompt
 */

// Importar funciones del transformer
import {
    transformPrompt,
    transformPromptToExtended,
    transformPromptToWithStats,
    transformPrompts
} from './transformer';

// Importar funciones de serialización
import {
    deserializeParameters,
    deserializeTags,
    serializeParameters,
    serializeTags,
    toExtendedPrompt
} from './serializers';

// Importar funciones de mapeo
import {
    filterPrompts,
    mapCreatePromptDataToPrisma,
    mapUpdatePromptDataToPrisma,
    paginatePrompts,
    processPrompts,
    sortPrompts,
    toPromptWithStats
} from './mappers';

// Exportar tipos explícitamente
export type { TransformPromptOptions } from './transformer';

// Exportar funciones del transformer
export {
    transformPrompt,
    transformPromptToExtended,
    transformPromptToWithStats,
    transformPrompts
};

// Exportar funciones de serialización
    export {
        deserializeParameters,
        deserializeTags,
        serializeParameters,
        serializeTags,
        toExtendedPrompt
    };

// Exportar funciones de mapeo
    export {
        filterPrompts,
        mapCreatePromptDataToPrisma,
        mapUpdatePromptDataToPrisma,
        paginatePrompts,
        processPrompts,
        sortPrompts,
        toPromptWithStats
    };

// Crear y exportar un objeto con todas las funciones para mantener compatibilidad
const PromptTransformer = {
    // Transformer
    transformPrompt,
    transformPrompts,
    transformPromptToExtended,
    transformPromptToWithStats,

    // Serialización
    deserializeParameters,
    deserializeTags,
    serializeParameters,
    serializeTags,
    toExtendedPrompt,

    // Mapeo
    filterPrompts,
    mapCreatePromptDataToPrisma,
    mapUpdatePromptDataToPrisma,
    paginatePrompts,
    processPrompts,
    sortPrompts,
    toPromptWithStats
};

// Exportar todo como un objeto por defecto para mantener compatibilidad
export default PromptTransformer;

