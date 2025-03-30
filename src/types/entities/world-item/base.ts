/**
 * @file Tipos base para la entidad WorldItem derivados del modelo Prisma
 * @module types/entities/world-item/base
 */

import type { WorldItem as PrismaWorldItem } from '@prisma/client';

/**
 * Tipo base para WorldItem derivado directamente del tipo Prisma
 */
export type WorldItemBase = PrismaWorldItem;

/**
 * Interfaz para crear un nuevo objeto del mundo
 */
export interface WorldItemCreateInput {
  name: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  type?: string;
  rarity?: string;
  size?: string;
  origin?: string;
  attributes?: string;
  effects?: string;
  requirements?: string;
  stats?: string;
  properties?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
}

/**
 * Interfaz para actualizar un objeto del mundo
 */
export interface WorldItemUpdateInput {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string | null;
  shortcut?: string | null;
  category?: string | null;
  type?: string;
  rarity?: string;
  size?: string;
  origin?: string;
  attributes?: string;
  effects?: string;
  requirements?: string;
  stats?: string;
  properties?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
  sortBy?: string;
  filters?: string;
}
