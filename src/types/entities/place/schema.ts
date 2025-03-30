/**
 * @file Esquema de validación para la entidad Place
 * @module types/entities/place/schema
 */

import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import { z } from 'zod';
import { PlaceCategory, PlaceClimate, PlaceType } from './types';

/**
 * 🏰 Esquema para peligros de un lugar
 */
export const PlaceDangerSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  level: z.number().optional()
});

/**
 * 🌟 Esquema para recursos de un lugar
 */
export const PlaceResourceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  abundance: z.number().optional()
});

/**
 * 📊 Esquema para estadísticas de un lugar
 */
export const PlaceStatSchema = z.object({
  name: z.string(),
  value: z.number(),
  maxValue: z.number().optional()
});

/**
 * 🔍 Esquema para filtros de búsqueda
 */
export const PlaceFiltersSchema = z.object({
  searchQuery: z.string().optional(),
  categories: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  types: z.array(z.string()).optional(),
  climates: z.array(z.string()).optional(),
  populationRange: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  governments: z.array(z.string()).optional(),
  onlyFavorites: z.boolean().optional(),
  hasImages: z.boolean().optional(),
  hasNotes: z.boolean().optional(),
  hasConcepts: z.boolean().optional(),
  hasPrompts: z.boolean().optional()
});

/**
 * 🌍 Esquema principal para Place
 */
export const PlaceSchema = z.object({
  ...BaseEntitySchema.shape,
  ...UIFieldsSchema.shape,
  ...MetadataFieldsSchema.shape,
  name: z.string().min(1),
  emoji: z.string().optional(),
  color: z.string().optional(),
  description: z.string().nullable(),
  shortcut: z.string().nullable(),
  category: z.nativeEnum(PlaceCategory).nullable(),
  region: z.string().optional(),
  type: z.nativeEnum(PlaceType).optional(),
  climate: z.nativeEnum(PlaceClimate).optional(),
  population: z.number().optional(),
  government: z.string().optional(),
  dangers: z.union([z.string(), z.array(PlaceDangerSchema)]).optional(),
  resources: z.union([z.string(), z.array(PlaceResourceSchema)]).optional(),
  lore: z.string().optional(),
  history: z.string().optional(),
  stats: z.union([z.string(), z.record(z.string(), z.number())]).optional(),
  sortBy: z.string().optional(),
  filters: z.union([z.string(), PlaceFiltersSchema]).optional(),
  featuredImage: z.string().nullable(),
  isFavorite: z.boolean().default(false)
});