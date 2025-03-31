/**
 * @file Exporta todas las acciones relacionadas con etiquetas
 * @module app/actions/tags
 */

// Re-exportar todas las funciones por categoría
export * from './crud.actions';
export * from './query.actions';
export * from './relation.actions';

// Exportar transformadores para tags desde /transformers
export {
    createTag,
    deleteTag,
    extendTag,
    fromPrismaTag,
    getTagById,
    mapCreateTagDataToPrisma,
    mapTagSearchOptionsToPrisma,
    mapTagToRelatedTag,
    mapUpdateTagDataToPrisma,
    parseTagFilters,
    searchTags, toPrismaTag, toRelatedTag, updateTag,
    validateTag
} from '@/transformers/tag';

// Exportar transformador principal para tags
export { transformTag } from '@/transformers/tag';

