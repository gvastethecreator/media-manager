/**
 * @file Funciones para mapear entidades Character entre diferentes formatos de datos
 * @module transformers/character/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
  CharacterAttribute,
  CharacterCard,
  CharacterClass,
  CharacterExtended,
  CharacterInventoryItem,
  CharacterListItem
} from '@/types/entities/character';
import type {
  CHARACTER_SORT_PROPERTY_MAP,
  CharacterComplete,
  CharacterCreateInput,
  CharacterFilters,
  CharacterSearchOptions,
  CharacterSortCriteria,
  CharacterUpdateInput
} from '@/types/entities/character/types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/utils/transformers/constants';
import { handleTransformerError } from '@/utils/transformers/errors';
import type { Prisma, Character as PrismaCharacter } from '@prisma/client';
import {
  toExtendedCharacter
} from './serializers';

const logger = serverLogger.withContext('CharacterMapper');

/**
 * Convierte un Character a un formato para listados
 * @param character Character a convertir
 * @returns CharacterListItem con formato para listados
 */
export function toCharacterListItem(character: PrismaCharacter | CharacterExtended): any {
	// Transformar a CharacterExtended si no lo es ya
	const extended = 'parsedStats' in character ? character : toExtendedCharacter(character);

	return {
		id: extended.id,
		name: extended.name,
		class: extended.class || 'unknown',
		race: extended.race || 'unknown',
		level: extended.level || 1,
		description: extended.description || '',
		imageCount: extended.imageCount || 0,
		isFavorite: extended.isFavorite || false,
		isSelected: extended.isSelected || false,
		createdAt: extended.createdAt,
		updatedAt: extended.updatedAt,
	};
}

/**
 * Convierte un Character extendido a formato de tarjeta
 * @param character Character a convertir
 * @returns CharacterCard con datos formateados para UI
 */
export function toCharacterCard(character: PrismaCharacter | CharacterExtended): CharacterCard {
	// Convertir a CharacterExtended si no lo es ya
	const extended = 'parsedStats' in character ? character : toExtendedCharacter(character);

	return {
		character: extended,
		thumbnails: [], // Se llenará desde el componente
		isExpanded: false,
		isFlipped: false,
		showDetails: false,
		activeTab: 'info',
	};
}

/**
 * Extrae y mapea las estadísticas primarias de un personaje
 * @param character Personaje del que extraer estadísticas
 * @returns Arreglo de atributos con sus valores
 */
export function mapPrimaryStats(character: CharacterExtended): CharacterAttribute[] {
	// Estadísticas por defecto para un RPG básico
	const defaultStats: CharacterAttribute[] = [
		{ name: 'STR', value: 10 },
		{ name: 'DEX', value: 10 },
		{ name: 'CON', value: 10 },
		{ name: 'INT', value: 10 },
		{ name: 'WIS', value: 10 },
		{ name: 'CHA', value: 10 },
	];

	if (!character.parsedStats || Object.keys(character.parsedStats).length === 0) {
		return defaultStats;
	}

	// Intentar usar estadísticas almacenadas
	const stats = character.parsedStats;
	const primaryStatKeys = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
	const mappedStats: CharacterAttribute[] = [];

	// Recorrer por claves estándar
	primaryStatKeys.forEach((statKey, index) => {
		for (const key in stats) {
			if (key.toLowerCase() === statKey) {
				const value = typeof stats[key] === 'number' ? stats[key] : Number.parseInt(String(stats[key]), 10) || 0;

				// Usar abreviaturas estándar
				let displayName = key;
				switch (key.toLowerCase()) {
					case 'strength':
						displayName = 'STR';
						break;
					case 'dexterity':
						displayName = 'DEX';
						break;
					case 'constitution':
						displayName = 'CON';
						break;
					case 'intelligence':
						displayName = 'INT';
						break;
					case 'wisdom':
						displayName = 'WIS';
						break;
					case 'charisma':
						displayName = 'CHA';
						break;
				}

				// Agregar al resultado
				mappedStats.push({
					name: displayName.toUpperCase(),
					value: value,
					type: 'primary',
				});
				return;
			}
		}

		// Si no encontró la estadística, poner valor por defecto
		mappedStats.push(defaultStats[index]);
	});

	// Añadir otras estadísticas importantes (máximo 2 más)
	const remainingSlots = 2;
	let otherStats = 0;

	for (const key in stats) {
		// Verificar si ya es una estadística primaria
		const isPrimary = primaryStatKeys.some(
			(statKey) => key.toLowerCase() === statKey || key.toUpperCase() === statKey.substring(0, 3)
		);

		if (!isPrimary && otherStats < remainingSlots) {
			const value = typeof stats[key] === 'number' ? stats[key] : Number.parseInt(String(stats[key]), 10) || 0;

			// Limitar a 4 caracteres para el nombre
			const displayName = key.length > 4 ? key.substring(0, 4).toUpperCase() : key.toUpperCase();

			mappedStats.push({
				name: displayName,
				value: value,
				type: 'secondary',
			});

			otherStats++;
		}
	}

	return mappedStats;
}

