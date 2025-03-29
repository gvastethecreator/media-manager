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
  mapCreateTagDataToPrisma, mapTagFiltersToPrisma,
  mapTagToRelatedTag, mapUpdateTagDataToPrisma, transformCompleteTagToPrisma, transformTagToPrisma
} from './mappers';

