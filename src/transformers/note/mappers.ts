/**
 * @file Funciones de mapeo para la entidad Note
 * @module transformers/note/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    NoteComplete,
    NoteCreateInput,
    NoteFilters,
    NoteSearchOptions,
    NoteUpdateInput,
    RelatedNote
} from '@/types/entities/note/types';
import type { Prisma } from '@prisma/client';
import { toPrismaNote } from './serializers';

// Logger específico para el transformer de Note
const logger = serverLogger.withContext('NoteMappers');

/**
 * 🔄 Mapea datos de creación de nota a formato compatible con Prisma
 * @param data Datos de creación de nota
 * @returns Objeto formateado para Prisma
 */
export function mapCreateNoteDataToPrisma(data: NoteCreateInput): Prisma.NoteCreateInput {
	try {
		// Convertir a formato Prisma base
		const prismaData = toPrismaNote(data) as Record<string, any>;

		// Manejar relaciones si existen
		const relations: Record<string, any> = {};

		// Relaciones opcionales
		if (data.images && data.images.length > 0) {
			relations.images = {
				connect: data.images.map(img => ({ id: typeof img === 'string' ? img : img.id }))
			};
		}

		if (data.videos && data.videos.length > 0) {
			relations.videos = {
				connect: data.videos.map(vid => ({ id: typeof vid === 'string' ? vid : vid.id }))
			};
		}

		if (data.albums && data.albums.length > 0) {
			relations.albums = {
				connect: data.albums.map(album => ({ id: typeof album === 'string' ? album : album.id }))
			};
		}

		if (data.collections && data.collections.length > 0) {
			relations.collections = {
				connect: data.collections.map(collection => ({ id: typeof collection === 'string' ? collection : collection.id }))
			};
		}

		if (data.tags && data.tags.length > 0) {
			relations.tags = {
				connect: data.tags.map(tag => ({ id: typeof tag === 'string' ? tag : tag.id }))
			};
		}

		if (data.characters && data.characters.length > 0) {
			relations.characters = {
				connect: data.characters.map(character => ({ id: typeof character === 'string' ? character : character.id }))
			};
		}

		if (data.places && data.places.length > 0) {
			relations.places = {
				connect: data.places.map(place => ({ id: typeof place === 'string' ? place : place.id }))
			};
		}

		if (data.worldItems && data.worldItems.length > 0) {
			relations.worldItems = {
				connect: data.worldItems.map(item => ({ id: typeof item === 'string' ? item : item.id }))
			};
		}

		if (data.concepts && data.concepts.length > 0) {
			relations.concepts = {
				connect: data.concepts.map(concept => ({ id: typeof concept === 'string' ? concept : concept.id }))
			};
		}

		if (data.prompts && data.prompts.length > 0) {
			relations.prompts = {
				connect: data.prompts.map(prompt => ({ id: typeof prompt === 'string' ? prompt : prompt.id }))
			};
		}

		if (data.wildcards && data.wildcards.length > 0) {
			relations.wildcards = {
				connect: data.wildcards.map(wildcard => ({ id: typeof wildcard === 'string' ? wildcard : wildcard.id }))
			};
		}

		if (data.properties && data.properties.length > 0) {
			relations.properties = {
				connect: data.properties.map(property => ({ id: typeof property === 'string' ? property : property.id }))
			};
		}

		if (data.groups && data.groups.length > 0) {
			relations.groups = {
				connect: data.groups.map(group => ({ id: typeof group === 'string' ? group : group.id }))
			};
		}

		// Combinar datos base con relaciones
		return {
			...prismaData,
			...relations
		} as Prisma.NoteCreateInput;
	} catch (error) {
		logger.error('Error mapeando datos de creación de nota', { error, data });
		throw new Error(`Error mapeando datos de creación de nota: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea datos de actualización de nota a formato compatible con Prisma
 * @param noteId ID de la nota a actualizar
 * @param data Datos de actualización
 * @returns Objeto formateado para Prisma
 */
export function mapUpdateNoteDataToPrisma(noteId: string, data: NoteUpdateInput): Prisma.NoteUpdateArgs {
	try {
		// Convertir a formato Prisma base
		const prismaData = toPrismaNote(data) as Record<string, any>;

		// Manejar relaciones si existen
		const relations: Record<string, any> = {};

		// Relaciones opcionales - usar set para reemplazar relaciones existentes
		if (data.images !== undefined) {
			relations.images = {
				set: data.images.map(img => ({ id: typeof img === 'string' ? img : img.id }))
			};
		}

		if (data.videos !== undefined) {
			relations.videos = {
				set: data.videos.map(vid => ({ id: typeof vid === 'string' ? vid : vid.id }))
			};
		}

		if (data.albums !== undefined) {
			relations.albums = {
				set: data.albums.map(album => ({ id: typeof album === 'string' ? album : album.id }))
			};
		}

		if (data.collections !== undefined) {
			relations.collections = {
				set: data.collections.map(collection => ({ id: typeof collection === 'string' ? collection : collection.id }))
			};
		}

		if (data.tags !== undefined) {
			relations.tags = {
				set: data.tags.map(tag => ({ id: typeof tag === 'string' ? tag : tag.id }))
			};
		}

		if (data.characters !== undefined) {
			relations.characters = {
				set: data.characters.map(character => ({ id: typeof character === 'string' ? character : character.id }))
			};
		}

		if (data.places !== undefined) {
			relations.places = {
				set: data.places.map(place => ({ id: typeof place === 'string' ? place : place.id }))
			};
		}

		if (data.worldItems !== undefined) {
			relations.worldItems = {
				set: data.worldItems.map(item => ({ id: typeof item === 'string' ? item : item.id }))
			};
		}

		if (data.concepts !== undefined) {
			relations.concepts = {
				set: data.concepts.map(concept => ({ id: typeof concept === 'string' ? concept : concept.id }))
			};
		}

		if (data.prompts !== undefined) {
			relations.prompts = {
				set: data.prompts.map(prompt => ({ id: typeof prompt === 'string' ? prompt : prompt.id }))
			};
		}

		if (data.wildcards !== undefined) {
			relations.wildcards = {
				set: data.wildcards.map(wildcard => ({ id: typeof wildcard === 'string' ? wildcard : wildcard.id }))
			};
		}

		if (data.properties !== undefined) {
			relations.properties = {
				set: data.properties.map(property => ({ id: typeof property === 'string' ? property : property.id }))
			};
		}

		if (data.groups !== undefined) {
			relations.groups = {
				set: data.groups.map(group => ({ id: typeof group === 'string' ? group : group.id }))
			};
		}

		// Incluir relaciones en la consulta para devolverlas
		const include: Record<string, boolean> = {};

		// Usar for...of en lugar de forEach para mejor manejo de errores
		for (const key of Object.keys(relations)) {
			include[key] = true;
		}

		// Configurar opciones para Prisma
		return {
			where: { id: noteId },
			data: {
				...prismaData,
				...relations
			},
			include: Object.keys(include).length > 0 ? {
				...include,
				_count: {
					select: Object.keys(include).reduce((acc, key) => {
						acc[key] = true;
						return acc;
					}, {} as Record<string, boolean>)
				}
			} : undefined
		};
	} catch (error) {
		logger.error('Error mapeando datos de actualización de nota', { error, data });
		throw new Error(`Error mapeando datos de actualización de nota: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea opciones de búsqueda a formato compatible con Prisma
 * @param options Opciones de búsqueda
 * @returns Argumentos para Prisma.findMany
 */
export function mapNoteSearchOptionsToPrisma(options: NoteSearchOptions): Prisma.NoteFindManyArgs {
	try {
		const {
			page = 1,
			pageSize = 25,
			sortBy = 'updatedAt',
			sortOrder = 'desc',
			includeRelations = false
		} = options;

		// Calcular skip & take para paginación
		const skip = (page - 1) * pageSize;
		const take = pageSize;

		// Configurar ordenación
		const orderBy = { [sortBy]: sortOrder };

		// Configurar inclusión de relaciones
		const include = includeRelations ? {
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
		} : undefined;

		// Devolver argumentos de Prisma
		return {
			skip,
			take,
			orderBy,
			include
		};
	} catch (error) {
		logger.error('Error mapeando opciones de búsqueda', { error, options });
		// Valores por defecto en caso de error
		return {
			skip: 0,
			take: 25,
			orderBy: { updatedAt: 'desc' }
		};
	}
}

/**
 * 🔄 Mapea filtros de búsqueda a condiciones where de Prisma
 * @param filters Filtros de búsqueda
 * @returns Condiciones where para Prisma
 */
export function mapNoteFiltersToPrisma(filters: NoteFilters): Prisma.NoteWhereInput {
	try {
		const where: Prisma.NoteWhereInput = {};

		// Filtro por texto (búsqueda global)
		if (filters.search) {
			where.OR = [
				{ title: { contains: filters.search, mode: 'insensitive' } },
				{ content: { contains: filters.search, mode: 'insensitive' } },
				{ tags: { contains: filters.search, mode: 'insensitive' } }
			];
		}

		// Filtro de estado
		if (filters.status) {
			where.status = filters.status;
		}

		// Filtro por título exacto
		if (filters.title) {
			where.title = filters.title;
		}

		// Filtro por color
		if (filters.color) {
			where.color = filters.color;
		}

		// Filtro por emoji
		if (filters.emoji) {
			where.emoji = filters.emoji;
		}

		// Filtro por categoría
		if (filters.category) {
			where.category = filters.category;
		}

		// Filtro por favoritos
		if (filters.favorite !== undefined) {
			where.favorite = filters.favorite;
		}

		// Filtro por fecha de creación
		if (filters.createdAfter) {
			where.createdAt = {
				...(where.createdAt || {}),
				gte: new Date(filters.createdAfter)
			};
		}

		if (filters.createdBefore) {
			where.createdAt = {
				...(where.createdAt || {}),
				lte: new Date(filters.createdBefore)
			};
		}

		// Filtro por fecha de actualización
		if (filters.updatedAfter) {
			where.updatedAt = {
				...(where.updatedAt || {}),
				gte: new Date(filters.updatedAfter)
			};
		}

		if (filters.updatedBefore) {
			where.updatedAt = {
				...(where.updatedAt || {}),
				lte: new Date(filters.updatedBefore)
			};
		}

		// Filtros de relaciones
		if (filters.groupId) {
			where.groups = { some: { id: filters.groupId } };
		}

		if (filters.albumId) {
			where.albums = { some: { id: filters.albumId } };
		}

		if (filters.collectionId) {
			where.collections = { some: { id: filters.collectionId } };
		}

		if (filters.tagId) {
			where.tags = { some: { id: filters.tagId } };
		}

		if (filters.characterId) {
			where.characters = { some: { id: filters.characterId } };
		}

		if (filters.placeId) {
			where.places = { some: { id: filters.placeId } };
		}

		if (filters.promptId) {
			where.prompts = { some: { id: filters.promptId } };
		}

		return where;
	} catch (error) {
		logger.error('Error mapeando filtros a formato Prisma', { error, filters });
		return {};
	}
}

/**
 * 🔄 Mapea una nota a una referencia para uso en relaciones
 * @param note Nota completa
 * @param count Contador de asociaciones
 * @param strength Fuerza de la relación
 * @returns Nota en formato para relaciones
 */
export function mapNoteToRelatedNote(
	note: NoteComplete,
	count = 1,
	strength = 1
): RelatedNote {
	try {
		return {
			id: note.id,
			title: note.title || 'Sin título',
			color: note.color || '#3b82f6',
			emoji: note.emoji || '📝',
			type: 'note',
			count,
			strength,
			updatedAt: note.updatedAt,
			category: note.category
		};
	} catch (error) {
		logger.error('Error mapeando nota a relacionada', { error, note });
		return {
			id: note.id,
			title: 'Error',
			color: '#3b82f6',
			emoji: '📝',
			type: 'note',
			count: 0,
			strength: 0,
			updatedAt: new Date(),
			category: 'error'
		};
	}
}

/**
 * @deprecated Usa mapCreateNoteDataToPrisma en su lugar
 */
export function toCreateNoteData(data: NoteCreateInput): Prisma.NoteCreateInput {
	return mapCreateNoteDataToPrisma(data);
}

/**
 * @deprecated Usa mapUpdateNoteDataToPrisma en su lugar
 */
export function toUpdateNoteData(id: string, data: NoteUpdateInput): Prisma.NoteUpdateArgs {
	return mapUpdateNoteDataToPrisma(id, data);
}

/**
 * @deprecated Usa las funciones específicas en su lugar
 * Objeto con las funciones de mapeo para compatibilidad
 */
export const NoteMappers = {
	mapCreateData: mapCreateNoteDataToPrisma,
	mapUpdateData: mapUpdateNoteDataToPrisma,
	mapSearchOptions: mapNoteSearchOptionsToPrisma,
	mapFilters: mapNoteFiltersToPrisma,
	mapToRelated: mapNoteToRelatedNote,
	toCreateNoteData,
	toUpdateNoteData
};

// Exportar como default para compatibilidad
export default NoteMappers;
