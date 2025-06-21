/**
 * @file Índice de transformadores para la entidad WorldItem
 * @module transformers/world-item
 */

// --- Exportaciones Controladas --- //

// De mappers.ts (Funciones actuales)
export {
    mapCreateWorldItemDataToPrisma,
    mapUpdateWorldItemDataToPrisma,
    mapWorldItemSearchOptionsToPrisma,
    toWorldItemWithStats
} from './mappers';
// De serializers.ts (Funciones actuales)
export {
    deserializeAttributes,
    deserializeEffects,
    deserializeFilters,
    deserializeProperties,
    deserializeRequirements,
    deserializeStats,
    deserializeTags,
    extendWorldItem,
    extendWorldItems,
    serializeAttributes,
    serializeEffects,
    serializeFilters,
    serializeProperties,
    serializeRequirements,
    serializeStats,
    serializeTags
} from './serializers';
// De transformer.ts (funciones principales de transformación)
export {
    fromPrismaWorldItem,
    fromPrismaWorldItems,
    worldItemPayload
} from './transformer';

// --- Fin Exportaciones Controladas --- //
