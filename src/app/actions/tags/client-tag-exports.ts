'use client';

/**
 * @file Exportaciones para el cliente de transformadores de tags
 * @module app/actions/tags/client-tag-exports
 * @description Este archivo exporta los transformadores desde el cliente para evitar problemas con 'use server'
 */

// Exportaciones de transformadores para Tags
export {

    // Funciones CRUD
    createTag,
    // Mappers adicionales
    createTagFilter,
    createTagOrderBy, deleteTag,
    // Utilidades de transformación
    extendTag,
    // Serializadores adicionales
    extendTags,
    formatSize, fromPrismaTag, fromTagComplete,
    generateTagColor,
    generateTagEmoji, getTagById,
    // Converters V2
    mapCompleteToTag, mapCreateTagDataToPrisma, mapTagFiltersToPrisma, mapTagSearchOptionsToPrisma, mapTagToComplete, mapTagToRelatedTag,
    mapUpdateTagDataToPrisma, normalizeTagCategory,
    normalizeTagRarity, parseTagFilters, searchTags, tagToDisplayObject, tagToTagWithStats, toPrismaTag,
    toRelatedTag, toTagComplete, transformCompleteTagToPrisma,
    // Transformadores principales
    transformTag,
    transformTagToExtended, transformTagToPrisma, transformTagToWithStats, updateTag, validateTag
} from '@/transformers/tag';
