/**
 * @file Mappers para la entidad Note
 * @module entities/note/mappers
 */

import { logger } from '@/lib/logger';
import type { CreateNoteData, NoteSearchOptions, UpdateNoteData } from '@/types/entities/note/types';
import type { Prisma } from '@prisma/client';
import { serializeNoteTags } from './serializers';

/**
 * Mapea los datos de creación de una nota al formato de Prisma
 */
export function mapCreateNoteDataToPrisma(data: CreateNoteData): Prisma.NoteCreateInput {
	try {
		const { title, content, category, priority, status, tags, featuredImage, isFavorite, presetId, ...relations } =
			data;

		const prismaData: Prisma.NoteCreateInput = {
			title,
			content,
			category,
			priority,
			status,
			tags: tags ? serializeNoteTags({ items: tags }) : null,
			featuredImage,
			isFavorite: isFavorite ?? false,
			presetId,
		};

		// Mapear relaciones si existen
		if (relations.images?.length) {
			prismaData.images = { connect: relations.images.map((id) => ({ id })) };
		}
		if (relations.videos?.length) {
			prismaData.videos = { connect: relations.videos.map((id) => ({ id })) };
		}
		if (relations.albums?.length) {
			prismaData.albums = { connect: relations.albums.map((id) => ({ id })) };
		}
		if (relations.collections?.length) {
			prismaData.collections = { connect: relations.collections.map((id) => ({ id })) };
		}
		if (relations.characters?.length) {
			prismaData.characters = { connect: relations.characters.map((id) => ({ id })) };
		}
		if (relations.properties?.length) {
			prismaData.properties = { connect: relations.properties.map((id) => ({ id })) };
		}

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de nota:', error);
		throw error;
	}
}

/**
 * Mapea los datos de actualización de una nota al formato de Prisma
 */
export function mapUpdateNoteDataToPrisma(data: UpdateNoteData): Prisma.NoteUpdateInput {
	try {
		const { title, content, category, priority, status, tags, featuredImage, isFavorite, presetId, ...relations } =
			data;

		const prismaData: Prisma.NoteUpdateInput = {};

		// Solo incluir campos que están presentes
		if (title !== undefined) prismaData.title = title;
		if (content !== undefined) prismaData.content = content;
		if (category !== undefined) prismaData.category = category;
		if (priority !== undefined) prismaData.priority = priority;
		if (status !== undefined) prismaData.status = status;
		if (tags !== undefined) prismaData.tags = serializeNoteTags({ items: tags });
		if (featuredImage !== undefined) prismaData.featuredImage = featuredImage;
		if (isFavorite !== undefined) prismaData.isFavorite = isFavorite;
		if (presetId !== undefined) prismaData.presetId = presetId;

		// Mapear relaciones si existen
		if (relations.images?.length) {
			prismaData.images = { set: relations.images.map((id) => ({ id })) };
		}
		if (relations.videos?.length) {
			prismaData.videos = { set: relations.videos.map((id) => ({ id })) };
		}
		if (relations.albums?.length) {
			prismaData.albums = { set: relations.albums.map((id) => ({ id })) };
		}
		if (relations.collections?.length) {
			prismaData.collections = { set: relations.collections.map((id) => ({ id })) };
		}
		if (relations.characters?.length) {
			prismaData.characters = { set: relations.characters.map((id) => ({ id })) };
		}
		if (relations.properties?.length) {
			prismaData.properties = { set: relations.properties.map((id) => ({ id })) };
		}

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de nota:', error);
		throw error;
	}
}

/**
 * Mapea las opciones de búsqueda de notas al formato de Prisma
 */
export function mapNoteSearchOptionsToPrisma(options: NoteSearchOptions): Prisma.NoteFindManyArgs {
	try {
		const { take = 10, skip = 0, sortBy, filters, include } = options;

		const prismaOptions: Prisma.NoteFindManyArgs = {
			take,
			skip,
			orderBy: sortBy ? { [sortBy.replace(/Asc|Desc/g, '')]: sortBy.includes('Desc') ? 'desc' : 'asc' } : undefined,
			where: {},
			include: {
				_count: true,
				...(include?.images && { images: true }),
				...(include?.videos && { videos: true }),
				...(include?.albums && { albums: true }),
				...(include?.collections && { collections: true }),
				...(include?.characters && { characters: true }),
				...(include?.properties && { properties: true }),
			},
		};

		// Aplicar filtros si existen
		if (filters) {
			const { searchQuery, categories, priorities, statuses, onlyFavorites, contentContains } = filters;

			if (searchQuery) {
				prismaOptions.where.OR = [
					{ title: { contains: searchQuery, mode: 'insensitive' } },
					{ content: { contains: searchQuery, mode: 'insensitive' } },
				];
			}

			if (categories?.length) {
				prismaOptions.where.category = { in: categories };
			}

			if (priorities?.length) {
				prismaOptions.where.priority = { in: priorities };
			}

			if (statuses?.length) {
				prismaOptions.where.status = { in: statuses };
			}

			if (onlyFavorites) {
				prismaOptions.where.isFavorite = true;
			}

			if (contentContains) {
				prismaOptions.where.content = { contains: contentContains, mode: 'insensitive' };
			}
		}

		return prismaOptions;
	} catch (error) {
		logger.error('Error mapeando opciones de búsqueda de notas:', error);
		throw error;
	}
}
