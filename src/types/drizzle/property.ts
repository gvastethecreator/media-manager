/**
 * @file Tipos para la entidad Property en Drizzle
 * @module types/drizzle/property
 */

import type { CommonFilters, EntityCounts, OrganizationFields } from './base';

/**
 * Interfaz básica para Property en Drizzle
 */
export interface PropertyEntity extends OrganizationFields {
  // No hay campos adicionales específicos para Property más allá de los campos de organización
}

/**
 * Interfaz extendida con relaciones y conteos
 */
export interface PropertyWithRelations extends PropertyEntity {
  // Contadores
  _count?: EntityCounts;
  totalEntities?: number;
  lastUpdated?: Date;
}

/**
 * Interfaz para crear una propiedad nueva
 */
export interface CreatePropertyData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Interfaz para actualizar una propiedad existente
 */
export interface UpdatePropertyData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Filtros específicos para Property
 */
export interface PropertyFilters extends CommonFilters {
  // No hay filtros adicionales específicos para Property
}

/**
 * Criterios de ordenación para Property
 */
export enum PropertySortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
}

/**
 * Modos de visualización para Property
 */
export enum PropertyViewMode {
  GRID = 'grid',
  LIST = 'list',
  TABLE = 'table',
}

/**
 * Estado de visualización para una propiedad individual
 */
export interface PropertyDisplayState {
  isExpanded: boolean;
  isSelected: boolean;
  isVisible: boolean;
}