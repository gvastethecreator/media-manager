/**
 * @file Exportaciones principales de tipos para la entidad Character
 * @module types/entities/character
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types' y extendidos desde './extended'.
 * Legacy de './base' y './enums' eliminado.
 */

export type {
	CharacterAttributes,
	CharacterCard,
	CharacterExtended,
	CharacterInventoryItem,
	CharacterListItem,
	CharacterSummary,
	CharacterViewConfig
} from './extended';
// Alias común para el tipo principal
export {
	CHARACTER_SORT_PROPERTY_MAP,
	CharacterSortCriteria
} from './types';
export type {
	CharacterWithRelations as Character, CharacterBase,
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
	CharacterWithRelations, CreateCharacterData,
	UpdateCharacterData
} from './types';

// 📝 Documentación: Solo tipos canónicos y extendidos. Legacy removido.
