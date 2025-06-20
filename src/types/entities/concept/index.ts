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
	ConceptViewMode,
} from './enums';
export type {
	ConceptExtended,
	ConceptExtendedComplete,
	ConceptFilters,
	ConceptWithRelationsExtendedComplete,
} from './extended';
// Exportar tipo principal como Concept para compatibilidad
export type {
	ConceptBase as Concept,
	ConceptBase,
	ConceptComplete,
	ConceptCreateInput,
	ConceptSearchOptions,
	ConceptSearchResult,
	ConceptUpdateInput,
} from './types';
// Exportar esquema de validación
export type { ConceptStats } from './schema';
export { ConceptSchema } from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.