/**
 * Mapea un personaje para crear u obtener un inventario básico
 * @param character Personaje del que extraer inventario
 * @returns Arreglo de elementos de inventario
 */
export function mapCharacterInventory(character: CharacterExtended): CharacterInventoryItem[] {
	// Determinar el tipo de inventario basado en la clase
	const characterClass = character.class?.toLowerCase() as CharacterClass;

	// Elementos básicos de inventario por clase
	const inventoryByClass: Record<string, CharacterInventoryItem[]> = {
		warrior: [
			{ id: 'warrior-sword', name: 'Longsword', quantity: 1, type: 'weapon' },
			{ id: 'warrior-shield', name: 'Shield', quantity: 1, type: 'armor' },
			{ id: 'warrior-potion', name: 'Healing Potion', quantity: 3, type: 'consumable' },
		],
		mage: [
			{ id: 'mage-book', name: 'Spellbook', quantity: 1, type: 'gear' },
			{ id: 'mage-staff', name: 'Staff', quantity: 1, type: 'weapon' },
			{ id: 'mage-potion', name: 'Mana Potion', quantity: 5, type: 'consumable' },
		],
		rogue: [
			{ id: 'rogue-dagger', name: 'Dagger', quantity: 2, type: 'weapon' },
			{ id: 'rogue-lockpick', name: 'Lockpick Set', quantity: 1, type: 'tool' },
			{ id: 'rogue-poison', name: 'Poison Vial', quantity: 3, type: 'consumable' },
		],
		ranger: [
			{ id: 'ranger-bow', name: 'Bow', quantity: 1, type: 'weapon' },
			{ id: 'ranger-arrows', name: 'Arrows', quantity: 20, type: 'ammunition' },
			{ id: 'ranger-trap', name: 'Trap Kit', quantity: 2, type: 'tool' },
		],
		cleric: [
			{ id: 'cleric-mace', name: 'Mace', quantity: 1, type: 'weapon' },
			{ id: 'cleric-symbol', name: 'Holy Symbol', quantity: 1, type: 'gear' },
			{ id: 'cleric-bandages', name: 'Bandages', quantity: 10, type: 'consumable' },
		],
		paladin: [
			{ id: 'paladin-hammer', name: 'Warhammer', quantity: 1, type: 'weapon' },
			{ id: 'paladin-armor', name: 'Heavy Armor', quantity: 1, type: 'armor' },
			{ id: 'paladin-water', name: 'Holy Water', quantity: 5, type: 'consumable' },
		],
		bard: [
			{ id: 'bard-lute', name: 'Lute', quantity: 1, type: 'weapon' },
			{ id: 'bard-armor', name: 'Light Armor', quantity: 1, type: 'armor' },
			{ id: 'bard-wine', name: 'Wine', quantity: 2, type: 'consumable' },
		],
		druid: [
			{ id: 'druid-staff', name: 'Quarterstaff', quantity: 1, type: 'weapon' },
			{ id: 'druid-herbs', name: 'Herbs', quantity: 15, type: 'material' },
			{ id: 'druid-totem', name: 'Totem', quantity: 1, type: 'gear' },
		],
	};

	// Inventario por defecto si no hay clase específica
	const defaultInventory: CharacterInventoryItem[] = [
		{ id: 'basic-backpack', name: 'Backpack', quantity: 1, type: 'gear' },
		{ id: 'basic-rations', name: 'Rations', quantity: 5, type: 'food' },
		{ id: 'basic-torch', name: 'Torch', quantity: 3, type: 'tool' },
		{ id: 'basic-waterskin', name: 'Waterskin', quantity: 1, type: 'gear' },
		{ id: 'basic-rope', name: 'Rope', quantity: 1, type: 'tool' },
	];

	// Usar inventario específico de clase o el inventario por defecto
	const classInventory = characterClass && inventoryByClass[characterClass] ? inventoryByClass[characterClass] : [];

	return [...classInventory, ...defaultInventory];
}

