import { deserializeTags } from '@/transformers/note';
import type { NoteBase, NoteExtended, NoteFilters, NoteSortOption } from '@/types/entities/note';

/**
 * Genera un ID único para notas
 * @returns ID único para nota
 */
export function generateNoteId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Filtra un array de notas según los criterios de filtrado
 * @param notes Array de notas a filtrar
 * @param filters Filtros a aplicar
 * @returns Array de notas filtradas
 */
export function filterNotes(
  notes: NoteExtended[],
  filters: NoteFilters
): NoteExtended[] {
  return notes.filter(note => {
    const parsedTags = note.parsedTags || deserializeTags(note.tags);

    // Filtro por búsqueda en título y contenido
    if (filters.search && filters.search.trim() !== '') {
      const search = filters.search.toLowerCase();
      const matchesTitle = note.title.toLowerCase().includes(search);
      const matchesContent = (note.content || '').toLowerCase().includes(search);

      if (!matchesTitle && !matchesContent) {
        return false;
      }
    }

    // Filtro por categoría
    if (filters.category && note.category !== filters.category) {
      return false;
    }

    // Filtro por estado
    if (filters.status && note.status !== filters.status) {
      return false;
    }

    // Filtro por prioridad
    if (filters.priority !== undefined && note.priority !== filters.priority) {
      return false;
    }

    // Filtro por tags
    if (filters.tags.length > 0) {
      const hasAllTags = filters.tags.every(tag =>
        parsedTags.includes(tag)
      );

      if (!hasAllTags) {
        return false;
      }
    }

    // Filtro por favoritos
    if (filters.onlyFavorites && !note.isFavorite) {
      return false;
    }

    // Filtro por rango de fechas
    if (filters.dateRange) {
      const noteDate = new Date(note.updatedAt);

      if (filters.dateRange.from && noteDate < filters.dateRange.from) {
        return false;
      }

      if (filters.dateRange.to && noteDate > filters.dateRange.to) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Ordena un array de notas según el criterio especificado
 * @param notes Array de notas a ordenar
 * @param sortBy Criterio de ordenación
 * @returns Array de notas ordenadas
 */
export function sortNotes(
  notes: NoteExtended[],
  sortBy: NoteSortOption
): NoteExtended[] {
  const sorters: Record<NoteSortOption, (a: NoteExtended, b: NoteExtended) => number> = {
    title_asc: (a, b) => a.title.localeCompare(b.title),
    title_desc: (a, b) => b.title.localeCompare(a.title),
    created_asc: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    created_desc: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    updated_asc: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    updated_desc: (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    priority_asc: (a, b) => (a.priority || 0) - (b.priority || 0),
    priority_desc: (a, b) => (b.priority || 0) - (a.priority || 0),
    category_asc: (a, b) => (a.category || '').localeCompare(b.category || ''),
    category_desc: (a, b) => (b.category || '').localeCompare(a.category || ''),
    status_asc: (a, b) => (a.status || '').localeCompare(b.status || ''),
    status_desc: (a, b) => (b.status || '').localeCompare(a.status || '')
  };

  return [...notes].sort(sorters[sortBy]);
}

/**
 * Agrupa notas por una propiedad específica
 * @param notes Array de notas a agrupar
 * @param property Propiedad por la cual agrupar
 * @returns Objeto con las notas agrupadas por la propiedad
 */
export function groupNotesByProperty<K extends keyof NoteBase>(
  notes: NoteExtended[],
  property: K
): Record<string, NoteExtended[]> {
  return notes.reduce((groups, note) => {
    const key = String(note[property] || 'undefined');
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(note);
    return groups;
  }, {} as Record<string, NoteExtended[]>);
}

/**
 * Calcula estadísticas sobre un conjunto de notas
 * @param notes Array de notas
 * @returns Objeto con estadísticas
 */
export function calculateNoteStats(notes: NoteExtended[]) {
  const totalNotes = notes.length;
  const byStatus = groupNotesByProperty(notes, 'status');
  const byCategory = groupNotesByProperty(notes, 'category');
  const byPriority = groupNotesByProperty(notes, 'priority');
  const favorites = notes.filter(note => note.isFavorite).length;

  const wordCount = notes.reduce((total, note) =>
    total + (note.wordCount || 0), 0
  );

  return {
    totalNotes,
    byStatus,
    byCategory,
    byPriority,
    favorites,
    wordCount
  };
}