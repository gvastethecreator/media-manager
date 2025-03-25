/**
 * @file Tipos de datos para la entidad Album
 * @module types/entities/album/types
 */

import { AlbumPrivacyLevel, AlbumType } from './enums';

/**
 * Interfaz base para álbum
 */
export interface AlbumBase {
  id: string;
  name: string;
  description?: string;
  coverImageId?: string | null;
  type: AlbumType;
  createdAt: Date | string;
  updatedAt: Date | string;
  ownerId: string;
  parentId?: string | null;
  sortOrder?: number;
  isArchived: boolean;
  slug?: string;
}

/**
 * Metadatos del álbum
 */
export interface AlbumMetadata {
  itemCount: number;
  imageCount?: number;
  videoCount?: number;
  totalSize?: number; // tamaño en bytes
  dateRange?: {
    from: Date | string | null;
    to: Date | string | null;
  };
  locations?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    count: number;
  }>;
  customFields?: Record<string, any>;
  coverImageUrl?: string;
  thumbnailUrls?: string[];
  lastModified?: Date | string;
}

/**
 * Elemento de álbum (para relaciones)
 */
export interface AlbumItem {
  id: string;
  albumId: string;
  itemId: string;
  itemType: 'image' | 'video';
  sortOrder: number;
  addedAt: Date | string;
  coverForAlbum?: boolean;
}

/**
 * Configuración de visualización del álbum
 */
export interface AlbumViewConfig {
  theme?: string;
  layout?: string;
  showDates?: boolean;
  showLocations?: boolean;
  showDescriptions?: boolean;
  thumbnailSize?: 'small' | 'medium' | 'large';
  enableTransitions?: boolean;
  coverImageFit?: 'contain' | 'cover';
  backgroundColor?: string;
  customCss?: string;
}

/**
 * Datos para crear un álbum
 */
export interface CreateAlbumData {
  name: string;
  description?: string;
  coverImageId?: string;
  type?: AlbumType;
  parentId?: string | null;
  privacyLevel?: AlbumPrivacyLevel;
  items?: Array<{
    itemId: string;
    itemType: 'image' | 'video';
  }>;
  viewConfig?: Partial<AlbumViewConfig>;
}

/**
 * Datos para actualizar un álbum
 */
export interface UpdateAlbumData {
  name?: string;
  description?: string;
  coverImageId?: string | null;
  type?: AlbumType;
  parentId?: string | null;
  privacyLevel?: AlbumPrivacyLevel;
  isArchived?: boolean;
  viewConfig?: Partial<AlbumViewConfig>;
}

/**
 * Datos para añadir o actualizar elementos de álbum
 */
export interface UpdateAlbumItemsData {
  items: Array<{
    itemId: string;
    itemType: 'image' | 'video';
    sortOrder?: number;
    coverForAlbum?: boolean;
  }>;
  replaceExisting?: boolean;
}

/**
 * Interfaz extendida para álbum con todas las propiedades
 */
export interface Album extends AlbumBase {
  // Relaciones
  parent?: {
    id: string;
    name: string;
  } | null;

  children?: Album[];

  coverImage?: {
    id: string;
    url: string;
    thumbnailUrl: string;
  } | null;

  // Metadatos
  metadata?: AlbumMetadata;

  // Configuración
  viewConfig?: AlbumViewConfig;

  // Permisos
  privacyLevel: AlbumPrivacyLevel;
  sharedWith?: string[];

  // Para UI
  isExpanded?: boolean;
  isSelected?: boolean;
}