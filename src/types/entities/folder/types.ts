/**
 * @file Tipos para la entidad Folder
 * @module types/entities/folder/types
 * @description Define los tipos relacionados con Folder, adaptando el esquema de Prisma
 * para una mejor tipificación en la aplicación
 */

import type { Folder as PrismaFolder } from '@prisma/client';
import type { Image } from '../image';
import type { Video } from '../video';

/**
 * Tipo base para datos de Folder según el esquema de Drizzle
 */
export type FolderBase = PrismaFolder;

/**
 * Interfaz que extiende el tipo base de Folder con propiedades para UI
 */
export interface FolderExtended extends FolderBase {
  // Propiedades adicionales para UI
  isSelected?: boolean;
  isOpen?: boolean;
  level?: number;
  isLoading?: boolean;
  hasError?: boolean;
  recentImages?: string[] | null;
}

/**
 * Interfaz completa de Folder que representa todos los campos deserializados
 * y estructuras completas
 */
export interface FolderComplete extends FolderBase {
  // Aunque Folder no tiene campos JSON para deserializar en Prisma,
  // mantenemos esta interfaz para consistencia con otras entidades
}

/**
 * Interfaz que extiende FolderComplete y agrega propiedades de UI
 * y relaciones completas
 */
export interface FolderExtendedComplete extends FolderComplete, FolderExtended {
  // Relaciones
  parent?: FolderExtendedComplete | null;
  children?: FolderExtendedComplete[];
  images?: Image[];
  videos?: Video[];

  // Contadores de relaciones
  _count?: {
    children: number;
    images: number;
    videos: number;
  };
}

/**
 * Interfaz para crear una carpeta
 */
export interface CreateFolderData {
  name: string;
  description?: string | null;
  path: string;
  emoji?: string | null;
  color?: string | null;
  featuredImage?: string | null;
  isFavorite?: boolean;
  autoReindex?: boolean;
  parentId?: string | null;
  presetId?: string | null;
}

/**
 * Interfaz para actualizar una carpeta
 */
export interface UpdateFolderData {
  name?: string;
  description?: string | null;
  path?: string;
  emoji?: string | null;
  color?: string | null;
  featuredImage?: string | null;
  isFavorite?: boolean;
  autoReindex?: boolean;
  totalFiles?: number;
  totalSize?: number;
  lastIndexed?: Date | null;
  parentId?: string | null;
  presetId?: string | null;
}

/**
 * Interfaz para filtros de búsqueda de carpetas
 */
export interface FolderFilters {
  searchQuery?: string;
  parentId?: string | null;
  onlyFavorites?: boolean;
  pathContains?: string;
  hasAutoReindex?: boolean;
}

/**
 * Tipo para carpetas en árbol de navegación
 */
export interface FolderTreeItem {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  emoji: string | null;
  color: string | null;

  children: FolderTreeItem[];
  level: number;
  isOpen: boolean;
  isSelected: boolean;
  hasChildren: boolean;
  totalItems?: number;
}

/**
 * Tipo para información resumida de carpeta
 */
export interface FolderSummary {
  id: string;
  name: string;
  path: string;
  imageCount: number;
  totalSize: number;
  lastIndexed: Date | null;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum FolderSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  PATH_ASC = 'path:asc',
  PATH_DESC = 'path:desc',
  SIZE_ASC = 'size:asc',
  SIZE_DESC = 'size:desc',
  FILES_ASC = 'files:asc',
  FILES_DESC = 'files:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
  INDEXED_ASC = 'indexed:asc',
  INDEXED_DESC = 'indexed:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const FOLDER_SORT_PROPERTY_MAP: Record<FolderSortCriteria, string> = {
  [FolderSortCriteria.NAME_ASC]: 'name',
  [FolderSortCriteria.NAME_DESC]: 'name',
  [FolderSortCriteria.PATH_ASC]: 'path',
  [FolderSortCriteria.PATH_DESC]: 'path',
  [FolderSortCriteria.SIZE_ASC]: 'totalSize',
  [FolderSortCriteria.SIZE_DESC]: 'totalSize',
  [FolderSortCriteria.FILES_ASC]: 'totalFiles',
  [FolderSortCriteria.FILES_DESC]: 'totalFiles',
  [FolderSortCriteria.CREATED_ASC]: 'createdAt',
  [FolderSortCriteria.CREATED_DESC]: 'createdAt',
  [FolderSortCriteria.UPDATED_ASC]: 'updatedAt',
  [FolderSortCriteria.UPDATED_DESC]: 'updatedAt',
  [FolderSortCriteria.INDEXED_ASC]: 'lastIndexed',
  [FolderSortCriteria.INDEXED_DESC]: 'lastIndexed',
};