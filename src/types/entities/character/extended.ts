/**
 * @file Tipos extendidos para la entidad Character con propiedades adicionales de UI
 * @module types/entities/character/extended
 */

import type { Concept, Image, Note, Prompt } from '@prisma/client';
import type { CharacterBase, CharacterFilter, CharacterRelationship, CharacterStats } from './base';

/**
 * Tipo extendido para Character con propiedades adicionales de UI
 */
export interface CharacterExtended extends CharacterBase {
  // Propiedades de UI
  isSelected?: boolean;
  isHovered?: boolean;
  isOpen?: boolean;
  isLoading?: boolean;
  hasError?: boolean;

  // Calculados/runtime
  parsedFilters?: CharacterFilter[];
  parsedStats?: CharacterStats;
  parsedRelationships?: CharacterRelationship[];
  parsedGoals?: string[];
  parsedFears?: string[];
  parsedBeliefs?: string[];
  parsedPersonality?: string[];
  imageCount?: number;

  // Relaciones expandidas
  images?: Image[];
  relatedCharacters?: CharacterExtended[];
  relatedTo?: CharacterExtended[];
  notes?: Note[];
  concepts?: Concept[];
  prompts?: Prompt[];
}

/**
 * Tipo para las estadísticas y atributos adicionales de un personaje
 */
export interface CharacterAttributes {
  level: number;
  stats: CharacterStats;
  skills: Record<string, number>;
  traits: string[];
  inventory: CharacterInventoryItem[];
  experience: number;
  health: {
    current: number;
    max: number;
  };
  resources: Record<string, {
    current: number;
    max: number;
  }>;
}

/**
 * Tipo para los elementos del inventario de un personaje
 */
export interface CharacterInventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  type: string;
  isEquipped?: boolean;
  rarity?: string;
  stats?: Record<string, number>;
}

/**
 * Tipo para los datos de una lista de personajes
 */
export interface CharacterListItem extends CharacterExtended {
  isFeatured?: boolean;
  thumbnailUrl?: string;
}

/**
 * Tipo para la configuración de visualización de personajes
 */
export interface CharacterViewConfig {
  viewType: 'grid' | 'list' | 'compact' | 'gallery' | 'card';
  sortBy: 'name' | 'level' | 'race' | 'class' | 'date';
  sortDirection: 'asc' | 'desc';
  showImages: boolean;
  imageCount: number;
  enableAnimations: boolean;
  groupBy?: 'race' | 'class' | 'alignment' | 'category' | null;
  showStats: boolean;
  compactView: boolean;
}

/**
 * Tipo para la tarjeta de personaje
 */
export interface CharacterCard {
  character: CharacterExtended;
  thumbnails: string[];
  isExpanded: boolean;
  isFlipped: boolean;
  showDetails: boolean;
  activeTab?: 'info' | 'stats' | 'relationships' | 'background' | 'images';
}