/**
 * @file Exportaciones principales de tipos para la entidad Character
 * @module types/entities/character
 */

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

export type {
	CharacterAttributes,
	CharacterCard,
	CharacterExtended,
	CharacterInventoryItem,
	CharacterListItem,
	CharacterSummary,
	CharacterViewConfig,
} from './extended';
// Alias común para el tipo principal
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
	CharacterWithRelations as Character,
	CreateCharacterData,
	UpdateCharacterData,
} from './types';
export {
	CHARACTER_SORT_PROPERTY_MAP,
	CharacterSortCriteria,
} from './types';
