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
export type {
    CharacterWithRelations as Character, CharacterBase,
    CharacterComplete,
    CharacterCounts,
    CharacterCreateInput,
    CharacterFilters,
    CharacterRelations,
    CharacterSearchOptions,
    CharacterUpdateInput, CharacterWithRelations,
    CreateCharacterData,
    UpdateCharacterData
} from './types';
// 📝 Documentación: Solo tipos canónicos y extendidos. Legacy removido.
