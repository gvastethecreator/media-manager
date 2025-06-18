'use client';

/**
 * @file Exportaciones para el cliente de transformadores de tags
 * @module app/actions/tags/client-tag-exports
 * @description Este archivo exporta los transformadores desde el cliente para evitar problemas con 'use server'
 */

export {
    DEFAULT_TAG_COLOR,
    // from serializers.ts
    DEFAULT_TAG_EMOJI, extendTag,
    extendTags,
    // from transformer.ts
    fromPrismaTag,
    fromPrismaTags, mapCompleteToTag,
    // from converters.ts
    mapTagToComplete, tagToDisplayObject,
    // from mappers.ts
    toCreateTagData, toPrismaTag, toRelatedTag, toSearchFilters, toSearchOptions, toSearchResult, toUpdateTagData, validateTag
} from '@/transformers/tag';
