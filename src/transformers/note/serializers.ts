import { serverLogger } from '@/lib/logger/server-logger';
import type { NoteBase, NoteTags } from '@/types/entities/note';

const serializersLogger = serverLogger.withContext('Note:Serializers');

/**
 * Serializa un array de tags a string para almacenar en BD
 * @param tags Array de tags
 * @returns String JSON serializado
 */
export function serializeTags(tags: string[]): string {
  try {
    const tagsObj: NoteTags = { items: tags };
    return JSON.stringify(tagsObj);
  } catch (error) {
    serializersLogger.error('❌ Error serializando tags:', error);
    return JSON.stringify({ items: [] });
  }
}

/**
 * Deserializa string JSON de tags a array
 * @param tagsJson String JSON de tags
 * @returns Array de tags
 */
export function deserializeTags(tagsJson: string | null | undefined): string[] {
  if (!tagsJson || tagsJson === 'empty_array') return [];

  try {
    const parsed = JSON.parse(tagsJson) as NoteTags;
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch (error) {
    serializersLogger.error('❌ Error deserializando tags:', error);
    return [];
  }
}

/**
 * Procesa una nota para asegurar que todos los campos JSON estén deserializados
 * @param note Nota a procesar
 * @returns Nota con campos deserializados
 */
export function processNoteFields(note: NoteBase): NoteBase & { parsedTags: string[] } {
  return {
    ...note,
    parsedTags: deserializeTags(note.tags)
  };
}