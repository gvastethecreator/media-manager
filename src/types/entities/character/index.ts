/**
 * @file Exportaciones principales de tipos para la entidad Character
 * @module types/entities/character
 */

export type {
       CharacterBase,
       CharacterRelations,
       CharacterCounts,
       CharacterComplete,
       CharacterCreateInput,
       CharacterUpdateInput,
       CharacterFilters,
       CharacterIncludes,
       CharacterSearchOptions,
       CharacterSearchResult,
       CharacterTransformerOptions,
       CharacterCount,
       CharacterWithRelations,
       CreateCharacterData,
       UpdateCharacterData,
} from './types';

export {
       CharacterSortCriteria,
       CHARACTER_SORT_PROPERTY_MAP,
} from './types';

export type { CharacterExtended, CharacterAttributes, CharacterInventoryItem, CharacterListItem, CharacterViewConfig, CharacterCard, CharacterSummary } from './extended';

export {
       CharacterSchema,
       CharacterRelationsSchema,
       CreateCharacterSchema,
       UpdateCharacterSchema,
       CharacterFiltersSchema,
} from './base';

// Alias común para el tipo principal
export type { CharacterWithRelations as Character } from './types';
