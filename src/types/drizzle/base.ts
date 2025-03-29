/**
 * @file Tipos base para entidades en Drizzle
 * @module types/drizzle/base
 */

/**
 * Campos base compartidos por todas las entidades
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Campos de presentación compartidos por entidades
 */
export interface PresentationFields {
  emoji: string | null;
  color: string;
}

/**
 * Campos de contenido básicos
 */
export interface ContentFields {
  name: string;
  description: string | null;
}

/**
 * Campos visuales comunes
 */
export interface VisualFields {
  featuredImage: string | null;
  isFavorite: boolean;
}

/**
 * Campos de organización compartidos por entidades principales
 */
export interface OrganizationFields extends BaseEntity, ContentFields, PresentationFields, VisualFields {
  shortcut: string | null;
  category: string | null;
  sortBy: string;
  filters: string;
}

/**
 * Interfaz para contadores de relaciones
 */
export interface EntityCounts {
  images?: number;
  videos?: number;
  albums?: number;
  collections?: number;
  tags?: number;
  characters?: number;
  places?: number;
  worldItems?: number;
  concepts?: number;
  prompts?: number;
  notes?: number;
  wildcards?: number;
  properties?: number;
  groups?: number;
}

/**
 * Interfaz para filtros comunes
 */
export interface CommonFilters {
  searchQuery?: string;
  categories?: string[];
  onlyFavorites?: boolean;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
}

/**
 * Criterios de ordenación comunes
 */
export enum CommonSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
}