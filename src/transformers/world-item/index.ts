/**
 * @file Exportaciones del transformador WorldItem
 * @module transformers/world-item
 */

// Exportaciones principales del serializador
export {
    extendWorldItem,
    extendWorldItems, fromPrismaWorldItem,
    toPrismaWorldItem, validateWorldItem
} from './serializers';

// Exportaciones principales de mapeadores
export {
    createFilter,
    createOrderBy,
    generateColor,
    generateEmoji, toCreateData, toSearchOptions, toUpdateData
} from './mappers';

// Exportaciones principales de serialización de campos individuales
export {
    deserializeAttributes, deserializeEffects, deserializeFilters, deserializeProperties, deserializeRequirements, deserializeStats, deserializeTags, serializeAttributes, serializeEffects, serializeFilters, serializeProperties, serializeRequirements, serializeStats, serializeTags
} from './serializers';

// Exportaciones de funciones obsoletas (para retrocompatibilidad)
export {
    // Serializadores antiguos
    deserializeWorldItemAttributes,
    deserializeWorldItemEffects,
    deserializeWorldItemFilters,
    deserializeWorldItemProperties,
    deserializeWorldItemRequirements,
    deserializeWorldItemStats,
    deserializeWorldItemTags, fromExtendedWorldItem, parseJsonFields, serializeWorldItemAttributes,
    serializeWorldItemEffects,
    serializeWorldItemFilters,
    serializeWorldItemProperties,
    serializeWorldItemRequirements,
    serializeWorldItemStats,
    serializeWorldItemTags, toExtendedWorldItem,
    toWorldItemWithStats
} from './serializers';

export {
    createWorldItemFilter,
    createWorldItemOrderBy,
    // Mapeadores antiguos
    generateWorldItemColor,
    generateWorldItemEmoji, mapCreateWorldItemDataToPrisma,
    mapUpdateWorldItemDataToPrisma, toCreateWorldItemData,
    toUpdateWorldItemData
} from './mappers';

