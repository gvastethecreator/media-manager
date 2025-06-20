/**
 * @file Exportaciones principales de tipos para la entidad Character
 * @module types/entities/character
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types' y extendidos desde './extended'.
 * Legacy de './base' y './enums' eliminado.
 */

export {
    CharacterAlignment,
    CharacterCategory,
    CharacterClass,
    CharacterRace,
    CharacterSortOption
} from './enums';
export type {
    CharacterAttributes,
    CharacterCard,
    CharacterExtended,
    CharacterInventoryItem,
    CharacterListItem,
    CharacterSummary,
    CharacterViewConfig
} from './extended';
export type {
    CharacterWithRelations as Character, CharacterBase,
    CharacterComplete,
    CharacterCounts,
    CharacterCreateInput,
    CharacterFilter,
    CharacterFilterItem,
    CharacterFilters,
    CharacterRelations,
    CharacterRelationship,
    CharacterSearchOptions,
    CharacterStats,
    CharacterUpdateInput, CharacterWithRelations,
    CreateCharacterData,
    UpdateCharacterData
} from './types';
// 📝 Documentación: Solo tipos canónicos y extendidos. Legacy removido.
