/**
 * @file Exportación de tipos para la entidad Property
 * @module types/entities/property
 */

export * from './schema';
export * from './types';

// Alias común para el tipo principal
export type { PropertyWithRelations as Property } from './types';

// Exportar enum específicamente para que se pueda usar como valor
export { PropertySortCriteria, PropertyViewMode } from './types';