/**
 * Obtiene una apariencia sugerida por clase de personaje
 * @param characterClass Clase de personaje (warrior, mage, etc)
 * @returns Objeto con color y emoji sugeridos
 */
export function getSuggestedAppearance(characterClass = 'warrior') {
  try {
    const validClass = characterClass?.toLowerCase() || 'warrior';

    // Valores por defecto
    return {
      color: '#3b82f6',
      emoji: '👤'
    };
  } catch (error) {
    serverLogger.error('Error al obtener apariencia sugerida', { error });
    return { color: '#3b82f6', emoji: '👤' };
  }
}

/**
 * Convierte un array de personajes a formato de lista
 * @param characters Array de personajes a convertir
 * @returns Array de elementos de lista
 */
export function charactersToListItems(characters: (PrismaCharacter | CharacterExtended)[]): CharacterListItem[] {
	return characters.map((character) => toCharacterListItem(character));
}

/**
 * Convierte un array de personajes a formato de tarjetas
 * @param characters Array de personajes a convertir
 * @returns Array de tarjetas
 */
export function charactersToCards(characters: (PrismaCharacter | CharacterExtended)[]): CharacterCard[] {
	return characters.map((character) => toCharacterCard(character));
}

/**
 * 🔄 Mapea datos de creación de Character a formato Prisma
 */
