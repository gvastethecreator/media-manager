/**
 * @file Tipos de utilidad básicos
 * @module utils/types/utility-types
 */

import { z } from 'zod';

/**
 * Tipo para valores que pueden ser null
 */
export type Nullable<T> = T | null;

/**
 * Tipo para strings que contienen JSON serializado
 */
export type JSONString<T> = string & { _brand: 'JSONString'; _type: T };

/**
 * Tipo para IDs de entidades
 */
export type EntityId = string & { _brand: 'EntityId' };

/**
 * Tipo para representar un color hexadecimal
 */
export type HexColor = string & { _brand: 'HexColor' };

/**
 * Schema base para validación de entidades
 */
export const baseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Schema base para atributos visuales comunes
 */
export const visualPropertiesSchema = z.object({
  emoji: z.string(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Color hexadecimal inválido'),
  featuredImage: z.string().nullable(),
  isFavorite: z.boolean()
});

/**
 * Schema base para filtros comunes
 */
export const baseFilterSchema = z.object({
  searchQuery: z.string().optional(),
  categories: z.array(z.string()).optional(),
  onlyFavorites: z.boolean().optional(),
  hasImages: z.boolean().optional()
});

/**
 * Tipo para representar un contador genérico de relaciones
 */
export interface BaseEntityCount {
  total: number;
  images: number;
  videos: number;
  notes: number;
  tags: number;
}

/**
 * Tipo para response básica de API
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}