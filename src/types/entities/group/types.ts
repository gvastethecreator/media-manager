/**
 * @file Tipos unificados para la entidad Group
 * @module types/entities/group/types
 */

import { CacheExpirationPolicy } from '@/types/cache';
import type { Image, Video } from '@/types/entities/index';
import type { FileItem } from '@/types/file-item';
import { SearchOperator } from '@/types/search';
import type { BaseEntity } from '@/types/store.types';

// Definición para campos que pueden ser nulos
type Nullable<T> = T | null;

import { z } from 'zod';

// Tipos base
export interface GroupBase extends BaseEntity {
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
  sortBy: string;
  filters: string;
  featuredImage: string | null;
  isFavorite: boolean;
}

// Contadores
export interface GroupCount {
  images: number;
  videos: number;
  albums: number;
  collections: number;
  tags: number;
  characters: number;
  places: number;
  worldItems: number;
  concepts: number;
  prompts: number;
  notes: number;
  wildcards: number;
  properties: number;
}

// Estadísticas extendidas
export interface GroupWithStats extends GroupBase {
  _count: GroupCount;
  totalEntities: number;
  lastUpdated: Date;
}

// Relaciones
export interface GroupWithRelations extends GroupBase {
  images?: Image[];
  videos?: Video[];
  // ...otras relaciones...
  _count?: Partial<GroupCount>;
}

// Archivos
export interface GroupWithFiles extends GroupBase {
  files: FileItem[];
}

// Filtros
export interface GroupFilters {
  query?: string;
  categories?: string[];
  isFavorite?: boolean;
  withImages?: boolean;
  withVideos?: boolean;
}

// Filtros avanzados
export interface GroupAdvancedFilter {
  field: string;
  operator: SearchOperator;
  value: unknown;
  isActive: boolean;
}

// Configuración de caché para grupos
export interface GroupCacheConfig {
  enabled: boolean;
  expirationPolicy: CacheExpirationPolicy;
  ttl: number; // tiempo en milisegundos
  maxItems: number;
}

// Datos para crear/actualizar
export interface CreateGroupData {
  name: string;
  description?: Nullable<string>;
  emoji?: string;
  color?: string;
  category?: Nullable<string>;
  shortcut?: Nullable<string>;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
}

export interface UpdateGroupData extends Partial<CreateGroupData> {}

// Enums
export enum GroupViewMode {
  GRID = 'grid',
  LIST = 'list',
  TABLE = 'table'
}

export enum GroupSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc'
}

// Opciones para el listado de grupos
export interface GroupListOptions {
  viewMode: GroupViewMode;
  sortBy: GroupSortCriteria;
  filterBy?: GroupFilters;
  advancedFilters?: GroupAdvancedFilter[];
  page: number;
  pageSize: number;
  includeCount: boolean;
  includeStats: boolean;
}

// Resultado de búsqueda para grupos
export interface GroupSearchResult {
  items: GroupWithStats[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  sortBy: string;
  filterBy?: GroupFilters;
}

// Validaciones Zod
export const groupFilterSchema = z.object({
  type: z.enum(['tag', 'character', 'place', 'concept', 'worldItem']),
  operator: z.enum(['AND', 'OR', 'NOT']),
  value: z.union([z.string(), z.number(), z.boolean()]),
  field: z.string().optional()
});

export const groupAdvancedFilterSchema = z.object({
  field: z.string(),
  operator: z.nativeEnum(SearchOperator),
  value: z.unknown(),
  isActive: z.boolean()
});

export const groupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable(),
  emoji: z.string(),
  color: z.string(),
  category: z.string().nullable(),
  shortcut: z.string().nullable(),
  sortBy: z.string().nullable(),
  filters: z.string(),
  isFavorite: z.boolean(),
  featuredImage: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const groupListOptionsSchema = z.object({
  viewMode: z.nativeEnum(GroupViewMode),
  sortBy: z.nativeEnum(GroupSortCriteria),
  filterBy: z.object({
    query: z.string().optional(),
    categories: z.array(z.string()).optional(),
    isFavorite: z.boolean().optional(),
    withImages: z.boolean().optional(),
    withVideos: z.boolean().optional()
  }).optional(),
  advancedFilters: z.array(groupAdvancedFilterSchema).optional(),
  page: z.number().positive(),
  pageSize: z.number().positive(),
  includeCount: z.boolean(),
  includeStats: z.boolean()
});

export type GroupFilter = z.infer<typeof groupFilterSchema>;
export type GroupAdvancedFilterValidated = z.infer<typeof groupAdvancedFilterSchema>;
export type GroupValidated = z.infer<typeof groupSchema>;
export type GroupListOptionsValidated = z.infer<typeof groupListOptionsSchema>;