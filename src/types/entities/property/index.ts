/**
 * @file Índice para tipos de Property
 * @module types/entities/property
 */

export * from './types';

// Alias común para el tipo principal
export type { PropertyWithRelations as Property } from './types';

// Exportar enum específicamente para que se pueda usar como valor
export { PropertySortCriteria, PropertyViewMode } from './types';

