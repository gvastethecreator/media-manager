/**
 * @file Índice para tipos de Wildcard
 * @module types/entities/wildcard
 */

export * from './types';

// Alias común para el tipo principal
export type { WildcardWithRelations as Wildcard } from './types';

// Exportar enum específicamente para que se pueda usar como valor
export { WildcardSortCriteria, WildcardViewMode } from './types';

