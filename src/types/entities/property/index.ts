/**
 * @file Exportación de tipos para la entidad Property
 * @module types/entities/property
 */

export * from './schema';
// Alias común para el tipo principal
export type { PropertyWithRelations as Property } from './types';
export * from './types';

// Exportar enum específicamente para que se pueda usar como valor
export { PropertySortCriteria, PropertyViewMode } from './types';
