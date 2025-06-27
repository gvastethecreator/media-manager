/**
 * @file Exporta todos los tipos relacionados con la entidad Concept
 * @module types/entities/concept
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types' y enums desde './enums'.
 * Legacy eliminado.
 */

export {
	ConceptCategory,
	ConceptStatus,
	ConceptViewMode,
} from './enums';
// Exportar esquema de validación
export type { ConceptStats } from './schema';
export type {
	ConceptBase as Concept,
	ConceptBase,
	ConceptComplete,
	ConceptCreateInput,
	ConceptExtended,
	ConceptFilters,
	ConceptListItem,
	ConceptSearchOptions,
	ConceptSearchResult,
	ConceptUpdateInput,
} from './types';
// Exportar tipo principal como Concept para compatibilidad
export { ConceptSchema } from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.
