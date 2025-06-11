import { deserializeTags } from '@/transformers/note/serializers';
import type { NoteComplete, NoteFilters, NoteBase } from '@/types/entities/note/types';
import type { NoteSortOption } from '@/types/entities/note/enums';

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
export function filterNotes(notes: NoteComplete[], filters: NoteFilters): NoteComplete[] {
        return notes.filter((note) => {
                const parsedTags = (note as any).parsedTags || deserializeTags(note.tags);

                // Filtro por búsqueda en título y contenido
                if (filters.searchQuery && filters.searchQuery.trim() !== '') {
                        const search = filters.searchQuery.toLowerCase();
                        const matchesTitle = note.title.toLowerCase().includes(search);
                        const matchesContent = (note.content || '').toLowerCase().includes(search);

			if (!matchesTitle && !matchesContent) {
				return false;
			}
		}

		// Filtro por categoría
                if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(note.category)) {
                        return false;
                }

                // Filtro por estado
                if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes(note.status)) {
                        return false;
                }

                // Filtro por prioridad
                if (filters.priorities && filters.priorities.length > 0 && !filters.priorities.includes(note.priority)) {
                        return false;
                }

                // Filtro por tags
                if (filters.hasTags && parsedTags.length === 0) {
                        return false;
                }
                if (filters.contentContains && !note.content.toLowerCase().includes(filters.contentContains.toLowerCase())) {
                        return false;
                }

		// Filtro por favoritos
		if (filters.onlyFavorites && !note.isFavorite) {
			return false;
		}

		// Filtro por rango de fechas
                // Nota: NoteFilters actual no incluye rango de fechas

                return true;
        });
}

/**
 * Ordena un array de notas según el criterio especificado
 * @param notes Array de notas a ordenar
 * @param sortBy Criterio de ordenación
 * @returns Array de notas ordenadas
 */
export function sortNotes(notes: NoteComplete[], sortBy: NoteSortOption): NoteComplete[] {
        const sorters: Record<NoteSortOption, (a: NoteComplete, b: NoteComplete) => number> = {
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
		status_desc: (a, b) => (b.status || '').localeCompare(a.status || ''),
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
        notes: NoteComplete[],
        property: K
): Record<string, NoteComplete[]> {
	return notes.reduce(
		(groups, note) => {
			const key = String(note[property] || 'undefined');
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(note);
			return groups;
		},
                {} as Record<string, NoteComplete[]>
	);
}

/**
 * Calcula estadísticas sobre un conjunto de notas
 * @param notes Array de notas
 * @returns Objeto con estadísticas
 */
export function calculateNoteStats(notes: NoteComplete[]) {
	const totalNotes = notes.length;
	const byStatus = groupNotesByProperty(notes, 'status');
	const byCategory = groupNotesByProperty(notes, 'category');
	const byPriority = groupNotesByProperty(notes, 'priority');
	const favorites = notes.filter((note) => note.isFavorite).length;

	const wordCount = notes.reduce((total, note) => total + (note.wordCount || 0), 0);

	return {
		totalNotes,
		byStatus,
		byCategory,
		byPriority,
		favorites,
		wordCount,
	};
}
