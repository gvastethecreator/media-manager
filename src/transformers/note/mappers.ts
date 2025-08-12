/**
 * @file Funciones de mapeo para la entidad Note
 * @module transformers/note/mappers

 */

import { createDefaultEntityStats } from '@/lib/utils';
import { serverLogger } from '../../lib/logger/server-logger';
import type {
	NoteCreateInput,
	NoteFilters,
	NoteSearchOptions,
	NoteStatistics,
	NoteUpdateInput,
} from '../../types/entities/note';

const logger = serverLogger.withContext('NoteMappers');

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleCreateNoteData = {
	title: string;
	content: string;
	category: string;
	priority: number;
	status: string;
	isFavorite: boolean;
};

type DrizzleUpdateNoteData = Partial<DrizzleCreateNoteData>;

type DrizzleWhereFilter = {
	AND?: DrizzleWhereFilter[];
	OR?: DrizzleWhereFilter[];
	title?: { contains?: string; equals?: string };
	content?: { contains?: string; equals?: string };
	category?: { in?: string[] };
	priority?: { in?: number[] };
	status?: { in?: string[] };
	isFavorite?: boolean;
};

type DrizzleFindManyArgs = {
	where?: DrizzleWhereFilter;
	orderBy?: { [key: string]: 'asc' | 'desc' };
	skip?: number;
	take?: number;
};

type DrizzleUpdateResult = {
	data: DrizzleUpdateNoteData;
	// Los includes se manejan por separado en Drizzle
};

/**
 * 🔄 Mapea datos de creación de nota a formato compatible con Drizzle.
 * Las relaciones (IDs) se deben gestionar en la capa de servicio.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapCreateNoteDataToDrizzle(data: NoteCreateInput): DrizzleCreateNoteData {
	try {
		const {
			images,
			videos,
			albums,
			collections,
			tags,
			characters,
			places,
			worldItems,
			concepts,
			prompts,
			wildcards,
			properties,
			groups,
			...rest
		} = data;

		const drizzleData: DrizzleCreateNoteData = {
			...rest,
			content: rest.content ?? '',
			category: rest.category ?? 'general',
			priority: rest.priority ?? 0,
			status: rest.status ?? 'draft',
			isFavorite: rest.isFavorite ?? false,
		};

		// Las relaciones se manejan por separado en Drizzle con junction tables
		return drizzleData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de nota', { error, data });
		throw new Error('Error al mapear datos de creación de nota.');
	}
}

/**
 * 🔄 Mapea datos de actualización de nota a formato compatible con Drizzle.
 * Retorna un objeto con data para ser usado en update
 * ✅ MIGRADO A DRIZZLE
 */
export function mapUpdateNoteDataToDrizzle(_id: string, data: NoteUpdateInput): DrizzleUpdateResult {
	try {
		const {
			images,
			videos,
			albums,
			collections,
			tags,
			characters,
			places,
			worldItems,
			concepts,
			prompts,
			wildcards,
			properties,
			groups,
			...rest
		} = data;

		return {
			data: rest,
			// Los includes se manejan por separado en Drizzle con joins
		};
	} catch (error) {
		logger.error('Error mapeando datos de actualización de nota', { error, data });
		throw new Error('Error al mapear datos de actualización de nota.');
	}
}

/**
 * 🔄 Mapea opciones de búsqueda de Note a formato Drizzle.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapNoteSearchOptionsToDrizzle(options: NoteSearchOptions): DrizzleFindManyArgs {
	const { where, include, ...rest } = options;

	return {
		...rest,
		where: where ? mapNoteFiltersToDrizzle(where) : undefined,
		// Los includes se manejan por separado en Drizzle
	};
}

/**
 * 🔄 Mapea filtros de Note a condiciones where de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapNoteFiltersToDrizzle(filters: NoteFilters): DrizzleWhereFilter {
	const where: DrizzleWhereFilter = {};

	if (filters.searchQuery) {
		where.OR = [{ title: { contains: filters.searchQuery } }, { content: { contains: filters.searchQuery } }];
	}

	if (filters.categories?.length) {
		where.category = { in: filters.categories };
	}

	if (filters.priorities?.length) {
		where.priority = { in: filters.priorities };
	}

	if (filters.statuses?.length) {
		where.status = { in: filters.statuses };
	}

	if (filters.onlyFavorites) {
		where.isFavorite = true;
	}

	// El filtrado por relaciones (hasTags, hasImages, etc.) debe hacerse
	// a través de joins separados en Drizzle, lo cual se omite aquí por simplicidad
	// y debería ser manejado por la lógica de servicio si es necesario.

	return where;
}

// Aliases para compatibilidad con exportaciones esperadas
export const toCreateNoteData = mapCreateNoteDataToDrizzle;
export const toUpdateNoteData = mapUpdateNoteDataToDrizzle;

/**
 * 🔄 Transforma una nota con conteos a NoteWithStats
 * ✅ MIGRADO A DRIZZLE
 */
