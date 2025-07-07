/**
 * @file Utilidades helper para la entidad Note optimizada
 * @module utils/note/helpers
 * @description Funciones de utilidad optimizadas usando NoteWithStats
 */

import type { NoteFilters, NoteWithStats } from '@/types/entities/note/types';
import { NoteSortOption } from '@/types/entities/note/enums';

/**
 * 🔍 Filtra notas basado en criterios específicos
 */
export function filterNotes(notes: NoteWithStats[], filters: NoteFilters): NoteWithStats[] {
	return notes.filter((note) => {
		// Filtro de búsqueda por texto
		if (filters.searchQuery) {
			const searchQuery = filters.searchQuery.toLowerCase();
			const matchesTitle = note.title.toLowerCase().includes(searchQuery);
			const matchesContent = note.content.toLowerCase().includes(searchQuery);
			const matchesExcerpt = note.excerpt.toLowerCase().includes(searchQuery);

			if (!matchesTitle && !matchesContent && !matchesExcerpt) {
				return false;
			}
		}

		// Filtro por categorías
		if (filters.categories?.length && !filters.categories.includes(note.category)) {
			return false;
		}

		// Filtro por prioridades
		if (filters.priorities?.length && !filters.priorities.includes(note.priority)) {
			return false;
		}

		// Filtro por estados
		if (filters.statuses?.length && !filters.statuses.includes(note.status)) {
			return false;
		}

		// Filtro solo favoritos
		if (filters.onlyFavorites && !note.isFavorite) {
			return false;
		}

		// Filtro por contenido específico
		if (filters.contentContains && !note.content.toLowerCase().includes(filters.contentContains.toLowerCase())) {
			return false;
		}

		// Filtro por notas con tags
		if (filters.hasTags && note.statistics.totalTags === 0) {
			return false;
		}

		// Filtro por notas con imágenes
		if (filters.hasImages && note.statistics.totalImages === 0) {
			return false;
		}

		// Filtro por notas con videos
		if (filters.hasVideos && note.statistics.totalVideos === 0) {
			return false;
		}

		return true;
	});
}

/**
 * 📊 Ordena notas según el criterio especificado
 */
