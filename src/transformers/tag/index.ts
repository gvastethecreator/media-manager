/**
 * @file Exportaciones de transformadores para la entidad Tag
 * @module transformers/tag
 */

// Exportar serializadores
export {
    extendTag,
    extendTags, formatSize, fromTagComplete, generateTagColor,
    generateTagEmoji, normalizeTagCategory,
    normalizeTagRarity, tagToTagWithStats, toTagComplete
} from './serializers';

// Exportar mappers
export {
    createTagFilter,
    createTagOrderBy,
    mapCreateTagDataToPrisma,
    mapTagFiltersToPrisma,
    mapTagToRelatedTag,
    mapUpdateTagDataToPrisma,
    transformCompleteTagToPrisma,
    transformTagToPrisma
} from './mappers';