export function toNoteWithStats(note: any): any {
	try {
		// Calcular estadísticas básicas
		const wordCount = note.content ? note.content.split(/\s+/).length : 0;
		const characterCount = note.content ? note.content.length : 0;
		const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 palabras por minuto

		// Calcular puntuación de completitud
		let completenessScore = 0;
		if (note.title) {
			completenessScore += 20;
		}
		if (note.content) {
			completenessScore += 30;
		}
		if (note.summary) {
			completenessScore += 15;
		}
		if (note.category) {
			completenessScore += 10;
		}
		if (note.priority !== null && note.priority !== undefined) {
			completenessScore += 10;
		}
		if (note.status) {
			completenessScore += 10;
		}
		if (note.featuredImage) {
			completenessScore += 5;
		}

		// Extraer conteos de relaciones
		const counts = note._count || {};
		const imageCount = counts.images || 0;
		const videoCount = counts.videos || 0;
		const albumCount = counts.albums || 0;
		const collectionCount = counts.collections || 0;
		const tagCount = counts.tags || 0;
		const characterCountStat = counts.characters || 0;
		const placeCount = counts.places || 0;
		const worldItemCount = counts.worldItems || 0;
		const conceptCount = counts.concepts || 0;
		const promptCount = counts.prompts || 0;
		const wildcardCount = counts.wildcards || 0;
		const propertyCount = counts.properties || 0;
		const groupCount = counts.groups || 0;

		const statistics = {
			...createDefaultEntityStats(),
			imageCount,
			videoCount,
			albumCount,
			collectionCount,
			tagCount,
			characterCount: characterCountStat,
			placeCount,
			worldItemCount,
			conceptCount,
			promptCount,
			noteCount: 0,
			wildcardCount,
			propertyCount,
			groupCount,
			wordCount,
			readingTime,
			completionScore: completenessScore,
			totalItems: imageCount + videoCount + albumCount + collectionCount,
			totalAssociations:
				imageCount +
				videoCount +
				albumCount +
				collectionCount +
				tagCount +
				characterCountStat +
				placeCount +
				worldItemCount +
				conceptCount +
				promptCount +
				wildcardCount +
				propertyCount +
				groupCount,
			lastUpdated: note.updatedAt || new Date(),
			isDirectory: false,
			isFile: true,
		} as NoteStatistics;

		// Campos derivados
		const excerpt =
			note.summary || (note.content ? note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '') : '');
		const formattedDate = note.createdAt ? new Date(note.createdAt).toLocaleDateString() : '';
		const priorityLabel = getPriorityLabel(note.priority || 0);
		const statusLabel = getStatusLabel(note.status || 'draft');
		const categoryLabel = getCategoryLabel(note.category || 'general');

		return {
			...note,
			entityType: 'note' as const,
			// Propiedades requeridas para compatibilidad con AnyEntityWithStats
			name: note.title,
			description: note.summary || note.content || null,
			stats: statistics,
			excerpt,
			formattedDate,
			priorityLabel,
			statusLabel,
			categoryLabel,
			_count: {
				images: imageCount,
				videos: videoCount,
				albums: albumCount,
				collections: collectionCount,
				tags: tagCount,
				characters: characterCountStat,
				places: placeCount,
				worldItems: worldItemCount,
				concepts: conceptCount,
				prompts: promptCount,
				wildcards: wildcardCount,
				properties: propertyCount,
				groups: groupCount,
			},
		};
	} catch (error) {
		logger.error('Error transformando nota con stats:', error);
		// Retornar al menos la nota original en caso de error
		return note;
	}
}

// Funciones auxiliares para etiquetas
function getPriorityLabel(priority: number): string {
	const labels = ['Muy Baja', 'Baja', 'Media', 'Alta', 'Muy Alta'];
	return labels[priority] || 'Media';
}

function getStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		draft: 'Borrador',
		active: 'Activa',
		completed: 'Completada',
		archived: 'Archivada',
		pending: 'Pendiente',
	};
	return labels[status] || 'Borrador';
}

function getCategoryLabel(category: string): string {
	const labels: Record<string, string> = {
		general: 'General',
		story: 'Historia',
		lore: 'Lore',
		mechanics: 'Mecánicas',
		character: 'Personaje',
		place: 'Lugar',
		world_item: 'Objeto del Mundo',
		prompt: 'Prompt',
		idea: 'Idea',
		todo: 'Por Hacer',
	};
	return labels[category] || 'General';
}
