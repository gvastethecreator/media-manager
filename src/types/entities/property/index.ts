/**
 * @file Exportaciones principales de tipos para la entidad Property
 * @module types/entities/property
 */

// Exportar los tipos principales
export type {
    PropertyBase,
    PropertyCreateInput, PropertyRelations, PropertyUpdateInput, PropertyWithRelations
} from './types';

// Exportar los enums
export {
    PropertySortCriteria,
    PropertyViewMode
} from './types';

// Exportar el esquema de validación
export { PropertySchema } from './types';

// Exportar esquemas adicionales de validación
export {
    CreatePropertySchema, PropertyFiltersSchema,
    PropertySearchOptionsSchema,
    PropertyStatsSchema, UpdatePropertySchema
} from './schema';

