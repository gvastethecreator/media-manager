/**
 * @file Exportaciones principales de tipos para la entidad Character
 * @module types/entities/character
 */

export type {
	CharacterBase,
	CharacterComplete,
	CharacterCount,
	CharacterCounts,
	CharacterCreateInput,
	CharacterFilters,
	CharacterIncludes,
	CharacterRelations,
	CharacterSearchOptions,
	CharacterSearchResult,
	CharacterTransformerOptions,
	CharacterUpdateInput,
	CharacterWithRelations,
	CreateCharacterData,
	UpdateCharacterData,
} from './types';

export {
	CHARACTER_SORT_PROPERTY_MAP,
	CharacterSortCriteria,
} from './types';

export type {
	CharacterAttributes,
	CharacterCard,
	CharacterExtended,
	CharacterInventoryItem,
	CharacterListItem,
	CharacterSummary,
	CharacterViewConfig,
} from './extended';

export {
	CharacterFiltersSchema,
	CharacterRelationsSchema,
	CharacterSchema,
	CreateCharacterSchema,
	UpdateCharacterSchema,
} from './base';

export {
	CharacterCategory,
	CharacterClass,
	CharacterRace,
} from './enums';

// Alias común para el tipo principal
export type { CharacterWithRelations as Character } from './types';
