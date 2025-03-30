/**
 * @file Funciones de mapeo para la entidad Place
 * @module transformers/place/mappers
 */

import type {
    PlaceComplete,
    PlaceCreateInput,
    PlaceFilters,
    PlaceSearchOptions,
    PlaceUpdateInput,
    RelatedPlace
} from '@/types/entities/place/types';
import { createLogger } from '@/utils/logger';
import type { Prisma } from '@prisma/client';
import {
    toPrismaPlace
} from './serializers';

// Logger específico para el transformer de Place
const log = createLogger('place-mapper');

/**
 * 🔄 Mapea datos de creación de lugar a formato compatible con Prisma
 * @param data Datos de creación de lugar
 * @returns Objeto formateado para Prisma
 */
export function mapCreatePlaceDataToPrisma(data: PlaceCreateInput): Prisma.PlaceCreateInput {
	try {
		// Convertir a formato Prisma base
		const prismaData = toPrismaPlace(data) as Record<string, any>;

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

		if (data.notes && data.notes.length > 0) {
			relations.notes = {
				connect: data.notes.map(note => ({ id: typeof note === 'string' ? note : note.id }))
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
		} as Prisma.PlaceCreateInput;
	} catch (error) {
		log.error('Error mapeando datos de creación de lugar', { error, data });
		throw new Error(`Error mapeando datos de creación de lugar: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea datos de actualización de lugar a formato compatible con Prisma
 * @param placeId ID del lugar a actualizar
 * @param data Datos de actualización
 * @returns Objeto formateado para Prisma
 */
export function mapUpdatePlaceDataToPrisma(placeId: string, data: PlaceUpdateInput): Prisma.PlaceUpdateArgs {
	try {
		// Convertir a formato Prisma base
		const prismaData = toPrismaPlace(data) as Record<string, any>;

		// Manejar relaciones si existen
		const relations: Record<string, any> = {};

		// Relaciones opcionales
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

		if (data.notes) {
			relations.notes = {
				set: data.notes.map(note => ({ id: typeof note === 'string' ? note : note.id }))
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
			where: { id: placeId },
			data: {
				...prismaData,
				...relations
			}
		};
	} catch (error) {
		log.error('Error mapeando datos de actualización de lugar', { error, data });
		throw new Error(`Error mapeando datos de actualización de lugar: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea opciones de búsqueda a formato compatible con Prisma
 * @param options Opciones de búsqueda
 * @returns Objeto formateado para Prisma
 */
export function mapPlaceSearchOptionsToPrisma(options: PlaceSearchOptions): Prisma.PlaceFindManyArgs {
	try {
		// Construir objeto para Prisma
		const prismaOptions: Prisma.PlaceFindManyArgs = {};

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
			prismaOptions.where = mapPlaceFiltersToPrisma(options.where);
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

			if (options.include.worldItems) {
				prismaOptions.include.worldItems = true;
			}

			if (options.include.concepts) {
				prismaOptions.include.concepts = true;
			}

			if (options.include.prompts) {
				prismaOptions.include.prompts = true;
			}

			if (options.include.notes) {
				prismaOptions.include.notes = true;
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
 * 🔄 Mapea filtros de lugar a formato compatible con Prisma
 * @param filters Filtros de búsqueda
 * @returns Objeto formateado para Prisma
 */
export function mapPlaceFiltersToPrisma(filters: PlaceFilters): Prisma.PlaceWhereInput {
	try {
		const prismaWhere: Prisma.PlaceWhereInput = {};
		const AND: Prisma.PlaceWhereInput[] = [];

		// Búsqueda por texto
		if (filters.searchQuery) {
			AND.push({
				OR: [
					{ name: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ description: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ region: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ type: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ climate: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ government: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ lore: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ history: { contains: filters.searchQuery, mode: 'insensitive' } }
				]
			});
		}

		// Filtrar por categorías
		if (filters.categories && filters.categories.length > 0) {
			AND.push({
				category: { in: filters.categories }
			});
		}

		// Filtrar por regiones
		if (filters.regions && filters.regions.length > 0) {
			const regionConditions = filters.regions.map(region => ({
				region: { contains: region }
			}));
			AND.push({ OR: regionConditions });
		}

		// Filtrar por tipos
		if (filters.types && filters.types.length > 0) {
			AND.push({
				type: { in: filters.types }
			});
		}

		// Filtrar por climas
		if (filters.climates && filters.climates.length > 0) {
			AND.push({
				climate: { in: filters.climates }
			});
		}

		// Filtrar por rango de población
		if (filters.populationRange) {
			if (filters.populationRange.min !== undefined) {
				AND.push({ population: { gte: filters.populationRange.min } });
			}

			if (filters.populationRange.max !== undefined) {
				AND.push({ population: { lte: filters.populationRange.max } });
			}
		}

		// Filtrar por gobiernos
		if (filters.governments && filters.governments.length > 0) {
			const govConditions = filters.governments.map(government => ({
				government: { contains: government }
			}));
			AND.push({ OR: govConditions });
		}

		// Filtrar por favoritos
		if (filters.onlyFavorites) {
			AND.push({ isFavorite: true });
		}

		// Filtrar por relaciones existentes
		if (filters.hasImages) {
			AND.push({
				images: {
					some: {}
				}
			});
		}

		if (filters.hasNotes) {
			AND.push({
				notes: {
					some: {}
				}
			});
		}

		if (filters.hasConcepts) {
			AND.push({
				concepts: {
					some: {}
				}
			});
		}

		if (filters.hasPrompts) {
			AND.push({
				prompts: {
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
		log.error('Error mapeando filtros de lugar', { error, filters });
		throw new Error(`Error mapeando filtros de lugar: ${(error as Error).message}`);
	}
}

/**
 * 🔗 Mapea un lugar a formato para lugar relacionado
 * @param place Lugar completo a mapear
 * @param count Conteo de relación
 * @param strength Fuerza de la relación
 * @returns Objeto de lugar relacionado
 */
export function mapPlaceToRelatedPlace(
	place: PlaceComplete,
	count = 1,
	strength = 1
): RelatedPlace {
	return {
		id: place.id,
		name: place.name,
		emoji: place.emoji,
		color: place.color,
		category: place.category || undefined,
		region: place.region || undefined,
		type: place.type || undefined,
		count,
		strength
	};
}

/**
 * Genera un color aleatorio para un lugar basado en su nombre y categoría
 * @param name Nombre del lugar
 * @param category Categoría del lugar
 * @returns Color en formato hexadecimal
 */
export function generatePlaceColor(name: string, category?: string | null): string {
	// Paleta de colores para categorías comunes
	const categoryColors: Record<string, string> = {
		settlement: '#4a90e2', // Azul
		landscape: '#50c878', // Verde esmeralda
		structure: '#a05a2c', // Marrón
		biome: '#228b22', // Verde bosque
		underground: '#654321', // Marrón oscuro
		mythical: '#9370db', // Violeta
		historical: '#cd853f', // Marrón claro
		other: '#708090', // Gris pizarra
	};

	// Si hay una categoría y existe en nuestra paleta, usar ese color
	if (category && categoryColors[category.toLowerCase()]) {
		return categoryColors[category.toLowerCase()];
	}

	// Si no hay categoría o no está en la paleta, generar color basado en el nombre
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}

	// Convertir a color hexadecimal
	let color = '#';
	for (let i = 0; i < 3; i++) {
		const value = (hash >> (i * 8)) & 0xff;
		color += ('00' + value.toString(16)).substr(-2);
	}

	return color;
}

/**
 * Genera un emoji sugerido para un lugar basado en su tipo/categoría
 * @param type Tipo del lugar
 * @param category Categoría del lugar
 * @returns Emoji sugerido
 */
export function suggestPlaceEmoji(type?: string | null, category?: string | null): string {
	// Emojis por tipo de lugar
	const typeEmojis: Record<string, string> = {
		city: '🏙️',
		town: '🏘️',
		village: '🏡',
		ruin: '🏚️',
		castle: '🏰',
		fortress: '🗿',
		dungeon: '⚔️',
		cave: '🕳️',
		forest: '🌲',
		mountain: '⛰️',
		valley: '🏞️',
		island: '🏝️',
		lake: '🌊',
		river: '🌊',
		ocean: '🌊',
		desert: '🏜️',
		tundra: '❄️',
		jungle: '🌴',
		swamp: '🐊',
	};

	// Emojis por categoría
	const categoryEmojis: Record<string, string> = {
		settlement: '🏠',
		landscape: '🏞️',
		structure: '🏛️',
		biome: '🌿',
		underground: '⛏️',
		mythical: '✨',
		historical: '📜',
		other: '📍',
	};

	// Primero intentar por tipo (más específico)
	if (type && typeEmojis[type.toLowerCase()]) {
		return typeEmojis[type.toLowerCase()];
	}

	// Luego intentar por categoría
	if (category && categoryEmojis[category.toLowerCase()]) {
		return categoryEmojis[category.toLowerCase()];
	}

	// Emoji por defecto
	return '📍';
}

/**
 * Genera un nombre completo para un lugar que incluye su jerarquía
 * @param name Nombre del lugar
 * @param region Región del lugar
 * @returns Nombre completo con jerarquía
 */
export function getCompleteLocationName(name: string, region?: string | null): string {
	if (!region) return name;

	const regionParts = region.split(/[\/|>]/).map(r => r.trim());
	const lastRegion = regionParts[regionParts.length - 1];

	return `${name}, ${lastRegion}`;
}
