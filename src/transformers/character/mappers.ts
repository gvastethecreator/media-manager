/**
 * @file Funciones para mapear entidades Character entre diferentes formatos de datos
 * @module transformers/character/mappers
 */

import { Logger } from '@/lib/logger';
import type {
    CharacterAttribute,
    CharacterCard,
    CharacterCategory,
    CharacterClass,
    CharacterExtended,
    CharacterInventoryItem,
    CharacterListItem,
} from '@/types/entities/character';
import {
    CHARACTER_CLASS_COLORS as SUGGESTED_COLORS,
    CHARACTER_CLASS_EMOJIS as SUGGESTED_EMOJIS,
} from '@/types/entities/character/enums';
import type { CHARACTER_SORT_PROPERTY_MAP, CharacterFilters, CharacterSortCriteria } from '@/types/entities/character/types';
import { CharacterComplete, CharacterCreateInput, CharacterSearchOptions, CharacterUpdateInput } from '@/types/entities/character/types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/utils/transformers/constants';
import { handleTransformerError } from '@/utils/transformers/errors';
import type { Prisma, Character as PrismaCharacter } from '@prisma/client';
import {
    toCharacterSummary, toExtendedCharacter
} from './serializers';

const logger = new Logger('CharacterMapper');

/**
 * Mapea un personaje a un formato para mostrar en listas
 * @param character Personaje a convertir
 * @returns CharacterListItem con formato para listados
 */
export function toCharacterListItem(character: PrismaCharacter | CharacterExtended): CharacterListItem {
	const extended =
		'isSelected' in character ? (character as CharacterExtended) : toExtendedCharacter(character as PrismaCharacter);

	const summary = toCharacterSummary(extended);

	return {
		id: extended.id,
		name: extended.name,
		emoji: extended.emoji || '👤',
		color: extended.color || '#3b82f6',
		class: extended.class || 'unknown',
		race: extended.race || 'unknown',
		level: extended.level || 1,
		alignment: extended.alignment || 'true neutral',
		description: extended.description || '',
		imageCount: extended.imageCount || 0,
		category: extended.category as CharacterCategory,
		isFavorite: extended.isFavorite || false,
		isSelected: extended.isSelected || false,
		isHovered: extended.isHovered || false,
		featuredImage: extended.featuredImage || null,
		createdAt: extended.createdAt,
		updatedAt: extended.updatedAt,
	};
}

/**
 * Mapea un personaje a un formato para mostrar en tarjetas
 * @param character Personaje a convertir
 * @returns CharacterCard con formato para tarjetas
 */
