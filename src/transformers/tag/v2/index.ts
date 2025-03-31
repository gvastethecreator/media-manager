/**
 * @file Exportaciones principales de transformers v2 para la entidad Tag
 * @module transformers/tag/v2
 */

// Exportar serializadores
export {
    DEFAULT_TAG_COLOR,
    DEFAULT_TAG_EMOJI,
    TagTransformOptions,
    extendTag,
    extendTags,
    fromPrismaTag,
    toPrismaTag,
    validateTag
} from './serializers';

// Exportar mappers
export {
    toCreateTagData,
    toRelatedTag,
    toSearchFilters,
    toSearchOptions,
    toSearchResult,
    toUpdateTagData
} from './mappers';

// Importar las funciones localmente para el objeto de exportación
import {
    DEFAULT_TAG_COLOR,
    DEFAULT_TAG_EMOJI,
    extendTag,
    extendTags,
    fromPrismaTag,
    toPrismaTag,
    validateTag
} from './serializers';

import {
    toCreateTagData,
    toRelatedTag,
    toSearchFilters,
    toSearchOptions,
    toSearchResult,
    toUpdateTagData
} from './mappers';

// Objeto para mantener compatibilidad con código existente
const TagTransformer = {
  // Serializadores
  fromPrismaTag,
  toPrismaTag,
  validateTag,
  extendTag,
  extendTags,
  DEFAULT_TAG_COLOR,
  DEFAULT_TAG_EMOJI,

  // Mappers
  toCreateTagData,
  toUpdateTagData,
  toSearchOptions,
  toSearchFilters,
  toSearchResult,
  toRelatedTag
};

export default TagTransformer;