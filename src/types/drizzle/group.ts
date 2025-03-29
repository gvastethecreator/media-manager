/**
 * @file Tipos para la entidad Group en Drizzle
 * @module types/drizzle/group
 */

import type { CommonFilters, EntityCounts, OrganizationFields } from './base';

/**
 * Interfaz básica para Group en Drizzle
 */
export interface GroupEntity extends OrganizationFields {
  // No hay campos adicionales específicos para Group más allá de los campos de organización
}

/**
 * Interfaz extendida con relaciones y conteos
 */
export interface GroupWithRelations extends GroupEntity {
  // Contadores
  _count?: EntityCounts;
  totalEntities?: number;
  lastUpdated?: Date;
}

/**
 * Interfaz para crear un grupo nuevo
 */
export interface CreateGroupData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  sortBy?: string;
  filters?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Interfaz para actualizar un grupo existente
 */
export interface UpdateGroupData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  sortBy?: string;
  filters?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Filtros específicos para Group
 */
export interface GroupFilters extends CommonFilters {
  // No hay filtros adicionales específicos para Group
}

/**
 * Criterios de ordenación para Group
 */
export enum GroupSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
}

/**
 * Modos de visualización para Group
 */
export enum GroupViewMode {
  GRID = 'grid',
  LIST = 'list',
  TABLE = 'table',
}

/**
 * Estado de visualización para un grupo individual
 */
export interface GroupDisplayState {
  isExpanded: boolean;
  isSelected: boolean;
  isVisible: boolean;
}