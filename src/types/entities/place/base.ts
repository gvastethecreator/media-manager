/**
 * @file Tipos base para la entidad Place
 * @module types/entities/place/base
 */

import type { Concept } from '../concepts';
import type { Image } from '../images';
import type { Note } from '../notes';
import type { Prompt } from '../prompts';

/**
 * Datos básicos para crear un nuevo lugar
 */
export interface CreatePlaceData {
  name: string;
  emoji?: string | null;
  color?: string | null;
  description?: string | null;
  shortcut?: string | null;
  region?: string | null;
  type?: string | null;
  climate?: string | null;
  population?: number | null;
  government?: string | null;
  dangers?: string | null; // JSON string
  resources?: string | null; // JSON string
  lore?: string | null;
  history?: string | null;
  stats?: string | null; // JSON string
  sortBy?: string | null;
  filters?: string | null; // JSON string
  featuredImage?: string | null;
  isFavorite?: boolean;
  category?: string | null;
}

/**
 * Datos para actualizar un lugar existente
 */
export interface UpdatePlaceData {
  name?: string;
  emoji?: string | null;
  color?: string | null;
  description?: string | null;
  shortcut?: string | null;
  region?: string | null;
  type?: string | null;
  climate?: string | null;
  population?: number | null;
  government?: string | null;
  dangers?: string | null; // JSON string
  resources?: string | null; // JSON string
  lore?: string | null;
  history?: string | null;
  stats?: string | null; // JSON string
  sortBy?: string | null;
  filters?: string | null; // JSON string
  featuredImage?: string | null;
  isFavorite?: boolean;
  category?: string | null;
}

/**
 * Entidad base Place
 */
export interface PlaceBase {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  description: string | null;
  shortcut: string | null;
  region: string | null;
  type: string | null;
  climate: string | null;
  population: number | null;
  government: string | null;
  dangers: string | null; // JSON string
  resources: string | null; // JSON string
  lore: string | null;
  history: string | null;
  stats: string | null; // JSON string
  sortBy: string | null;
  filters: string | null; // JSON string
  featuredImage: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: string | null;
}

/**
 * Entidad Place con relaciones
 */
export interface PlaceWithRelations extends PlaceBase {
  // Relaciones
  images?: Image[];
  notes?: Note[];
  concepts?: Concept[];
  prompts?: Prompt[];

  // Contadores
  _count?: {
    images?: number;
    notes?: number;
    concepts?: number;
    prompts?: number;
  };
}