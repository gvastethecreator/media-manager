/**
 * @file Exporta todos los tipos relacionados con la entidad Concept
 * @module types/entities/concept
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types', extendidos desde './extended' y enums desde './enums'.
 * Legacy eliminado.
 */

export {
	ConceptCategory,
	ConceptStatus,
	ConceptViewMode
} from './enums';
export type {
	ConceptExtended,
	ConceptExtendedComplete, ConceptFilters, ConceptWithRelationsExtendedComplete
} from './extended';
export type {
	ConceptBase,
	ConceptCreateInput,
	ConceptUpdateInput
} from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.
