/**
 * @file Adaptador de compatibilidad para Note
 * @module transformers/note/note-adapter
 * @description Convierte entre NoteComplete y NoteWithStats para mantener compatibilidad
 */

import type {
	NoteCategory,
	NoteComplete,
	NotePriority,
	NoteStatistics,
	NoteStatus,
	NoteWithStats,
} from '@/types/entities/note';

/**
 * 🔄 Convierte NoteComplete a NoteWithStats
 * @param note - Nota en formato NoteComplete
 * @returns Nota en formato NoteWithStats optimizado
 */
export function adaptNoteCompleteToWithStats(note: NoteComplete): NoteWithStats {
	// Si ya es NoteWithStats, devolverlo tal como está
	if ('statistics' in note && note.statistics) {
		return note as NoteWithStats;
	}

	// Calcular estadísticas desde _count
	const counts = note._count || {};
	const totalItems = Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);

	// Calcular métricas de contenido
	const content = note.content || '';
	const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
	const characterCount = content.length;
	const readingTime = Math.ceil(wordCount / 200); // ~200 palabras por minuto

	// Calcular completion score
	const completionScore = calculateCompletionScore(note, totalItems);

	const statistics: NoteStatistics = {
		totalItems,
		totalImages: counts.images || 0,
		totalVideos: counts.videos || 0,
		totalAlbums: counts.albums || 0,
		totalCollections: counts.collections || 0,
		totalTags: counts.tags || 0,
		totalCharacters: counts.characters || 0,
		totalPlaces: counts.places || 0,
		totalWorldItems: counts.worldItems || 0,
		totalConcepts: counts.concepts || 0,
		totalPrompts: counts.prompts || 0,
		totalWildcards: counts.wildcards || 0,
		totalProperties: counts.properties || 0,
		totalGroups: counts.groups || 0,
		wordCount,
		characterCount,
		readingTime,
		completionScore,
		lastUpdated: new Date(),
	};

	return {
		id: note.id,
		title: note.title,
		content: note.content,
		category: note.category,
		priority: note.priority,
		status: note.status,
		color: note.color,
		emoji: note.emoji,
		featuredImage: note.featuredImage,
		isFavorite: note.isFavorite,
		presetId: note.presetId,
		createdAt: note.createdAt,
		updatedAt: note.updatedAt,
		statistics,
		// Campos derivados
		excerpt: generateExcerpt(content),
		formattedDate: formatDate(note.updatedAt),
		priorityLabel: getPriorityLabel(note.priority),
		statusLabel: getStatusLabel(note.status),
		categoryLabel: getCategoryLabel(note.category),
	};
}

/**
 * 🔄 Convierte array de NoteComplete a NoteWithStats
 */
export function adaptNotesCompleteToWithStats(notes: NoteComplete[]): NoteWithStats[] {
	return notes.map(adaptNoteCompleteToWithStats);
}

/**
 * 📊 Calcula score de completitud de la nota (0-100)
 */
function calculateCompletionScore(note: NoteComplete, totalItems: number): number {
	let score = 0;

	// Contenido base (40 puntos)
	if (note.title && note.title.length > 0) score += 10;
	if (note.content && note.content.length > 50) score += 20;
	if (note.content && note.content.length > 200) score += 10;

	// Categorización (20 puntos)
	if (note.category && note.category !== 'general') score += 10;
	if (note.priority && note.priority > 0) score += 5;
	if (note.status && note.status !== 'draft') score += 5;

	// Metadatos (20 puntos)
	if (note.featuredImage) score += 10;
	if (note.color) score += 5;
	if (note.emoji) score += 5;

	// Relaciones (20 puntos)
	if (totalItems > 0) score += 10;
	if (totalItems > 5) score += 5;
	if (totalItems > 10) score += 5;

	return Math.min(score, 100);
}

/**
 * 📝 Genera excerpt automático del contenido
 */
function generateExcerpt(content: string, maxLength = 150): string {
	if (!content) return '';

	const cleaned = content.replace(/[#*_`]/g, '').trim();
	if (cleaned.length <= maxLength) return cleaned;

	const truncated = cleaned.substring(0, maxLength);
	const lastSpace = truncated.lastIndexOf(' ');

	return lastSpace > maxLength * 0.8 ? `${truncated.substring(0, lastSpace)}...` : `${truncated}...`;
}

/**
 * 📅 Formatea fecha para mostrar
 */
function formatDate(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return 'Hoy';
	if (diffDays === 1) return 'Ayer';
	if (diffDays < 7) return `Hace ${diffDays} días`;
	if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;

	return date.toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

/**
 * 🏷️ Obtiene etiqueta legible de prioridad
 */
function getPriorityLabel(priority: number): string {
	switch (priority) {
		case NotePriority.HIGHEST:
			return 'Crítica';
		case NotePriority.HIGH:
			return 'Alta';
		case NotePriority.MEDIUM:
			return 'Media';
		case NotePriority.LOW:
			return 'Baja';
		case NotePriority.LOWEST:
			return 'Mínima';
		default:
			return 'Sin definir';
	}
}

/**
 * 📊 Obtiene etiqueta legible de estado
 */
function getStatusLabel(status: string): string {
	switch (status) {
		case NoteStatus.ACTIVE:
			return 'Activa';
		case NoteStatus.DRAFT:
			return 'Borrador';
		case NoteStatus.COMPLETED:
			return 'Completada';
		case NoteStatus.ARCHIVED:
			return 'Archivada';
		case NoteStatus.PENDING:
			return 'Pendiente';
		default:
			return 'Sin estado';
	}
}

/**
 * 📂 Obtiene etiqueta legible de categoría
 */
function getCategoryLabel(category: string): string {
	switch (category) {
		case NoteCategory.GENERAL:
			return 'General';
		case NoteCategory.STORY:
			return 'Historia';
		case NoteCategory.LORE:
			return 'Lore';
		case NoteCategory.MECHANICS:
			return 'Mecánicas';
		case NoteCategory.CHARACTER:
			return 'Personaje';
		case NoteCategory.PLACE:
			return 'Lugar';
		case NoteCategory.WORLD_ITEM:
			return 'Objeto';
		case NoteCategory.PROMPT:
			return 'Prompt';
		case NoteCategory.IDEA:
			return 'Idea';
		case NoteCategory.TODO:
			return 'Tarea';
		default:
			return 'Sin categoría';
	}
}
