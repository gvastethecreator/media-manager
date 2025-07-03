/**
 * @file Funciones de mapeo para la entidad Note
 * @module transformers/note/mappers
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { NoteCreateInput, NoteFilters, NoteSearchOptions, NoteUpdateInput } from '@/types/entities/note';

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
export function mapUpdateNoteDataToDrizzle(
	id: string,
	data: NoteUpdateInput
): DrizzleUpdateResult {
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

// Mantener funciones legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar mapCreateNoteDataToDrizzle
 */
export const mapCreateNoteDataToPrisma = mapCreateNoteDataToDrizzle;

/**
 * @deprecated Usar mapUpdateNoteDataToDrizzle
 */
export const mapUpdateNoteDataToPrisma = mapUpdateNoteDataToDrizzle;

/**
 * @deprecated Usar mapNoteSearchOptionsToDrizzle
 */
export const mapNoteSearchOptionsToPrisma = mapNoteSearchOptionsToDrizzle;

/**
 * @deprecated Usar mapNoteFiltersToDrizzle
 */
export const mapNoteFiltersToPrisma = mapNoteFiltersToDrizzle;

// Aliases para compatibilidad con exportaciones esperadas
export const toCreateNoteData = mapCreateNoteDataToDrizzle;
export const toUpdateNoteData = mapUpdateNoteDataToDrizzle;
