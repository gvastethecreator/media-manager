/**
 * @file Esquema Zod para la entidad Album
 * @module types/entities/album/schema
 */

import { z } from 'zod';
import { AlbumDisplayState, AlbumPrivacyLevel, AlbumSortCriteria, AlbumType, AlbumViewMode } from './enums';

/**
 * Esquema para filtros de búsqueda de álbumes
 */
export const AlbumFiltersSchema = z.object({
  search: z.string().optional(),
  categories: z.array(z.string()).optional(),
  types: z.array(z.nativeEnum(AlbumType)).optional(),
  isFavorite: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  hasImages: z.boolean().optional(),
  hasVideos: z.boolean().optional(),
  hasCollections: z.boolean().optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional()
  }).optional()
});

/**
 * Esquema para estadísticas de uso de álbumes
 */
export const AlbumStatsSchema = z.object({
  imageCount: z.number().default(0),
  videoCount: z.number().default(0),
  totalSize: z.number().default(0), // tamaño en bytes
  usageCount: z.number().optional(),
  relatedEntitiesCount: z.number().optional(),
  lastModified: z.date().optional(),
  averageRating: z.number().optional(),
  viewCount: z.number().optional()
});

/**
 * Esquema para configuración de álbum
 */
export const AlbumSettingsSchema = z.object({
  viewMode: z.nativeEnum(AlbumViewMode).default(AlbumViewMode.GRID),
  displayState: z.nativeEnum(AlbumDisplayState).default(AlbumDisplayState.EXPANDED),
  privacy: z.nativeEnum(AlbumPrivacyLevel).default(AlbumPrivacyLevel.PRIVATE),
  allowDownload: z.boolean().default(true),
  showMetadata: z.boolean().default(true),
  customOrder: z.boolean().default(false),
  thumbnailSize: z.enum(['small', 'medium', 'large']).default('medium'),
  enableComments: z.boolean().default(false),
  enableSharing: z.boolean().default(false),
  passwordProtected: z.boolean().default(false),
  password: z.string().optional(),
  expirationDate: z.date().optional()
});

/**
 * Esquema principal para la entidad Album
 */
export const AlbumSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre es obligatorio"),
  emoji: z.string().default("📷"),
  color: z.string().default("#3B82F6"),
  description: z.string().nullable().optional(),
  shortcut: z.string().nullable().optional(),
  category: z.string().default("general"),
  type: z.nativeEnum(AlbumType).default(AlbumType.STANDARD),
  sortBy: z.string().default(AlbumSortCriteria.DATE_CREATED_DESC),
  filters: z.string().default("{}"),
  featuredImage: z.string().nullable().optional(),
  isFavorite: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  settings: z.string().default("{}"), // JSON string de configuración
  metadata: z.string().nullable().optional(), // JSON string de metadatos
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),

  // Configuración de visualización
  viewMode: z.nativeEnum(AlbumViewMode).optional()
});

/**
 * Esquema para crear un álbum
 */
export const CreateAlbumSchema = AlbumSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  name: z.string().min(1, "El nombre es obligatorio")
});

/**
 * Esquema para actualizar un álbum
 */
export const UpdateAlbumSchema = AlbumSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

/**
 * Esquema para relaciones de un álbum
 */
export const AlbumRelationsSchema = z.object({
  _count: z.object({
    images: z.number().default(0),
    videos: z.number().default(0),
    collections: z.number().default(0),
    tags: z.number().default(0),
    characters: z.number().default(0),
    places: z.number().default(0),
    worldItems: z.number().default(0),
    concepts: z.number().default(0),
    prompts: z.number().default(0),
    notes: z.number().default(0),
    wildcards: z.number().default(0),
    properties: z.number().default(0),
    groups: z.number().default(0)
  }).optional(),

  // Relaciones opcionales
  images: z.array(z.object({ id: z.string() })).optional(),
  videos: z.array(z.object({ id: z.string() })).optional(),
  collections: z.array(z.object({ id: z.string() })).optional(),
  tags: z.array(z.object({ id: z.string() })).optional(),
  characters: z.array(z.object({ id: z.string() })).optional(),
  places: z.array(z.object({ id: z.string() })).optional(),
  worldItems: z.array(z.object({ id: z.string() })).optional(),
  concepts: z.array(z.object({ id: z.string() })).optional(),
  prompts: z.array(z.object({ id: z.string() })).optional(),
  notes: z.array(z.object({ id: z.string() })).optional(),
  wildcards: z.array(z.object({ id: z.string() })).optional(),
  properties: z.array(z.object({ id: z.string() })).optional(),
  groups: z.array(z.object({ id: z.string() })).optional()
});

/**
 * Esquema para opciones de búsqueda
 */
export const AlbumSearchOptionsSchema = z.object({
  skip: z.number().optional(),
  take: z.number().optional(),
  orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
  where: AlbumFiltersSchema.optional(),
  include: z.record(z.boolean()).optional()
});