/**
 * @file Exportaciones para el transformer de Prompt
 * @module transformers/prompt
 */

// Importar el transformer v2
import PromptTransformer from './v2';

// Reexportar el transformer completo como exportación por defecto para compatibilidad
export default PromptTransformer;

// Exportar funciones individuales
export {
    createPrompt, deletePrompt,
    getPromptById, getPromptsByIds,
    searchPrompts, updatePrompt
} from './v2';

// Exportar funciones de utilidad
export {
    filterPrompts, mapCreatePromptDataToPrisma,
    mapUpdatePromptDataToPrisma, paginatePrompts,
    processPrompts, sortPrompts, toPromptWithStats
} from './v2/mappers';

// Exportar funciones de serialización
export {
    deserializeParameters, deserializeTags,
    serializeParameters, serializeTags, toExtendedPrompt, validatePrompt
} from './v2/serializers';

// Nota: Se mantiene compatibilidad con la versión anterior
// mediante la exportación por defecto del objeto PromptTransformer