export function sortNotes(notes: NoteWithStats[], sortBy: NoteSortOption): NoteWithStats[] {
	const sorters: Record<NoteSortOption, (a: NoteWithStats, b: NoteWithStats) => number> = {
		[NoteSortOption.TITLE_ASC]: (a, b) => a.title.localeCompare(b.title),
		[NoteSortOption.TITLE_DESC]: (a, b) => b.title.localeCompare(a.title),
		[NoteSortOption.PRIORITY_ASC]: (a, b) => a.priority - b.priority,
		[NoteSortOption.PRIORITY_DESC]: (a, b) => b.priority - a.priority,
		[NoteSortOption.STATUS_ASC]: (a, b) => a.status.localeCompare(b.status),
		[NoteSortOption.STATUS_DESC]: (a, b) => b.status.localeCompare(a.status),
		[NoteSortOption.CREATED_ASC]: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
		[NoteSortOption.CREATED_DESC]: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		[NoteSortOption.UPDATED_ASC]: (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
		[NoteSortOption.UPDATED_DESC]: (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
		[NoteSortOption.CATEGORY_ASC]: (a, b) => a.category.localeCompare(b.category),
		[NoteSortOption.CATEGORY_DESC]: (a, b) => b.category.localeCompare(a.category),
	};

	const sorter = sorters[sortBy];
	if (!sorter) {
		console.warn(`⚠️ Criterio de ordenamiento no reconocido: ${sortBy}`);
		return notes;
	}

	return [...notes].sort(sorter);
}

/**
 * 📂 Agrupa notas por un campo específico
 */
export function groupNotes(
	notes: NoteWithStats[],
	groupBy: keyof Pick<NoteWithStats, 'category' | 'status' | 'priority'>
): Record<string, NoteWithStats[]> {
	return notes.reduce(
		(groups, note) => {
			const key = String(note[groupBy]);
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(note);
			return groups;
		},
		{} as Record<string, NoteWithStats[]>
	);
}

/**
 * 📊 Obtiene estadísticas de una nota específica
 */
export function getNoteStats(note: NoteWithStats) {
	return {
		totalRelations: note.statistics.totalItems,
		wordCount: note.statistics.wordCount,
		characterCount: note.statistics.characterCount,
		readingTime: note.statistics.readingTime,
		completionScore: note.statistics.completionScore,
		hasMedia: note.statistics.totalImages > 0 || note.statistics.totalVideos > 0,
		hasRelations: note.statistics.totalItems > 0,
		isFavorite: note.isFavorite,
		priorityLabel: note.priorityLabel,
		statusLabel: note.statusLabel,
		categoryLabel: note.categoryLabel,
		lastUpdated: note.statistics.lastUpdated,
	};
}

/**
 * 🔍 Busca notas que coincidan con un término de búsqueda
 */
export function searchNotes(notes: NoteWithStats[], searchTerm: string): NoteWithStats[] {
	if (!searchTerm.trim()) return notes;

	const term = searchTerm.toLowerCase();

	return notes.filter((note) => {
		// Búsqueda en campos principales
		const matchesTitle = note.title.toLowerCase().includes(term);
		const matchesContent = note.content.toLowerCase().includes(term);
		const matchesExcerpt = note.excerpt.toLowerCase().includes(term);
		const matchesCategory = note.category.toLowerCase().includes(term);

		// Búsqueda en etiquetas derivadas
		const matchesPriorityLabel = note.priorityLabel.toLowerCase().includes(term);
		const matchesStatusLabel = note.statusLabel.toLowerCase().includes(term);
		const matchesCategoryLabel = note.categoryLabel.toLowerCase().includes(term);

		return (
			matchesTitle ||
			matchesContent ||
			matchesExcerpt ||
			matchesCategory ||
			matchesPriorityLabel ||
			matchesStatusLabel ||
			matchesCategoryLabel
		);
	});
}

/**
 * 📈 Obtiene estadísticas agregadas de un conjunto de notas
 */
export function getNotesAggregateStats(notes: NoteWithStats[]) {
	const totalNotes = notes.length;

	if (totalNotes === 0) {
		return {
			totalNotes: 0,
			totalWords: 0,
			totalCharacters: 0,
			totalReadingTime: 0,
			averageCompletionScore: 0,
			totalRelations: 0,
			favoriteCount: 0,
			categoryCounts: {},
			statusCounts: {},
			priorityCounts: {},
		};
	}

	const stats = notes.reduce(
		(acc, note) => {
			acc.totalWords += note.statistics.wordCount;
			acc.totalCharacters += note.statistics.characterCount;
			acc.totalReadingTime += note.statistics.readingTime;
			acc.totalCompletionScore += note.statistics.completionScore;
			acc.totalRelations += note.statistics.totalItems;

			if (note.isFavorite) acc.favoriteCount++;

			// Conteos por categoría
			acc.categoryCounts[note.category] = (acc.categoryCounts[note.category] || 0) + 1;

			// Conteos por estado
			acc.statusCounts[note.status] = (acc.statusCounts[note.status] || 0) + 1;

			// Conteos por prioridad
			acc.priorityCounts[note.priority] = (acc.priorityCounts[note.priority] || 0) + 1;

			return acc;
		},
		{
			totalWords: 0,
			totalCharacters: 0,
			totalReadingTime: 0,
			totalCompletionScore: 0,
			totalRelations: 0,
			favoriteCount: 0,
			categoryCounts: {} as Record<string, number>,
			statusCounts: {} as Record<string, number>,
			priorityCounts: {} as Record<number, number>,
		}
	);

	return {
		totalNotes,
		totalWords: stats.totalWords,
		totalCharacters: stats.totalCharacters,
		totalReadingTime: stats.totalReadingTime,
		averageCompletionScore: Math.round(stats.totalCompletionScore / totalNotes),
		totalRelations: stats.totalRelations,
		favoriteCount: stats.favoriteCount,
		categoryCounts: stats.categoryCounts,
		statusCounts: stats.statusCounts,
		priorityCounts: stats.priorityCounts,
	};
}

/**
 * 🔄 Compara dos notas para detectar cambios significativos
 */
export function compareNotes(noteA: NoteWithStats, noteB: NoteWithStats) {
	return {
		titleChanged: noteA.title !== noteB.title,
		contentChanged: noteA.content !== noteB.content,
		categoryChanged: noteA.category !== noteB.category,
		priorityChanged: noteA.priority !== noteB.priority,
		statusChanged: noteA.status !== noteB.status,
		favoriteChanged: noteA.isFavorite !== noteB.isFavorite,
		relationsChanged: noteA.statistics.totalItems !== noteB.statistics.totalItems,
		hasSignificantChanges: function () {
			return (
				this.titleChanged ||
				this.contentChanged ||
				this.categoryChanged ||
				this.priorityChanged ||
				this.statusChanged ||
				this.favoriteChanged
			);
		},
	};
}

/**
 * 🎯 Encuentra notas relacionadas basándose en contenido y categorías
 */
export function findRelatedNotes(targetNote: NoteWithStats, allNotes: NoteWithStats[], limit = 5): NoteWithStats[] {
	if (allNotes.length <= 1) return [];

	const otherNotes = allNotes.filter((note) => note.id !== targetNote.id);

	// Calcular puntuación de similitud
	const scoredNotes = otherNotes.map((note) => {
		let score = 0;

		// Misma categoría (+30 puntos)
		if (note.category === targetNote.category) score += 30;

		// Misma prioridad (+20 puntos)
		if (note.priority === targetNote.priority) score += 20;

		// Mismo estado (+15 puntos)
		if (note.status === targetNote.status) score += 15;

		// Similitud en título (hasta 25 puntos)
		const titleWords = targetNote.title.toLowerCase().split(/\s+/);
		const noteWords = note.title.toLowerCase().split(/\s+/);
		const commonTitleWords = titleWords.filter((word) => noteWords.includes(word));
		score += Math.min(25, commonTitleWords.length * 5);

		// Similitud en contenido (hasta 10 puntos)
		const targetWords = targetNote.content.toLowerCase().split(/\s+/).slice(0, 50);
		const noteContentWords = note.content.toLowerCase().split(/\s+/).slice(0, 50);
		const commonContentWords = targetWords.filter((word) => noteContentWords.includes(word));
		score += Math.min(10, commonContentWords.length);

		return { note, score };
	});

	// Ordenar por puntuación y retornar las mejores
	return scoredNotes
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((item) => item.note);
}
