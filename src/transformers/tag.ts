/**
 * @file Archivo principal para transformadores de Tag
 * @module transformers/tag
 * @deprecated Importar directamente desde 'src/transformers/tag/v2'
 */

import TagTransformer, {
    DEFAULT_TAG_COLOR,
    DEFAULT_TAG_EMOJI,
    TagTransformOptions,
    extendTag,
    extendTags,
    fromPrismaTag,
    toCreateTagData,
    toPrismaTag,
    toRelatedTag,
    toSearchFilters,
    toSearchOptions,
    toSearchResult,
    toUpdateTagData,
    validateTag
} from './tag/v2';

// Re-exportar funciones individualmente
export {
    DEFAULT_TAG_COLOR,
    DEFAULT_TAG_EMOJI,
    TagTransformOptions,
    extendTag,
    extendTags,
    fromPrismaTag,
    toCreateTagData, toPrismaTag, // Mantener compatibilidad con nombre antiguo
    toSearchFilters,
    toSearchOptions,
    toSearchResult, toRelatedTag as toTagRelated, toUpdateTagData,
    validateTag
};

// Exportar objeto de compatibilidad como predeterminado
export default TagTransformer;