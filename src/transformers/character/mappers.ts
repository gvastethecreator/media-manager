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
import type { Character as PrismaCharacter } from '@prisma/client';
import { toCharacterExtended, toCharacterSummary } from './serializers';

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
 * Mapea datos de creación de personaje a formato Prisma
 * @param data Datos para crear un personaje
 * @returns Objeto con formato para Prisma
 */
export function mapCreateCharacterDataToPrisma(data: any): any {
	// Asegurarse de que stats sea string si viene como objeto
	const stats = typeof data.stats === 'object' ? JSON.stringify(data.stats) : data.stats;

	return {
		name: data.name,
		emoji: data.emoji || null,
		color: data.color || null,
		description: data.description || null,
		shortcut: data.shortcut || null,
		level: data.level || 1,
		class: data.class || null,
		race: data.race || null,
		alignment: data.alignment || null,
		backstory: data.backstory || null,
		stats: stats || null,
		psychologicalProfile: data.psychologicalProfile || null,
		socialProfile: data.socialProfile || null,
		featuredImageId: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
		category: data.category || null,
		presetId: data.presetId || null,
	};
}

/**
 * Mapea datos de actualización de personaje a formato Prisma
 * @param data Datos para actualizar un personaje
 * @returns Objeto con formato para Prisma
 */
export function mapUpdateCharacterDataToPrisma(data: any): any {
	const updateData: any = {};

	// Solo incluir campos que estén presentes en los datos
	if (data.name !== undefined) updateData.name = data.name;
	if (data.emoji !== undefined) updateData.emoji = data.emoji;
	if (data.color !== undefined) updateData.color = data.color;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
	if (data.level !== undefined) updateData.level = data.level;
	if (data.class !== undefined) updateData.class = data.class;
	if (data.race !== undefined) updateData.race = data.race;
	if (data.alignment !== undefined) updateData.alignment = data.alignment;
	if (data.backstory !== undefined) updateData.backstory = data.backstory;

	// Convertir stats a string si es un objeto
	if (data.stats !== undefined) {
		updateData.stats = typeof data.stats === 'object' ? JSON.stringify(data.stats) : data.stats;
	}

	if (data.psychologicalProfile !== undefined) updateData.psychologicalProfile = data.psychologicalProfile;
	if (data.socialProfile !== undefined) updateData.socialProfile = data.socialProfile;
	if (data.featuredImage !== undefined) updateData.featuredImageId = data.featuredImage;
	if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
	if (data.category !== undefined) updateData.category = data.category;
	if (data.presetId !== undefined) updateData.presetId = data.presetId;

	return updateData;
}
