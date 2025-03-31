/**
 * @file Exportaciones de la versión 2 de transformadores para Tag
 * @module transformers/tag/v2
 */

// Exportar todos los converters
export * from './converters';

// Exportar serializadores
export * from './serializers';

// Exportar mappers
export * from './mappers';

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