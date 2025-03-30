/**
 * @file Serializadores para la entidad Note
 * @module entities/note/serializers
 */

import { logger } from '@/lib/logger';
import { NoteSchema, NoteTagsSchema } from '@/types/entities/note/schema';
import type { Note, NoteComplete, NoteTags } from '@/types/entities/note/types';

/**
 * Serializa los tags de una nota
 */
export function serializeNoteTags(tags: NoteTags | null): string {
  if (!tags) return '';
  try {
    return JSON.stringify(tags);
  } catch (error) {
    logger.error('Error serializando tags de nota:', error);
    return '';
  }
}

/**
 * Deserializa los tags de una nota
 */
export function deserializeNoteTags(tagsJson: string | null): NoteTags {
  if (!tagsJson) return { items: [] };
  try {
    const parsed = JSON.parse(tagsJson);
    return NoteTagsSchema.parse(parsed);
  } catch (error) {
    logger.error('Error deserializando tags de nota:', error);
    return { items: [] };
  }
}

/**
 * Extiende una nota con campos deserializados
 */
export function extendNote(note: Note): NoteComplete {
  return {
    ...note,
    tags: typeof note.tags === 'string' ? deserializeNoteTags(note.tags).items : note.tags || [],
    _count: note._count || {
      images: 0,
      videos: 0,
      albums: 0,
      collections: 0,
      characters: 0,
      properties: 0
    }
  };
}

/**
 * Valida una nota usando el esquema definido
 */
export function validateNote(note: Note): boolean {
  try {
    NoteSchema.parse(note);
    return true;
  } catch (error) {
    logger.error('Error validando nota:', error);
    return false;
  }
}