export function toCharacterCard(character: PrismaCharacter | CharacterExtended): CharacterCard {
	const extended =
		'isSelected' in character ? (character as CharacterExtended) : toExtendedCharacter(character as PrismaCharacter);

	return {
		id: extended.id,
		name: extended.name,
		emoji: extended.emoji || '👤',
		color: extended.color || '#3b82f6',
		class: extended.class || 'unknown',
		race: extended.race || 'unknown',
		level: extended.level || 1,
		alignment: extended.alignment || 'true neutral',
		description: extended.description?.substring(0, 150) || '',
		category: extended.category as CharacterCategory,
		isFavorite: extended.isFavorite || false,
		isSelected: extended.isSelected || false,
		isHovered: extended.isHovered || false,
		featuredImage: extended.featuredImage || null,
		primaryStats: mapPrimaryStats(extended),
		createdAt: extended.createdAt,
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

	// Extraer estadísticas del personaje
	const stats = character.parsedStats;

	// Priorizar las estadísticas conocidas en RPGs
	const primaryStats = [
		'strength',
		'str',
		'dexterity',
		'dex',
		'constitution',
		'con',
		'intelligence',
		'int',
		'wisdom',
		'wis',
		'charisma',
		'cha',
	];

	const mappedStats: CharacterAttribute[] = [];

	// Primero buscar las estadísticas primarias
	for (const statKey of primaryStats) {
		for (const key in stats) {
			if (key.toLowerCase() === statKey) {
				const value = typeof stats[key] === 'number' ? stats[key] : Number.parseInt(stats[key], 10) || 0;

				// Usar abreviaturas estándar
				let displayName = key;
				if (key.toLowerCase() === 'strength' || key.toLowerCase() === 'str') displayName = 'STR';
				if (key.toLowerCase() === 'dexterity' || key.toLowerCase() === 'dex') displayName = 'DEX';
				if (key.toLowerCase() === 'constitution' || key.toLowerCase() === 'con') displayName = 'CON';
				if (key.toLowerCase() === 'intelligence' || key.toLowerCase() === 'int') displayName = 'INT';
				if (key.toLowerCase() === 'wisdom' || key.toLowerCase() === 'wis') displayName = 'WIS';
				if (key.toLowerCase() === 'charisma' || key.toLowerCase() === 'cha') displayName = 'CHA';

				mappedStats.push({ name: displayName, value });
				break;
			}
		}
	}

	// Si no encontramos suficientes estadísticas, agregar otras hasta tener un máximo de 6
	if (mappedStats.length < 6) {
		const remainingSlots = 6 - mappedStats.length;
		let otherStats = 0;

		for (const key in stats) {
			// Verificar si ya es una estadística primaria
			const isPrimary = primaryStats.some((stat) => key.toLowerCase() === stat);

			if (!isPrimary && otherStats < remainingSlots) {
				const value = typeof stats[key] === 'number' ? stats[key] : Number.parseInt(stats[key], 10) || 0;

				// Limitar a 4 caracteres para el nombre
				const displayName = key.length > 4 ? key.substring(0, 4).toUpperCase() : key.toUpperCase();

				mappedStats.push({ name: displayName, value });
				otherStats++;
			}

			if (otherStats >= remainingSlots) break;
		}
	}

	// Si aún no tenemos suficientes, usar los valores predeterminados para llenar
	if (mappedStats.length < defaultStats.length) {
		return [...mappedStats, ...defaultStats.slice(mappedStats.length)];
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
			{ name: 'Longsword', quantity: 1, type: 'weapon', value: 15 },
			{ name: 'Shield', quantity: 1, type: 'armor', value: 10 },
			{ name: 'Healing Potion', quantity: 3, type: 'consumable', value: 50 },
		],
		mage: [
			{ name: 'Spellbook', quantity: 1, type: 'gear', value: 50 },
			{ name: 'Staff', quantity: 1, type: 'weapon', value: 5 },
			{ name: 'Mana Potion', quantity: 5, type: 'consumable', value: 40 },
		],
		rogue: [
			{ name: 'Dagger', quantity: 2, type: 'weapon', value: 5 },
			{ name: 'Lockpick Set', quantity: 1, type: 'tool', value: 25 },
			{ name: 'Poison Vial', quantity: 3, type: 'consumable', value: 75 },
		],
		ranger: [
			{ name: 'Bow', quantity: 1, type: 'weapon', value: 30 },
			{ name: 'Arrows', quantity: 20, type: 'ammunition', value: 1 },
			{ name: 'Trap Kit', quantity: 2, type: 'tool', value: 15 },
		],
		cleric: [
			{ name: 'Mace', quantity: 1, type: 'weapon', value: 12 },
			{ name: 'Holy Symbol', quantity: 1, type: 'gear', value: 25 },
			{ name: 'Bandages', quantity: 10, type: 'consumable', value: 5 },
		],
		paladin: [
			{ name: 'Warhammer', quantity: 1, type: 'weapon', value: 20 },
			{ name: 'Heavy Armor', quantity: 1, type: 'armor', value: 100 },
			{ name: 'Holy Water', quantity: 5, type: 'consumable', value: 25 },
		],
		bard: [
			{ name: 'Lute', quantity: 1, type: 'weapon', value: 35 },
			{ name: 'Light Armor', quantity: 1, type: 'armor', value: 30 },
			{ name: 'Wine', quantity: 2, type: 'consumable', value: 10 },
		],
		druid: [
			{ name: 'Quarterstaff', quantity: 1, type: 'weapon', value: 8 },
			{ name: 'Herbs', quantity: 15, type: 'material', value: 3 },
			{ name: 'Totem', quantity: 1, type: 'gear', value: 25 },
		],
	};

	// Inventario por defecto si no hay clase específica
	const defaultInventory: CharacterInventoryItem[] = [
		{ name: 'Backpack', quantity: 1, type: 'gear', value: 5 },
		{ name: 'Rations', quantity: 5, type: 'food', value: 2 },
		{ name: 'Torch', quantity: 3, type: 'tool', value: 1 },
		{ name: 'Waterskin', quantity: 1, type: 'gear', value: 2 },
		{ name: 'Rope', quantity: 1, type: 'tool', value: 4 },
	];

	// Usar inventario específico de clase o el inventario por defecto
	const classInventory = characterClass && inventoryByClass[characterClass] ? inventoryByClass[characterClass] : [];

	return [...classInventory, ...defaultInventory];
}

/**
 * Genera un color y emoji sugeridos para un personaje basado en su clase
 * @param characterClass Clase del personaje
 * @returns Objeto con color y emoji sugeridos
 */
export function getSuggestedAppearance(characterClass: CharacterClass = 'warrior'): { color: string; emoji: string } {
	const validClass = (characterClass?.toLowerCase() as CharacterClass) || 'warrior';

	return {
		color: SUGGESTED_COLORS[validClass] || '#6b7280', // Default gray if not found
		emoji: SUGGESTED_EMOJIS[validClass] || '👤', // Default person emoji if not found
	};
}

/**
 * Convierte un array de personajes a formato de lista
 * @param characters Personajes a convertir
 * @returns Array de CharacterListItem
 */
export function charactersToListItems(characters: (PrismaCharacter | CharacterExtended)[]): CharacterListItem[] {
	return characters.map((character) => toCharacterListItem(character));
}

/**
 * Convierte un array de personajes a formato de tarjetas
 * @param characters Personajes a convertir
 * @returns Array de CharacterCard
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