export function mapCreateCharacterDataToPrisma(data: CharacterCreateInput): Prisma.CharacterCreateInput {
  try {
    // Preparar datos base
    const baseData = {
      name: data.name,
      description: data.description,
      level: data.level,
      experience: data.experience,
      class: data.class,
      race: data.race,
      alignment: data.alignment,
      background: data.background,
      stats: data.stats,
      skills: data.skills,
      inventory: data.inventory,
      spells: data.spells,
      feats: data.feats,
      notes: data.notes,
      isActive: data.isActive ?? true,
      isFavorite: data.isFavorite ?? false,
      metadata: data.metadata,
    };

    // Preparar relaciones
    const relations = {
      party: data.party ? { connect: { id: data.party.id } } : undefined,
      campaign: data.campaign ? { connect: { id: data.campaign.id } } : undefined,
      images: data.images?.length ? { connect: data.images.map(img => ({ id: img.id })) } : undefined,
      items: data.items?.length ? { connect: data.items.map(item => ({ id: item.id })) } : undefined,
      abilities: data.abilities?.length ? { connect: data.abilities.map(ability => ({ id: ability.id })) } : undefined,
      quests: data.quests?.length ? { connect: data.quests.map(quest => ({ id: quest.id })) } : undefined,
      locations: data.locations?.length ? { connect: data.locations.map(location => ({ id: location.id })) } : undefined,
      npcs: data.npcs?.length ? { connect: data.npcs.map(npc => ({ id: npc.id })) } : undefined,
      notes: data.notes?.length ? { connect: data.notes.map(note => ({ id: note.id })) } : undefined,
      relatedCharacters: data.relatedCharacters?.length ? { connect: data.relatedCharacters.map(char => ({ id: char.id })) } : undefined,
      relatedTo: data.relatedTo?.length ? { connect: data.relatedTo.map(char => ({ id: char.id })) } : undefined,
    };

    return {
      ...baseData,
      ...relations,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Mapea datos de actualización de Character a formato Prisma
 */
export function mapUpdateCharacterDataToPrisma(data: CharacterUpdateInput): Prisma.CharacterUpdateInput {
  try {
    // Preparar datos base
    const baseData = {
      name: data.name,
      description: data.description,
      level: data.level,
      experience: data.experience,
      class: data.class,
      race: data.race,
      alignment: data.alignment,
      background: data.background,
      stats: data.stats,
      skills: data.skills,
      inventory: data.inventory,
      spells: data.spells,
      feats: data.feats,
      notes: data.notes,
      isActive: data.isActive,
      isFavorite: data.isFavorite,
      metadata: data.metadata,
      updatedAt: new Date(),
    };

    // Preparar relaciones
    const relations = {
      party: data.party ? { connect: { id: data.party.id } } : undefined,
      campaign: data.campaign ? { connect: { id: data.campaign.id } } : undefined,
      images: data.images?.length ? { set: data.images.map(img => ({ id: img.id })) } : undefined,
      items: data.items?.length ? { set: data.items.map(item => ({ id: item.id })) } : undefined,
      abilities: data.abilities?.length ? { set: data.abilities.map(ability => ({ id: ability.id })) } : undefined,
      quests: data.quests?.length ? { set: data.quests.map(quest => ({ id: quest.id })) } : undefined,
      locations: data.locations?.length ? { set: data.locations.map(location => ({ id: location.id })) } : undefined,
      npcs: data.npcs?.length ? { set: data.npcs.map(npc => ({ id: npc.id })) } : undefined,
      notes: data.notes?.length ? { set: data.notes.map(note => ({ id: note.id })) } : undefined,
      relatedCharacters: data.relatedCharacters?.length ? { set: data.relatedCharacters.map(char => ({ id: char.id })) } : undefined,
      relatedTo: data.relatedTo?.length ? { set: data.relatedTo.map(char => ({ id: char.id })) } : undefined,
    };

    return {
      ...baseData,
      ...relations,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Mapea opciones de búsqueda de Character a formato Prisma
 */
export function mapCharacterSearchOptionsToPrisma(
  options: CharacterSearchOptions
): Prisma.CharacterFindManyArgs {
  try {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, orderBy, filters = {}, include = {} } = options;

    // Validar y ajustar el tamaño de página
    const validatedPageSize = Math.min(pageSize, MAX_PAGE_SIZE);
    const skip = (page - 1) * validatedPageSize;

    // Mapear ordenamiento
    const orderByMapped = orderBy ? {
      [orderBy.field]: orderBy.direction,
    } : { createdAt: 'desc' };

    // Mapear filtros
    const where = mapCharacterFiltersToPrisma(filters);

    // Mapear inclusiones
    const includeRelations = {
      party: include.party ?? false,
      campaign: include.campaign ?? false,
      images: include.images ?? false,
      items: include.items ?? false,
      abilities: include.abilities ?? false,
      quests: include.quests ?? false,
      locations: include.locations ?? false,
      npcs: include.npcs ?? false,
      notes: include.notes ?? false,
      relatedCharacters: include.relatedCharacters ?? false,
      relatedTo: include.relatedTo ?? false,
      _count: include.count ?? false,
    };

    return {
      skip,
      take: validatedPageSize,
      orderBy: orderByMapped,
      where,
      include: includeRelations,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Mapea filtros de Character a formato Prisma
 */
export function mapCharacterFiltersToPrisma(filters: CharacterFilters): Prisma.CharacterWhereInput {
  try {
    const where: Prisma.CharacterWhereInput = {};

    // Filtros de texto
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filtros de nivel
    if (filters.level?.min !== undefined) {
      where.level = { ...where.level, gte: filters.level.min };
    }
    if (filters.level?.max !== undefined) {
      where.level = { ...where.level, lte: filters.level.max };
    }

    // Filtros de clase, raza y alineamiento
    if (filters.class?.length) {
      where.class = { in: filters.class };
    }
    if (filters.race?.length) {
      where.race = { in: filters.race };
    }
    if (filters.alignment?.length) {
      where.alignment = { in: filters.alignment };
    }
    if (filters.background?.length) {
      where.background = { in: filters.background };
    }

    // Filtros de estado
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    // Filtros de relaciones
    if (filters.hasParty) {
      where.party = { isNot: null };
    }
    if (filters.hasCampaign) {
      where.campaign = { isNot: null };
    }
    if (filters.hasImages) {
      where.images = { some: {} };
    }

    // Filtros de fecha
    if (filters.dateRange?.start) {
      where.createdAt = { ...where.createdAt, gte: filters.dateRange.start };
    }
    if (filters.dateRange?.end) {
      where.createdAt = { ...where.createdAt, lte: filters.dateRange.end };
    }

    return where;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Mapea un Character a su versión relacionada
 */
export function mapCharacterToRelatedCharacter(character: CharacterComplete): { id: string } {
  try {
    return { id: character.id };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * Crea un filtro de búsqueda para Prisma basado en los criterios proporcionados
 * @param filters - Filtros para la búsqueda
 * @returns Condiciones para consulta Prisma
 */
export function createCharacterFilter(
  filters?: CharacterFilters
): Prisma.CharacterWhereInput {
  if (!filters) return {};

  const conditions: Prisma.CharacterWhereInput = {};
  const AND: Prisma.CharacterWhereInput[] = [];

  // Búsqueda por texto
  if (filters.searchQuery) {
    conditions.OR = [
      { name: { contains: filters.searchQuery, mode: 'insensitive' } },
      { description: { contains: filters.searchQuery, mode: 'insensitive' } },
      { backstory: { contains: filters.searchQuery, mode: 'insensitive' } },
      { class: { contains: filters.searchQuery, mode: 'insensitive' } },
      { race: { contains: filters.searchQuery, mode: 'insensitive' } },
    ];
  }

  // Filtro por categorías
  if (filters.categories?.length) {
    AND.push({
      category: {
        in: filters.categories,
      },
    });
  }

  // Filtro por clases
  if (filters.classes?.length) {
    AND.push({
      class: {
        in: filters.classes,
      },
    });
  }

  // Filtro por razas
  if (filters.races?.length) {
    AND.push({
      race: {
        in: filters.races,
      },
    });
  }

  // Filtro por rango de nivel
  if (filters.levelRange) {
    if (filters.levelRange.min !== undefined) {
      AND.push({
        level: {
          gte: filters.levelRange.min,
        },
      });
    }
    if (filters.levelRange.max !== undefined) {
      AND.push({
        level: {
          lte: filters.levelRange.max,
        },
      });
    }
  }

  // Filtro por alineamientos
  if (filters.alignments?.length) {
    AND.push({
      alignment: {
        in: filters.alignments,
      },
    });
  }

  // Filtro por favoritos
  if (filters.onlyFavorites) {
    AND.push({
      isFavorite: true,
    });
  }

  if (AND.length) {
    conditions.AND = AND;
  }

  return conditions;
}

/**
 * Crea un ordenamiento para Prisma basado en el criterio de ordenación
 * @param sortCriteria - Criterio de ordenación
 * @param sortPropertyMap - Mapa de propiedades para ordenación
 * @returns Ordenamiento para Prisma
 */
export function createCharacterOrderBy(
  sortCriteria: CharacterSortCriteria = CharacterSortCriteria.NAME_ASC,
  sortPropertyMap: typeof CHARACTER_SORT_PROPERTY_MAP = CHARACTER_SORT_PROPERTY_MAP
): Prisma.CharacterOrderByWithRelationInput {
  const [_, direction] = sortCriteria.split(':');
  const property = sortPropertyMap[sortCriteria];

  return {
    [property]: direction as Prisma.SortOrder,
  };
}

/**
 * Mapear estadísticas primarias para tablas
 */
export function toPrimaryStats(character: PrismaCharacter) {
  try {
    const stats = [
      {
        name: 'Nivel',
        value: character.level?.toString() || '1',
        type: 'level'
      },
      {
        name: 'Clase',
        value: character.class || 'Desconocida',
        type: 'class'
      },
      {
        name: 'Raza',
        value: character.race || 'Desconocida',
        type: 'race'
      }
    ];

    if (character.alignment) {
      stats.push({
        name: 'Alineamiento',
        value: character.alignment,
        type: 'alignment'
      });
    }

    // Solo agregar background si existe en el personaje
    if ('background' in character && character.background) {
      stats.push({
        name: 'Trasfondo',
        value: character.background,
        type: 'background'
      });
    }

    return stats;
  } catch (error) {
    logger.error('Error en toPrimaryStats:', error);
    return [];
  }
}

/**
 * Convierte un carácter a un objeto mapeado para mostrar en inventario
 */
export function toInventoryItem(character: PrismaCharacter) {
  try {
    return {
      id: character.id,
      name: character.name,
      type: 'character',
      description: character.description || '',
    };
  } catch (error) {
    logger.error('Error en toInventoryItem:', error);
    return {
      id: character.id,
      name: character.name || 'Error',
      type: 'character',
      description: '',
    };
  }
}

/**
 * Parsea opciones de búsqueda para Character
 */
export function parseCharacterSearchParams(
  params: Record<string, any>
): {
  where: Record<string, any>;
  orderBy: Record<string, string>[];
  skip: number;
  take: number;
} {
  try {
    // Parsear parámetros de paginación
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

    // Calcular skip y take para paginación
    const skip = (page - 1) * pageSize;
    const take = Math.min(pageSize, MAX_PAGE_SIZE);

    // Construir condiciones de búsqueda
    const where: Record<string, any> = {};

    // Filtro de búsqueda por texto
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } }
      ];
    }

    // Filtros de comparación numérica
    if (params.minLevel !== undefined) {
      where.level = { gte: Number(params.minLevel) };
    }
    if (params.maxLevel !== undefined) {
      where.level = { ...where.level, lte: Number(params.maxLevel) };
    }

    // Filtros de igualdad exacta
    if (params.class) {
      where.class = params.class;
    }
    if (params.race) {
      where.race = params.race;
    }
    if (params.alignment) {
      where.alignment = params.alignment;
    }

    // Filtros booleanos
    if (params.isFavorite !== undefined) {
      where.favorite = params.isFavorite;
    }
    if (params.active !== undefined) {
      where.isActive = params.active;
    }

    // Ordenación
    const sortBy = params.sortBy || 'name';
    const sortDirection = params.sortDirection || 'asc';
    const orderBy = [{ [sortBy]: sortDirection }];

    return { where, orderBy, skip, take };
  } catch (error) {
    logger.error('Error parseando parámetros de búsqueda:', error);
    // Valores por defecto en caso de error
    return {
      where: {},
      orderBy: [{ name: 'asc' }],
      skip: 0,
      take: DEFAULT_PAGE_SIZE
    };
  }
}

/**
 * Convierte parámetros de búsqueda en filtros para UI
 */
export function toCharacterSearchFilters(params: Record<string, any>) {
  try {
    return {
      search: params.search || '',
      class: params.class || '',
      race: params.race || '',
      alignment: params.alignment || '',
      minLevel: params.minLevel || 0,
      maxLevel: params.maxLevel || 0,
      isFavorite: params.isFavorite,
      active: params.active
    };
  } catch (error) {
    logger.error('Error al convertir a filtros de búsqueda:', error);
    return {
      search: '',
      class: '',
      race: '',
      alignment: '',
      minLevel: 0,
      maxLevel: 0
    };
  }
}

/**
 * Prepara datos para la vista de listado
 */
export function toCharacterListProps(
  characters: PrismaCharacter[],
  params: Record<string, any>,
  totalCount: number
) {
  try {
    // Construir ordenación
    const sort = {
      field: params.sortBy || 'name',
      direction: params.sortDirection || 'asc'
    };

    // Construir paginación
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || DEFAULT_PAGE_SIZE;
    const totalPages = Math.ceil(totalCount / pageSize);

    const pagination = {
      totalItems: totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    // Construir filtros
    const filters = toCharacterSearchFilters(params);

    // Mapear personajes a formato de listado
    const items = characters.map(char => toCharacterListItem(char));

    return {
      items,
      filters,
      sort,
      pagination
    };
  } catch (error) {
    logger.error('Error preparando datos para lista:', error);
    return {
      items: [],
      filters: {
        search: '',
        class: '',
        race: '',
        alignment: '',
        minLevel: 0,
        maxLevel: 0
      },
      sort: {
        field: 'name',
        direction: 'asc'
      },
      pagination: {
        totalItems: 0,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
}
