/**
 * @file Tipos unificados para la entidad WorldItem
 * @module types/entities/world-item/types
 */

import type { FileItem } from '@/types/file-item';
import type { Nullable } from '@/utils/types/utility-types';
import type { Album, Character, Collection, Concept, Group, Image, Note, Place, Prompt, Property, Tag, Video, Wildcard } from '../index';
import type { WorldItemBase } from './base';
import { WorldItemCategory, WorldItemRarity, WorldItemType } from './enums';
import type { WorldItemStats } from './stats-types';

import { z } from 'zod';

// Filtros
export interface WorldItemFilters {
  query?: string;
  types?: WorldItemType[];
  categories?: WorldItemCategory[];
  rarities?: WorldItemRarity[];
  minLevel?: number;
  maxLevel?: number;
  minValue?: number;
  maxValue?: number;
  isFavorite?: boolean;
  hasImages?: boolean;
  hasFiles?: boolean;
}

// Contadores unificados
export interface WorldItemCount {
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
  groups: number;
}

// Estadísticas extendidas
export interface WorldItemWithStats extends WorldItemBase {
  _count: WorldItemCount;
  totalEntities: number;
  lastUpdated: Date;
  totalSize: number;
  processedStats: WorldItemStats;
}

// Relaciones
export interface WorldItemWithRelations extends WorldItemBase {
  images?: Image[];
  videos?: Video[];
  albums?: Album[];
  collections?: Collection[];
  tags?: Tag[];
  characters?: Character[];
  places?: Place[];
  concepts?: Concept[];
  prompts?: Prompt[];
  notes?: Note[];
  wildcards?: Wildcard[];
  properties?: Property[];
  groups?: Group[];
  _count?: Partial<WorldItemCount>;
}

// Archivos
export interface WorldItemWithFiles extends WorldItemBase {
  files: FileItem[];
}

// Datos para crear/actualizar
export interface CreateWorldItemData {
  name: string;
  description?: Nullable<string>;
  emoji?: string;
  color?: string;
  type?: string;
  rarity?: string;
  size?: string;
  category?: Nullable<string>;
  shortcut?: Nullable<string>;
  isFavorite?: boolean;
  origin?: string;
  attributes?: string;
  effects?: string;
  requirements?: string;
  stats?: string;
  properties?: string;
  sortBy?: string;
  filters?: string;
  featuredImage?: Nullable<string>;
}

export interface UpdateWorldItemData extends Partial<CreateWorldItemData> {}

// Validaciones Zod
export const worldItemFilterSchema = z.object({
  type: z.enum(['tag', 'character', 'place', 'concept', 'worldItem']),
  operator: z.enum(['AND', 'OR', 'NOT']),
  value: z.union([z.string(), z.number(), z.boolean()]),
  field: z.string().optional()
});

// Schema Zod actualizado
export const worldItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable(),
  emoji: z.string(),
  color: z.string(),
  category: z.string().nullable(),
  shortcut: z.string().nullable(),
  type: z.string(),
  rarity: z.string(),
  size: z.string(),
  origin: z.string(),
  sortBy: z.string(),
  filters: z.string(),
  featuredImage: z.string().nullable(),
  isFavorite: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  attributes: z.string(),
  effects: z.string(),
  requirements: z.string(),
  stats: z.string(),
  properties: z.string()
});

export type WorldItemFilter = z.infer<typeof worldItemFilterSchema>;
export type WorldItemValidated = z.infer<typeof worldItemSchema>;