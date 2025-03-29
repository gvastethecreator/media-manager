/**
 * @file Funciones para mapear entidades Character entre diferentes formatos de datos
 * @module transformers/character/mappers
 */

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
import type { CHARACTER_SORT_PROPERTY_MAP, CharacterFilters, CharacterSortCriteria, CreateCharacterData, UpdateCharacterData } from '@/types/entities/character/types';
import type { Prisma, Character as PrismaCharacter } from '@prisma/client';
import {
  serializeFilters,
  serializeJsonArray,
  serializeRelationships,
  serializeStats, toCharacterExtended, toCharacterSummary
} from './serializers';

/**
 * Mapea un personaje a un formato para mostrar en listas
 * @param character Personaje a convertir
 * @returns CharacterListItem con formato para listados
 */
export function toCharacterListItem(character: PrismaCharacter | CharacterExtended): CharacterListItem {
	const extended =
		'isSelected' in character ? (character as CharacterExtended) : toCharacterExtended(character as PrismaCharacter);

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
		'isSelected' in character ? (character as CharacterExtended) : toCharacterExtended(character as PrismaCharacter);

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
 * Mapea datos de creación de personaje al formato requerido por Prisma
 * @param data - Datos para crear personaje
 * @returns Datos mapeados para Prisma
 */
export function mapCreateCharacterDataToPrisma(
  data: CreateCharacterData
): Prisma.CharacterCreateInput {
  return {
    name: data.name,
    emoji: data.emoji || '👤',
    color: data.color || '#3b82f6',
    description: data.description || null,
    shortcut: data.shortcut || null,
    category: data.category || null,
    level: data.level || 1,
    class: data.class || 'Generic',
    race: data.race || 'Human',
    type: data.type || null,
    alignment: data.alignment || 'Neutral',
    backstory: data.backstory || '',
    // Serializar campos JSON
    stats: serializeStats(data.stats || {}),
    psychologicalProfile: data.psychologicalProfile || '',
    socialProfile: data.socialProfile || '',
    relationships: serializeRelationships(data.relationships || []),
    goals: serializeJsonArray(data.goals || []),
    fears: serializeJsonArray(data.fears || []),
    beliefs: serializeJsonArray(data.beliefs || []),
    personality: serializeJsonArray(data.personality || []),
    skills: serializeJsonArray(data.skills || []),
    abilities: serializeJsonArray(data.abilities || []),
    featuredImage: data.featuredImage || null,
    isFavorite: data.isFavorite || false,
    sortBy: data.sortBy || 'name:asc',
    filters: serializeFilters(data.filters || {}),
    // Relaciones
    ...(data.groupIds?.length && {
      groups: {
        connect: data.groupIds.map((id) => ({ id })),
      },
    }),
    ...(data.propertyIds?.length && {
      properties: {
        connect: data.propertyIds.map((id) => ({ id })),
      },
    }),
    ...(data.wildcardIds?.length && {
      wildcards: {
        connect: data.wildcardIds.map((id) => ({ id })),
      },
    }),
    ...(data.tagIds?.length && {
      tags: {
        connect: data.tagIds.map((id) => ({ id })),
      },
    }),
  };
}

/**
 * Mapea datos de actualización de personaje al formato requerido por Prisma
 * @param data - Datos para actualizar personaje
 * @returns Datos mapeados para Prisma
 */
export function mapUpdateCharacterDataToPrisma(
  data: UpdateCharacterData
): Prisma.CharacterUpdateInput {
  const mapped: Prisma.CharacterUpdateInput = {};

  // Mapear campos simples
  if (data.name !== undefined) mapped.name = data.name;
  if (data.emoji !== undefined) mapped.emoji = data.emoji;
  if (data.color !== undefined) mapped.color = data.color;
  if (data.description !== undefined) mapped.description = data.description;
  if (data.shortcut !== undefined) mapped.shortcut = data.shortcut;
  if (data.category !== undefined) mapped.category = data.category;
  if (data.level !== undefined) mapped.level = data.level;
  if (data.class !== undefined) mapped.class = data.class;
  if (data.race !== undefined) mapped.race = data.race;
  if (data.type !== undefined) mapped.type = data.type;
  if (data.alignment !== undefined) mapped.alignment = data.alignment;
  if (data.backstory !== undefined) mapped.backstory = data.backstory;
  if (data.psychologicalProfile !== undefined) mapped.psychologicalProfile = data.psychologicalProfile;
  if (data.socialProfile !== undefined) mapped.socialProfile = data.socialProfile;
  if (data.featuredImage !== undefined) mapped.featuredImage = data.featuredImage;
  if (data.isFavorite !== undefined) mapped.isFavorite = data.isFavorite;
  if (data.sortBy !== undefined) mapped.sortBy = data.sortBy;

  // Serializar campos JSON si existen
  if (data.stats !== undefined) mapped.stats = serializeStats(data.stats);
  if (data.relationships !== undefined) mapped.relationships = serializeRelationships(data.relationships);
  if (data.goals !== undefined) mapped.goals = serializeJsonArray(data.goals);
  if (data.fears !== undefined) mapped.fears = serializeJsonArray(data.fears);
  if (data.beliefs !== undefined) mapped.beliefs = serializeJsonArray(data.beliefs);
  if (data.personality !== undefined) mapped.personality = serializeJsonArray(data.personality);
  if (data.skills !== undefined) mapped.skills = serializeJsonArray(data.skills);
  if (data.abilities !== undefined) mapped.abilities = serializeJsonArray(data.abilities);
  if (data.filters !== undefined) mapped.filters = serializeFilters(data.filters);

  // Manejar relaciones
  if (data.groupIds !== undefined) {
    mapped.groups = {
      set: data.groupIds.map((id) => ({ id })),
    };
  }

  if (data.propertyIds !== undefined) {
    mapped.properties = {
      set: data.propertyIds.map((id) => ({ id })),
    };
  }

  if (data.wildcardIds !== undefined) {
    mapped.wildcards = {
      set: data.wildcardIds.map((id) => ({ id })),
    };
  }

  if (data.tagIds !== undefined) {
    mapped.tags = {
      set: data.tagIds.map((id) => ({ id })),
    };
  }

  return mapped;
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
