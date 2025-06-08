/**
 * @file Funciones de mapeo para la entidad Character
 * @module transformers/character/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
	CharacterComplete,
	CharacterPrismaCreateInput,
	CharacterPrismaFindManyArgs,
	CharacterPrismaInclude,
	CharacterPrismaOrderByWithRelationInput,
	CharacterPrismaUpdateInput,
	CharacterPrismaWhereInput,
	CharacterSearchOptions,
} from '@/types/entities/character/types';
import { TransformerError } from '@/utils/transformers/errors';

/**
 * 🔄 Mapea opciones de búsqueda a formato Prisma
 * @param options Opciones de búsqueda
 * @returns Opciones formateadas para Prisma
 */
export function mapCharacterSearchOptionsToPrisma(options: CharacterSearchOptions = {}): CharacterPrismaFindManyArgs {
	try {
		const { filters = {}, page = 1, pageSize = 20, include, orderBy: customOrderBy } = options;

		// Calcular skip y take para paginación
		const skip = (page - 1) * pageSize;
		const take = pageSize;

		// Construir cláusula where
		const where: CharacterPrismaWhereInput = {};

		// Procesar filtros específicos
		if (filters.name) {
			where.name = { contains: filters.name, mode: 'insensitive' };
		}

		if (filters.class) {
			where.class = { equals: filters.class };
		}

		if (filters.race) {
			where.race = { equals: filters.race };
		}

		if (filters.minLevel) {
			where.level = { gte: filters.minLevel };
		}

		if (filters.maxLevel) {
			where.level = { ...(where.level || {}), lte: filters.maxLevel };
		}

		if (filters.category) {
			where.category = { equals: filters.category };
		}

		if (filters.isFavorite) {
			where.isFavorite = true;
		}

		if (filters.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: 'insensitive' } },
				{ description: { contains: filters.search, mode: 'insensitive' } },
				{ psychologicalProfile: { contains: filters.search, mode: 'insensitive' } },
				{ socialProfile: { contains: filters.search, mode: 'insensitive' } },
				{ backstory: { contains: filters.search, mode: 'insensitive' } },
			];
		}

		// Procesamiento de ordenación
		const orderBy: CharacterPrismaOrderByWithRelationInput = customOrderBy || { createdAt: 'desc' };

		// Procesamiento de inclusiones/relaciones
		const includeRelations: CharacterPrismaInclude = {};

		if (include?.images) {
			includeRelations.images = true;
		}

		if (include?.videos) {
			includeRelations.videos = true;
		}

		if (include?.collections) {
			includeRelations.collections = true;
		}

		if (include?.albums) {
			includeRelations.albums = true;
		}

		if (include?.tags) {
			includeRelations.tags = true;
		}

		if (include?.places) {
			includeRelations.places = true;
		}

		if (include?.worldItems) {
			includeRelations.worldItems = true;
		}

		if (include?.concepts) {
			includeRelations.concepts = true;
		}

		if (include?.prompts) {
			includeRelations.prompts = true;
		}

		if (include?.notes) {
			includeRelations.notes = true;
		}

		if (include?.relatedCharacters) {
			includeRelations.relatedCharacters = true;
		}

		if (include?.count) {
			includeRelations._count = true;
		}

		// Devolver opciones formateadas para Prisma
		return {
			where,
			orderBy,
			skip,
			take,
			include: Object.keys(includeRelations).length > 0 ? includeRelations : undefined,
		};
	} catch (error) {
		serverLogger.error(`Error mapeando opciones de búsqueda: ${error}`);
		throw new TransformerError(`Error mapeando opciones de búsqueda: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea datos de creación a formato Prisma
 * @param data Datos para crear un Character
 * @returns Datos formateados para Prisma create
 */
export function mapCreateCharacterDataToPrisma(data: any): CharacterPrismaCreateInput {
	try {
		const {
			tagIds,
			placeIds,
			worldItemIds,
			conceptIds,
			promptIds,
			noteIds,
			groupIds,
			relatedCharacterIds,
			...baseData
		} = data;

		// Construir relaciones connect para Prisma
		const relations: Record<string, any> = {};

		// Procesar IDs para relaciones
		if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
			relations.tags = {
				connect: tagIds.map((id) => ({ id })),
			};
		}

		if (placeIds && Array.isArray(placeIds) && placeIds.length > 0) {
			relations.places = {
				connect: placeIds.map((id) => ({ id })),
			};
		}

		if (worldItemIds && Array.isArray(worldItemIds) && worldItemIds.length > 0) {
			relations.worldItems = {
				connect: worldItemIds.map((id) => ({ id })),
			};
		}

		if (conceptIds && Array.isArray(conceptIds) && conceptIds.length > 0) {
			relations.concepts = {
				connect: conceptIds.map((id) => ({ id })),
			};
		}

		if (promptIds && Array.isArray(promptIds) && promptIds.length > 0) {
			relations.prompts = {
				connect: promptIds.map((id) => ({ id })),
			};
		}

		if (noteIds && Array.isArray(noteIds) && noteIds.length > 0) {
			relations.notes = {
				connect: noteIds.map((id) => ({ id })),
			};
		}

		if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
			relations.groups = {
				connect: groupIds.map((id) => ({ id })),
			};
		}

		if (relatedCharacterIds && Array.isArray(relatedCharacterIds) && relatedCharacterIds.length > 0) {
			relations.relatedCharacters = {
				connect: relatedCharacterIds.map((id) => ({ id })),
			};
		}

		// Combinar datos base con relaciones
		return {
			...baseData,
			...relations,
		};
	} catch (error) {
		serverLogger.error(`Error mapeando datos de creación: ${error}`);
		throw new TransformerError(`Error mapeando datos de creación: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea datos de actualización a formato Prisma
 * @param data Datos para actualizar un Character
 * @returns Datos formateados para Prisma update
 */
export function mapUpdateCharacterDataToPrisma(data: any): CharacterPrismaUpdateInput {
	try {
		const {
			tagIds,
			placeIds,
			worldItemIds,
			conceptIds,
			promptIds,
			noteIds,
			groupIds,
			relatedCharacterIds,
			disconnectTagIds,
			disconnectPlaceIds,
			disconnectWorldItemIds,
			disconnectConceptIds,
			disconnectPromptIds,
			disconnectNoteIds,
			disconnectGroupIds,
			disconnectRelatedCharacterIds,
			...baseData
		} = data;

		// Construir relaciones connect/disconnect para Prisma
		const relations: Record<string, any> = {};

		// Procesar IDs para conexiones
		if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
			relations.tags = {
				...(relations.tags || {}),
				connect: tagIds.map((id) => ({ id })),
			};
		}

		if (placeIds && Array.isArray(placeIds) && placeIds.length > 0) {
			relations.places = {
				...(relations.places || {}),
				connect: placeIds.map((id) => ({ id })),
			};
		}

		if (worldItemIds && Array.isArray(worldItemIds) && worldItemIds.length > 0) {
			relations.worldItems = {
				...(relations.worldItems || {}),
				connect: worldItemIds.map((id) => ({ id })),
			};
		}

		if (conceptIds && Array.isArray(conceptIds) && conceptIds.length > 0) {
			relations.concepts = {
				...(relations.concepts || {}),
				connect: conceptIds.map((id) => ({ id })),
			};
		}

		if (promptIds && Array.isArray(promptIds) && promptIds.length > 0) {
			relations.prompts = {
				...(relations.prompts || {}),
				connect: promptIds.map((id) => ({ id })),
			};
		}

		if (noteIds && Array.isArray(noteIds) && noteIds.length > 0) {
			relations.notes = {
				...(relations.notes || {}),
				connect: noteIds.map((id) => ({ id })),
			};
		}

		if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
			relations.groups = {
				...(relations.groups || {}),
				connect: groupIds.map((id) => ({ id })),
			};
		}

		if (relatedCharacterIds && Array.isArray(relatedCharacterIds) && relatedCharacterIds.length > 0) {
			relations.relatedCharacters = {
				...(relations.relatedCharacters || {}),
				connect: relatedCharacterIds.map((id) => ({ id })),
			};
		}

		// Procesar IDs para desconexiones
		if (disconnectTagIds && Array.isArray(disconnectTagIds) && disconnectTagIds.length > 0) {
			relations.tags = {
				...(relations.tags || {}),
				disconnect: disconnectTagIds.map((id) => ({ id })),
			};
		}

		if (disconnectPlaceIds && Array.isArray(disconnectPlaceIds) && disconnectPlaceIds.length > 0) {
			relations.places = {
				...(relations.places || {}),
				disconnect: disconnectPlaceIds.map((id) => ({ id })),
			};
		}

		if (disconnectWorldItemIds && Array.isArray(disconnectWorldItemIds) && disconnectWorldItemIds.length > 0) {
			relations.worldItems = {
				...(relations.worldItems || {}),
				disconnect: disconnectWorldItemIds.map((id) => ({ id })),
			};
		}

		if (disconnectConceptIds && Array.isArray(disconnectConceptIds) && disconnectConceptIds.length > 0) {
			relations.concepts = {
				...(relations.concepts || {}),
				disconnect: disconnectConceptIds.map((id) => ({ id })),
			};
		}

		if (disconnectPromptIds && Array.isArray(disconnectPromptIds) && disconnectPromptIds.length > 0) {
			relations.prompts = {
				...(relations.prompts || {}),
				disconnect: disconnectPromptIds.map((id) => ({ id })),
			};
		}

		if (disconnectNoteIds && Array.isArray(disconnectNoteIds) && disconnectNoteIds.length > 0) {
			relations.notes = {
				...(relations.notes || {}),
				disconnect: disconnectNoteIds.map((id) => ({ id })),
			};
		}

		if (disconnectGroupIds && Array.isArray(disconnectGroupIds) && disconnectGroupIds.length > 0) {
			relations.groups = {
				...(relations.groups || {}),
				disconnect: disconnectGroupIds.map((id) => ({ id })),
			};
		}

		if (
			disconnectRelatedCharacterIds &&
			Array.isArray(disconnectRelatedCharacterIds) &&
			disconnectRelatedCharacterIds.length > 0
		) {
			relations.relatedCharacters = {
				...(relations.relatedCharacters || {}),
				disconnect: disconnectRelatedCharacterIds.map((id) => ({ id })),
			};
		}

		// Combinar datos base con relaciones
		return {
			...baseData,
			...relations,
		};
	} catch (error) {
		serverLogger.error(`Error mapeando datos de actualización: ${error}`);
		throw new TransformerError(`Error mapeando datos de actualización: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Filtra personajes según criterios
 * @param characters Array de personajes a filtrar
 * @param filters Criterios de filtrado
 * @returns Array de personajes filtrados
 */
export function filterCharacters(characters: CharacterComplete[], filters: any = {}): CharacterComplete[] {
	try {
		if (!filters || Object.keys(filters).length === 0) {
			return characters;
		}

		return characters.filter((character) => {
			// Filtro por nombre
			if (filters.name && !character.name.toLowerCase().includes(filters.name.toLowerCase())) {
				return false;
			}

			// Filtro por clase
			if (filters.class && character.class !== filters.class) {
				return false;
			}

			// Filtro por raza
			if (filters.race && character.race !== filters.race) {
				return false;
			}

			// Filtro por categoría
			if (filters.category && character.category !== filters.category) {
				return false;
			}

			// Filtro por alineamiento
			if (filters.alignment && character.alignment !== filters.alignment) {
				return false;
			}

			// Filtro por nivel mínimo
			if (filters.minLevel && character.level < filters.minLevel) {
				return false;
			}

			// Filtro por nivel máximo
			if (filters.maxLevel && character.level > filters.maxLevel) {
				return false;
			}

			// Filtro por favoritos
			if (filters.isFavorite === true && !character.isFavorite) {
				return false;
			}

			// Filtro por búsqueda genérica
			if (filters.search) {
				const searchTerm = filters.search.toLowerCase();
				const searchFields = [
					character.name,
					character.description || '',
					character.backstory || '',
					character.psychologicalProfile || '',
					character.socialProfile || '',
				];

				// Si ningún campo contiene el término de búsqueda, excluir
				if (!searchFields.some((field) => field.toLowerCase().includes(searchTerm))) {
					return false;
				}
			}

			// Si pasó todos los filtros, incluir
			return true;
		});
	} catch (error) {
		serverLogger.error(`Error filtrando characters: ${error}`);
		throw new TransformerError(`Error filtrando characters: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Ordena personajes según criterio
 * @param characters Array de personajes a ordenar
 * @param orderBy Criterio de ordenación
 * @returns Array de personajes ordenados
 */
export function sortCharacters(characters: CharacterComplete[], orderBy = 'name:asc'): CharacterComplete[] {
	try {
		const [field, direction] = orderBy.split(':');
		const isAscending = direction !== 'desc';

		return [...characters].sort((a, b) => {
			let valueA: any;
			let valueB: any;

			// Determinar valores a comparar según el campo
			switch (field) {
				case 'name':
					valueA = a.name.toLowerCase();
					valueB = b.name.toLowerCase();
					break;
				case 'level':
					valueA = a.level;
					valueB = b.level;
					break;
				case 'class':
					valueA = a.class.toLowerCase();
					valueB = b.class.toLowerCase();
					break;
				case 'race':
					valueA = a.race.toLowerCase();
					valueB = b.race.toLowerCase();
					break;
				case 'created':
					valueA = new Date(a.createdAt).getTime();
					valueB = new Date(b.createdAt).getTime();
					break;
				case 'updated':
					valueA = new Date(a.updatedAt).getTime();
					valueB = new Date(b.updatedAt).getTime();
					break;
				default:
					valueA = a.name.toLowerCase();
					valueB = b.name.toLowerCase();
			}

			// Realizar comparación según dirección
			if (valueA < valueB) return isAscending ? -1 : 1;
			if (valueA > valueB) return isAscending ? 1 : -1;
			return 0;
		});
	} catch (error) {
		serverLogger.error(`Error ordenando characters: ${error}`);
		throw new TransformerError(`Error ordenando characters: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Aplica paginación a un array de personajes
 * @param characters Array de personajes
 * @param page Número de página
 * @param pageSize Tamaño de página
 * @returns Array de personajes paginado
 */
export function paginateCharacters(characters: CharacterComplete[], page = 1, pageSize = 20): CharacterComplete[] {
	try {
		const startIndex = (page - 1) * pageSize;
		return characters.slice(startIndex, startIndex + pageSize);
	} catch (error) {
		serverLogger.error(`Error paginando characters: ${error}`);
		throw new TransformerError(`Error paginando characters: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Procesa un conjunto de personajes aplicando filtrado, ordenación y paginación
 * @param characters Array de personajes a procesar
 * @param options Opciones de procesamiento
 * @returns Array de personajes procesados
 */
export function processCharacters(
	characters: CharacterComplete[],
	options: {
		filters?: any;
		orderBy?: string;
		page?: number;
		pageSize?: number;
	} = {}
): {
	items: CharacterComplete[];
	total: number;
	page: number;
	pageSize: number;
	pageCount: number;
} {
	try {
		const { filters, orderBy, page = 1, pageSize = 20 } = options;

		// Aplicar filtros
		const filteredCharacters = filterCharacters(characters, filters);

		// Aplicar ordenación
		const sortedCharacters = sortCharacters(filteredCharacters, orderBy);

		// Calcular total y páginas
		const total = sortedCharacters.length;
		const pageCount = Math.ceil(total / pageSize);

		// Aplicar paginación
		const paginatedCharacters = paginateCharacters(sortedCharacters, page, pageSize);

		return {
			items: paginatedCharacters,
			total,
			page,
			pageSize,
			pageCount,
		};
	} catch (error) {
		serverLogger.error(`Error procesando characters: ${error}`);
		throw new TransformerError(`Error procesando characters: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea un Character a formato para relación entre personajes
 * @param character Personaje a mapear
 * @returns Personaje en formato para relación
 */
export function mapCharacterToRelatedCharacter(character: CharacterComplete): any {
	try {
		return {
			id: character.id,
			name: character.name,
			emoji: character.emoji,
			color: character.color,
			level: character.level,
			class: character.class,
			race: character.race,
			createdAt: character.createdAt,
			updatedAt: character.updatedAt,
		};
	} catch (error) {
		serverLogger.error(`Error mapeando character a relación: ${error}`);
		throw new TransformerError(`Error mapeando character a relación: ${(error as Error).message}`);
	}
}
