import type {
    NoteBase,
    NoteCreateInput,
    NoteExtended,
    NoteStats,
    NoteUpdateInput,
    NoteWithStats
} from '@/types/entities/note';
import { format } from 'date-fns';
import { processNoteFields, serializeTags } from './serializers';

/**
 * Transforma una nota básica a formato extendido para UI
 * @param note Nota base
 * @returns Nota extendida con propiedades adicionales para UI
 */
export function toNoteExtended(note: NoteBase): NoteExtended {
  const processedNote = processNoteFields(note);

  // Calcular excerpt del contenido
  const contentText = processedNote.content || '';
  const excerpt = contentText.length > 150
    ? `${contentText.substring(0, 150)}...`
    : contentText;

  // Calcular conteo de palabras
  const wordCount = contentText
    ? contentText.split(/\s+/).filter(Boolean).length
    : 0;

  return {
    ...processedNote,
    isSelected: false,
    isEditing: false,
    isNew: false,
    isExpanded: false,
    isHovered: false,
    formattedDate: format(
      new Date(processedNote.updatedAt),
      'dd/MM/yyyy HH:mm'
    ),
    excerpt,
    wordCount,
    // Propiedades calculadas adicionales
    relationsCount: 0
  };
}

/**
 * Transforma un array de notas básicas a formato extendido
 * @param notes Array de notas base
 * @returns Array de notas extendidas
 */
export function toNotesExtended(notes: NoteBase[]): NoteExtended[] {
  return notes.map(toNoteExtended);
}

/**
 * Convierte un objeto de nota con estadísticas a formato para UI
 * @param note Nota con estadísticas
 * @returns Nota extendida con estadísticas
 */
export function toNoteWithStats(note: NoteBase, stats?: Partial<NoteStats>): NoteWithStats {
  const defaultStats: NoteStats = {
    characters: 0,
    places: 0,
    worldItems: 0,
    concepts: 0,
    prompts: 0,
    images: 0
  };

  return {
    ...note,
    _count: {
      ...defaultStats,
      ...stats
    }
  };
}

/**
 * Prepara una nota para creación, serializando campos necesarios
 * @param note Datos para crear nota
 * @returns Objeto preparado para crear nota
 */
export function prepareNoteForCreate(note: NoteCreateInput): NoteCreateInput {
  return {
    ...note,
    tags: note.tags
      ? serializeTags(typeof note.tags === 'string' ? [note.tags] : note.tags as unknown as string[])
      : 'empty_array'
  };
}

/**
 * Prepara una nota para actualización, serializando campos necesarios
 * @param note Datos para actualizar nota
 * @returns Objeto preparado para actualizar nota
 */
export function prepareNoteForUpdate(note: NoteUpdateInput): NoteUpdateInput {
  const prepared: NoteUpdateInput = { ...note };

  // Solo serializar tags si está presente en el input
  if (note.tags !== undefined) {
    prepared.tags = serializeTags(
      typeof note.tags === 'string' ? [note.tags] : note.tags as unknown as string[]
    );
  }

  return prepared;
}