/**
 * @file Tipos para la entidad Note
 * @module types/entities/note/note-types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/types';
import type { Collection } from '../collection/types';
import type { Concept } from '../concept/types';
import type { Group } from '../group/types';
import type { Image } from '../image/index';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Property } from '../property/types';
import type { Tag } from '../tag/types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/types';
import type { WorldItem } from '../world-item/types';

/**
 * Interfaz base para nota
 */
export interface NoteBase {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  status: string;
  /**
   * Campo que almacena un array de tags como string JSON
   * Formato: { "items": string[] }
   */
  tags?: string;
  featuredImage: string | null;
  isFavorite: boolean;
  presetId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface NoteWithRelations extends NoteBase {
  // Relaciones con contenido
  images?: Image[];
  videos?: Video[];

  // Relaciones con entidades principales
  albums?: Album[];
  collections?: Collection[];
  tagEntities?: Tag[]; // Renombrado para evitar conflicto con campo tags
  characters?: Character[];
  places?: Place[];
  worldItems?: WorldItem[];
  concepts?: Concept[];
  prompts?: Prompt[];
  wildcards?: Wildcard[];
  properties?: Property[];
  groups?: Group[];

  // Contadores
  _count?: {
    images?: number;
    videos?: number;
    albums?: number;
    collections?: number;
    tags?: number;
    characters?: number;
    places?: number;
    worldItems?: number;
    concepts?: number;
    prompts?: number;
    wildcards?: number;
    properties?: number;
    groups?: number;
  };
}

/**
 * Interfaz para crear una nota
 */
export interface CreateNoteData {
  title: string;
  content?: string;
  category?: string;
  priority?: number;
  status?: string;
  tags?: string[] | string; // Puede recibir tanto array como string JSON
  featuredImage?: string | null;
  isFavorite?: boolean;
  presetId?: string | null;
}

/**
 * Interfaz para actualizar una nota
 */
export interface UpdateNoteData {
  title?: string;
  content?: string;
  category?: string;
  priority?: number;
  status?: string;
  tags?: string[] | string; // Puede recibir tanto array como string JSON
  featuredImage?: string | null;
  isFavorite?: boolean;
  presetId?: string | null;
}

/**
 * Interfaz para filtros de búsqueda de notas
 */
export interface NoteFilters {
  searchQuery?: string;
  categories?: string[];
  priorities?: number[];
  statuses?: string[];
  onlyFavorites?: boolean;
  contentContains?: string;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum NoteSortCriteria {
  TITLE_ASC = 'title:asc',
  TITLE_DESC = 'title:desc',
  PRIORITY_ASC = 'priority:asc',
  PRIORITY_DESC = 'priority:desc',
  STATUS_ASC = 'status:asc',
  STATUS_DESC = 'status:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const NOTE_SORT_PROPERTY_MAP: Record<NoteSortCriteria, string> = {
  [NoteSortCriteria.TITLE_ASC]: 'title',
  [NoteSortCriteria.TITLE_DESC]: 'title',
  [NoteSortCriteria.PRIORITY_ASC]: 'priority',
  [NoteSortCriteria.PRIORITY_DESC]: 'priority',
  [NoteSortCriteria.STATUS_ASC]: 'status',
  [NoteSortCriteria.STATUS_DESC]: 'status',
  [NoteSortCriteria.CREATED_ASC]: 'createdAt',
  [NoteSortCriteria.CREATED_DESC]: 'createdAt',
  [NoteSortCriteria.UPDATED_ASC]: 'updatedAt',
  [NoteSortCriteria.UPDATED_DESC]: 'updatedAt',
};