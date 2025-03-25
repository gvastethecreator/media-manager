/**
 * @file Tipos base para la entidad Collection derivados directamente de Prisma
 * @module types/entities/collection/base
 */

import type { Collection as PrismaCollection } from '@prisma/client';

/**
 * Tipo base para Collection, extendido directamente del tipo Prisma
 */
export type CollectionBase = PrismaCollection;

/**
 * Datos mínimos requeridos para crear una colección
 */
export interface CreateCollectionData {
  name: string;
  emoji?: string;
  description?: string;
  color?: string;
  presetId?: string | null;
  category?: string;
  rarity?: string;
  texture?: string;
  url?: string;
  alternativeUrl?: string;
  platform?: string;
  price?: number;
}

/**
 * Datos para actualizar una colección
 */
export interface UpdateCollectionData {
  name?: string;
  emoji?: string;
  description?: string;
  color?: string;
  presetId?: string | null;
  isFavorite?: boolean;
  category?: string;
  rarity?: string;
  texture?: string;
  url?: string;
  alternativeUrl?: string;
  platform?: string;
  price?: number;
  sortBy?: string;
  filters?: string;
  featuredImage?: string;
}

/**
 * Resumen básico de una colección para listados
 */
export interface CollectionSummary {
  id: string;
  name: string;
  emoji: string;
  color: string;
  imageCount: number;
  category?: string;
  rarity?: string;
}

/**
 * Estructura para la configuración de filtros
 */
export interface CollectionFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean | Date;
}

/**
 * Representación de la edición de una colección
 */
export interface CollectionEdition {
  name: string;
  date?: Date;
  totalItems?: number;
  description?: string;
  price?: number;
  currency?: string;
}