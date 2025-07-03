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
	CharacterRelationshipType,
	CharacterSortOption,
} from './enums';

export type {
	CharacterBase,
	CharacterComplete,
	CharacterCreateInput,
	CharacterFilter,
	CharacterFilterItem,
	CharacterFilters,
	CharacterRelations,
	CharacterRelationship,
	CharacterSearchOptions,
	CharacterStats,
	CharacterUpdateInput,
	CharacterViewConfig,
	CharacterWithStats,
	CreateCharacterData,
	
	UpdateCharacterData,
} from './types';

// 📝 Documentación: Solo tipos canónicos y extendidos. Legacy removido.
