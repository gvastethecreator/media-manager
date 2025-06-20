/**
 * @file Funciones de mapeo para la entidad Note
 * @module transformers/note/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { NoteBase, NoteCreateInput, NoteFilters, NoteSearchOptions, NoteUpdateInput } from '@/types/entities/note';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('NoteMappers');

/**
 * 🔄 Mapea datos de creación de nota a formato compatible con Prisma.
 * Las relaciones (IDs) se deben gestionar en la capa de servicio.
 */
export function mapCreateNoteDataToPrisma(data: NoteCreateInput): Prisma.NoteCreateInput {
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
			...rest,
			content: rest.content ?? '',
			category: rest.category ?? 'general',
			priority: rest.priority ?? 0,
			status: rest.status ?? 'draft',
			isFavorite: rest.isFavorite ?? false,
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación de nota', { error, data });
		throw new Error('Error al mapear datos de creación de nota.');
	}
}

/**
 * 🔄 Mapea datos de actualización de nota a formato compatible con Prisma.
 * Retorna un objeto con data e include para ser usado en update
 */
export function mapUpdateNoteDataToPrisma(id: string, data: NoteUpdateInput): {
	data: Prisma.NoteUpdateInput;
	include: any;
} {
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
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		};
	} catch (error) {
		logger.error('Error mapeando datos de actualización de nota', { error, data });
		throw new Error('Error al mapear datos de actualización de nota.');
	}
}

/**
 * 🔄 Mapea un objeto Note de Prisma a nuestro tipo canónico NoteBase.
 */
export function fromPrismaNote(note: Prisma.NoteGetPayload<null>): NoteBase {
	if (!note) {
		throw new Error('Se requiere un objeto de nota de Prisma para la transformación.');
	}
	return note;
}

/**
 * 🔄 Mapea opciones de búsqueda de Note a formato Prisma.
 */
export function mapNoteSearchOptionsToPrisma(options: NoteSearchOptions): Prisma.NoteFindManyArgs {
	const { where, include, ...rest } = options;

	return {
		...rest,
		where: where ? mapNoteFiltersToPrisma(where) : undefined,
		include: include ? { ...include, _count: include._count ?? true } : undefined,
	};
}

/**
 * 🔄 Mapea filtros de Note a condiciones where de Prisma.
 */
export function mapNoteFiltersToPrisma(filters: NoteFilters): Prisma.NoteWhereInput {
	const where: Prisma.NoteWhereInput = {};

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
	// a través de subconsultas, lo cual se omite aquí por simplicidad
	// y debería ser manejado por la lógica de servicio si es necesario.

	return where;
}

/**
 * 🔄 Convierte datos de entrada a formato de creación
 * Alias para compatibilidad con exportaciones esperadas
 */
export function toCreateNoteData(data: NoteCreateInput): Prisma.NoteCreateInput {
	return mapCreateNoteDataToPrisma(data);
}

/**
 * 🔄 Convierte datos de entrada a formato de actualización
 * Alias para compatibilidad con exportaciones esperadas
 */
export function toUpdateNoteData(id: string, data: NoteUpdateInput) {
	return mapUpdateNoteDataToPrisma(id, data);
}
