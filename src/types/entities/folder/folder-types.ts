/**
 * @file Tipos para la entidad Folder
 * @module types/entities/folder/folder-types
 */

import type { Image } from '../image/index';
import type { Video } from '../video/types';

/**
 * Interfaz base para carpeta
 */
export interface FolderBase {
  id: string;
  name: string;
  description: string | null;
  path: string;

  // Propiedades de visualización
  emoji: string | null;
  color: string | null;
  featuredImage: string | null;
  isFavorite: boolean;

  // Propiedades de sistema
  totalFiles: number;
  totalSize: number;
  autoReindex: boolean;
  lastIndexed: Date | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Foreign keys
  parentId: string | null;
  presetId: string | null;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface FolderWithRelations extends FolderBase {
  // Relaciones jerárquicas
  parent: FolderWithRelations | null;
  children: FolderWithRelations[];

  // Relaciones con contenido
  images: Image[];
  videos: Video[];

  // Contadores
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
export interface FolderTreeItem extends Pick<FolderBase, 'id' | 'name' | 'path' | 'parentId' | 'emoji' | 'color'> {
  children: FolderTreeItem[];
  level: number;
  isOpen: boolean;
  isSelected: boolean;
  hasChildren: boolean;
  totalItems?: number;
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