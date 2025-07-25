/**
 * @file Transformer optimizado para la entidad Note
 * @module transformers/note/transformer

 * 🎯 Patrón: Solo conteos, sin relaciones completas para máximo rendimiento
 */

import type {
	NoteCategory,
	NoteComplete,
	NoteCreateInput,
	NotePriority,
	NoteStatistics,
	NoteStatus,
	NoteUpdateInput,
	NoteWithStats,
} from '@/types/entities/note';

/**
 * 📝 Convierte datos de Drizzle con conteos a NoteWithStats optimizado
 * @param data - Datos de la base de datos con _count
 * @returns Note optimizado con estadísticas pre-calculadas
 */
export function fromDrizzleNoteWithCounts(data: NoteComplete): NoteWithStats {
	const statistics = calculateNoteStatistics(data);

	return {
		id: data.id,
		title: data.title,
		content: data.content,
		summary: data.summary,
		emoji: data.emoji,
		color: data.color,
		category: data.category,
		priority: data.priority,
		status: data.status,
		featuredImage: data.featuredImage,
		isFavorite: data.isFavorite,
		presetId: data.presetId,
		createdAt: data.createdAt,
		updatedAt: data.updatedAt,
		entityType: 'note' as const,
		// Propiedades requeridas para compatibilidad con AnyEntityWithStats
		name: data.title, // Alias para title
		description: data.summary || generateExcerpt(data.content), // Alias para summary o excerpt
		stats: statistics,
		_count: {
			images: data._count?.images || 0,
			videos: data._count?.videos || 0,
			albums: data._count?.albums || 0,
			collections: data._count?.collections || 0,
			tags: data._count?.tags || 0,
			characters: data._count?.characters || 0,
			places: data._count?.places || 0,
			worldItems: data._count?.worldItems || 0,
			concepts: data._count?.concepts || 0,
			prompts: data._count?.prompts || 0,
			wildcards: data._count?.wildcards || 0,
			properties: data._count?.properties || 0,
			groups: data._count?.groups || 0,
		},
	};
}

/**
 * 📊 Calcula estadísticas completas para una nota
 */
function calculateNoteStatistics(data: NoteComplete): NoteStatistics {
	const imageCount = data._count?.images || 0;
	const videoCount = data._count?.videos || 0;
	const albumCount = data._count?.albums || 0;
	const collectionCount = data._count?.collections || 0;
	const tagCount = data._count?.tags || 0;
	const characterCount = data._count?.characters || 0;
	const placeCount = data._count?.places || 0;
	const worldItemCount = data._count?.worldItems || 0;
	const conceptCount = data._count?.concepts || 0;
	const promptCount = data._count?.prompts || 0;
	const wildcardCount = data._count?.wildcards || 0;
	const propertyCount = data._count?.properties || 0;
	const groupCount = data._count?.groups || 0;

	const totalItems =
		imageCount +
		videoCount +
		albumCount +
		collectionCount +
		tagCount +
		characterCount +
		placeCount +
		worldItemCount +
		conceptCount +
		promptCount +
		wildcardCount +
		propertyCount +
		groupCount;
	const totalAssociations = totalItems;
	const wordCount = calculateWordCount(data.content);
	const readingTime = Math.ceil(wordCount / 200); // ~200 palabras por minuto
	const completionScore = calculateCompletionScore(data, totalItems);

	return {
		imageCount,
		videoCount,
		albumCount,
		collectionCount,
		tagCount,
		characterCount,
		placeCount,
		worldItemCount,
		conceptCount,
		promptCount,
		wildcardCount,
		propertyCount,
		groupCount,
		wordCount,
		readingTime,
		completionScore,
		totalItems,
		totalAssociations,
	};
}

/**
 * 📊 Calcula score de completitud de la nota (0-100)
 */
function calculateCompletionScore(data: NoteComplete, totalItems: number): number {
	let score = 0;

	// Contenido base (40 puntos)
	if (data.title.length > 0) score += 10;
	if (data.content.length > 50) score += 20;
	if (data.content.length > 200) score += 10;

	// Categorización (20 puntos)
	if (data.category && data.category !== 'general') score += 10;
	if (data.priority > 0) score += 5;
	if (data.status !== 'draft') score += 5;

	// Metadatos (20 puntos)
	if (data.featuredImage) score += 10;
	if (data.color) score += 5;
	if (data.emoji) score += 5;

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

/**
 * 📊 Calcula número de palabras en el contenido
 */
function calculateWordCount(content: string): number {
	if (!content) return 0;
	return content
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;
}

/**
 * 🔄 Convierte NoteCreateInput a formato Drizzle
 */
export function toDrizzleNoteCreate(input: NoteCreateInput) {
	return {
		title: input.title,
		content: input.content || '',
		category: input.category || NoteCategory.GENERAL,
		priority: input.priority || NotePriority.MEDIUM,
		status: input.status || NoteStatus.DRAFT,
		color: input.color,
		emoji: input.emoji,
		featuredImage: input.featuredImage,
		isFavorite: input.isFavorite || false,
		presetId: input.presetId,
		// Relaciones se manejan por separado
	};
}

/**
 * 🔄 Convierte NoteUpdateInput a formato Drizzle
 */
export function toDrizzleNoteUpdate(input: NoteUpdateInput) {
	const updateData: Record<string, any> = {};

	if (input.title !== undefined) updateData.title = input.title;
	if (input.content !== undefined) updateData.content = input.content;
	if (input.category !== undefined) updateData.category = input.category;
	if (input.priority !== undefined) updateData.priority = input.priority;
	if (input.status !== undefined) updateData.status = input.status;
	if (input.color !== undefined) updateData.color = input.color;
	if (input.emoji !== undefined) updateData.emoji = input.emoji;
	if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage;
	if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;
	if (input.presetId !== undefined) updateData.presetId = input.presetId;

	return updateData;
}

// Alias para compatibilidad con importaciones esperadas
