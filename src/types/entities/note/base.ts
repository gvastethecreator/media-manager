import type { Prisma } from '@prisma/client';
import type { EntityType } from '../entities';

/**
 * Tipo base para Note derivado del schema de Prisma
 */
export type NoteBase = Prisma.NoteGetPayload<{}>;

/**
 * Interfaz para crear una nueva nota
 */
export interface NoteCreateInput {
  title: string;
  content?: string;
  category?: string;
  priority?: number;
  status?: string;
  tags?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Interfaz para actualizar una nota existente
 */
export interface NoteUpdateInput {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  priority?: number;
  status?: string;
  tags?: string;
  featuredImage?: string | null;
  isFavorite?: boolean;
}

/**
 * Tipo para la relación de nota con otras entidades
 */
export interface NoteRelation {
  entityId: string;
  entityType: EntityType;
  noteId: string;
}

/**
 * Interfaz para estadísticas de una nota
 */
export interface NoteStats {
  characters: number;
  places: number;
  worldItems: number;
  concepts: number;
  prompts: number;
  images: number;
}

/**
 * Interfaz para nota con estadísticas incluidas
 */
export interface NoteWithStats extends NoteBase {
  _count: NoteStats;
}