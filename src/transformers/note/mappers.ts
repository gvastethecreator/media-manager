/**
 * @file Funciones de mapeo para la entidad Note
 * @module transformers/note/mappers
 */

import type {
    NoteComplete,
    NoteCreateInput,
    NoteFilters,
    NoteSearchOptions,
    NoteUpdateInput,
    RelatedNote
} from '@/types/entities/note/types';
import { createLogger } from '@/utils/logger';
import { Prisma } from '@prisma/client';
import { toPrismaNote } from './serializers';

// Logger específico para el transformer de Note
const log = createLogger('note-mapper');

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
		log.error('Error mapeando datos de creación de nota', { error, data });
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
		if (data.images) {
			relations.images = {
				set: data.images.map(img => ({ id: typeof img === 'string' ? img : img.id }))
			};
		}

		if (data.videos) {
			relations.videos = {
				set: data.videos.map(vid => ({ id: typeof vid === 'string' ? vid : vid.id }))
			};
		}

		if (data.albums) {
			relations.albums = {
				set: data.albums.map(album => ({ id: typeof album === 'string' ? album : album.id }))
			};
		}

		if (data.collections) {
			relations.collections = {
				set: data.collections.map(collection => ({ id: typeof collection === 'string' ? collection : collection.id }))
			};
		}

		if (data.tags) {
			relations.tags = {
				set: data.tags.map(tag => ({ id: typeof tag === 'string' ? tag : tag.id }))
			};
		}

		if (data.characters) {
			relations.characters = {
				set: data.characters.map(character => ({ id: typeof character === 'string' ? character : character.id }))
			};
		}

		if (data.places) {
			relations.places = {
				set: data.places.map(place => ({ id: typeof place === 'string' ? place : place.id }))
			};
		}

		if (data.worldItems) {
			relations.worldItems = {
				set: data.worldItems.map(item => ({ id: typeof item === 'string' ? item : item.id }))
			};
		}

		if (data.concepts) {
			relations.concepts = {
				set: data.concepts.map(concept => ({ id: typeof concept === 'string' ? concept : concept.id }))
			};
		}

		if (data.prompts) {
			relations.prompts = {
				set: data.prompts.map(prompt => ({ id: typeof prompt === 'string' ? prompt : prompt.id }))
			};
		}

		if (data.wildcards) {
			relations.wildcards = {
				set: data.wildcards.map(wildcard => ({ id: typeof wildcard === 'string' ? wildcard : wildcard.id }))
			};
		}

		if (data.properties) {
			relations.properties = {
				set: data.properties.map(property => ({ id: typeof property === 'string' ? property : property.id }))
			};
		}

		if (data.groups) {
			relations.groups = {
				set: data.groups.map(group => ({ id: typeof group === 'string' ? group : group.id }))
			};
		}

		// Combinar datos base con relaciones
		return {
			where: { id: noteId },
			data: {
				...prismaData,
				...relations
			}
		};
	} catch (error) {
		log.error('Error mapeando datos de actualización de nota', { error, data });
		throw new Error(`Error mapeando datos de actualización de nota: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea opciones de búsqueda a formato compatible con Prisma
 * @param options Opciones de búsqueda
 * @returns Objeto formateado para Prisma
 */
export function mapNoteSearchOptionsToPrisma(options: NoteSearchOptions): Prisma.NoteFindManyArgs {
	try {
		// Construir objeto para Prisma
		const prismaOptions: Prisma.NoteFindManyArgs = {};

		// Paginación
		if (options.skip !== undefined) {
			prismaOptions.skip = options.skip;
		}

		if (options.take !== undefined) {
			prismaOptions.take = options.take;
		}

		// Ordenamiento
		if (options.orderBy) {
			prismaOptions.orderBy = options.orderBy as any;
		}

		// Filtros
		if (options.where) {
			prismaOptions.where = mapNoteFiltersToPrisma(options.where);
		}

		// Incluir relaciones
		if (options.include) {
			prismaOptions.include = {};

			// Verificar cada relación individual
			if (options.include.images) {
				prismaOptions.include.images = true;
			}

			if (options.include.videos) {
				prismaOptions.include.videos = true;
			}

			if (options.include.albums) {
				prismaOptions.include.albums = true;
			}

			if (options.include.collections) {
				prismaOptions.include.collections = true;
			}

			if (options.include.tags) {
				prismaOptions.include.tags = true;
			}

			if (options.include.characters) {
				prismaOptions.include.characters = true;
			}

			if (options.include.places) {
				prismaOptions.include.places = true;
			}

			if (options.include.worldItems) {
				prismaOptions.include.worldItems = true;
			}

			if (options.include.concepts) {
				prismaOptions.include.concepts = true;
			}

			if (options.include.prompts) {
				prismaOptions.include.prompts = true;
			}

			if (options.include.wildcards) {
				prismaOptions.include.wildcards = true;
			}

			if (options.include.properties) {
				prismaOptions.include.properties = true;
			}

			if (options.include.groups) {
				prismaOptions.include.groups = true;
			}

			if (options.include._count) {
				prismaOptions.include._count = true;
			}
		}

		return prismaOptions;
	} catch (error) {
		log.error('Error mapeando opciones de búsqueda', { error, options });
		throw new Error(`Error mapeando opciones de búsqueda: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea filtros de nota a formato compatible con Prisma
 * @param filters Filtros de búsqueda
 * @returns Objeto formateado para Prisma
 */
export function mapNoteFiltersToPrisma(filters: NoteFilters): Prisma.NoteWhereInput {
	try {
		const prismaWhere: Prisma.NoteWhereInput = {};
		const AND: Prisma.NoteWhereInput[] = [];

		// Búsqueda por texto
		if (filters.searchQuery) {
			AND.push({
				OR: [
					{ title: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ content: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ category: { contains: filters.searchQuery, mode: 'insensitive' } }
				]
			});
		}

		// Filtrar por categorías
		if (filters.categories && filters.categories.length > 0) {
			AND.push({
				category: { in: filters.categories }
			});
		}

		// Filtrar por prioridades
		if (filters.priorities && filters.priorities.length > 0) {
			AND.push({
				priority: { in: filters.priorities }
			});
		}

		// Filtrar por estados
		if (filters.statuses && filters.statuses.length > 0) {
			AND.push({
				status: { in: filters.statuses }
			});
		}

		// Filtrar por contenido específico
		if (filters.contentContains) {
			AND.push({
				content: { contains: filters.contentContains, mode: 'insensitive' }
			});
		}

		// Filtrar por favoritos
		if (filters.onlyFavorites) {
			AND.push({ isFavorite: true });
		}

		// Filtrar por relaciones existentes
		if (filters.hasTags) {
			AND.push({
				tags: {
					not: {
						equals: '{"items":[]}'
					}
				}
			});
		}

		if (filters.hasImages) {
			AND.push({
				images: {
					some: {}
				}
			});
		}

		if (filters.hasVideos) {
			AND.push({
				videos: {
					some: {}
				}
			});
		}

		// Combinar todos los filtros con AND
		if (AND.length > 0) {
			prismaWhere.AND = AND;
		}

		return prismaWhere;
	} catch (error) {
		log.error('Error mapeando filtros de nota', { error, filters });
		throw new Error(`Error mapeando filtros de nota: ${(error as Error).message}`);
	}
}

/**
 * 🔗 Mapea una nota a formato para nota relacionada
 * @param note Nota completa a mapear
 * @param count Conteo de relación
 * @param strength Fuerza de la relación
 * @returns Objeto de nota relacionada
 */
export function mapNoteToRelatedNote(
	note: NoteComplete,
	count: number = 1,
	strength: number = 1
): RelatedNote {
	// Calcular un extracto básico si no existe
	const excerpt = note.excerpt || (
		note.content && note.content.length > 100
			? `${note.content.substring(0, 100)}...`
			: note.content || ''
	);

	return {
		id: note.id,
		title: note.title,
		excerpt,
		category: note.category,
		count,
		strength
	};
}

// Exportar funciones obsoletas con alias para mantener compatibilidad
export const toCreateNoteData = (data: any): any => {
	log.warn('Función obsoleta: toCreateNoteData. Usar mapCreateNoteDataToPrisma en su lugar.');
	return mapCreateNoteDataToPrisma(data);
};

export const toUpdateNoteData = (data: any): any => {
	log.warn('Función obsoleta: toUpdateNoteData. Usar mapUpdateNoteDataToPrisma en su lugar.');
	const { id, ...updateData } = data;
	return mapUpdateNoteDataToPrisma(id, updateData).data;
};
