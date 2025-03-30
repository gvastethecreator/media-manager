/**
 * @file Exportación de tipos para la entidad Wildcard
 * @module types/entities/wildcard
 */

export * from './schema';
export * from './types';

// Alias común para el tipo principal
export type { WildcardComplete as Wildcard } from './types';

// Exportar enums específicamente
export { WildcardSortCriteria, WildcardViewMode } from './types';

