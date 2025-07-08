/**
 * @file Adaptador para convertir CharacterWithStats a CharacterCardData
 * @module components/cards/character-card/character-card-adapter
 */

import type { CharacterCardData } from '@/lib/api/services/characters';
import type { CharacterWithStats } from '@/types/entities/character';

/**
 * 🎭 Convierte CharacterWithStats a CharacterCardData para compatibilidad con CharacterCard
 * @param character Personaje con estadísticas
 * @returns Datos de personaje compatible con CharacterCard
 */
export function adaptCharacterWithStats(character: CharacterWithStats): CharacterCardData {
	const rarityMap: Record<string, 'Common' | 'Uncommon' | 'Rare' | 'Mythic'> = {
		common: 'Common',
		uncommon: 'Uncommon',
		rare: 'Rare',
		epic: 'Rare',
		legendary: 'Mythic',
	};

	const safeJsonParse = (jsonStr: string | null | undefined): any => {
		if (!jsonStr) return {};
		try {
			return JSON.parse(jsonStr);
		} catch {
			return {};
		}
	};

	const level = character.level ?? 1;

	return {
		id: character.id,
		name: character.name,
		description: character.description,
		emoji: character.emoji,
		color: character.color,
		isFavorite: character.isFavorite,
		createdAt: character.createdAt,
		updatedAt: character.updatedAt,
		_count: {
			images: character.statistics?.totalImages ?? 0,
			videos: character.statistics?.totalVideos ?? 0,
			collections: character.statistics?.totalCollections ?? 0,
			tags: character.statistics?.totalTags ?? 0,
			places: character.statistics?.totalPlaces ?? 0,
			worldItems: character.statistics?.totalWorldItems ?? 0,
			concepts: character.statistics?.totalConcepts ?? 0,
			prompts: character.statistics?.totalPrompts ?? 0,
			notes: character.statistics?.totalNotes ?? 0,
			wildcards: character.statistics?.totalWildcards ?? 0,
			properties: character.statistics?.totalProperties ?? 0,
			groups: character.statistics?.totalGroups ?? 0,
			relatedCharacters: character.statistics?.totalRelatedCharacters ?? 0,
			relatedTo: character.statistics?.totalRelatedTo ?? 0,
		},
		recentImages: [],
		recentVideos: [],
		totalSize: character.statistics?.totalAssociations ?? 0,
		stats: safeJsonParse(character.stats),
		parsedRelationships: safeJsonParse(character.relationships),
		parsedGoals: safeJsonParse(character.goals),
		parsedFears: safeJsonParse(character.fears),
		parsedBeliefs: safeJsonParse(character.beliefs),
		parsedPersonality: safeJsonParse(character.personality),
		parsedSkills: safeJsonParse(character.skills),
		parsedAbilities: safeJsonParse(character.abilities),
		metadata: {
			power: character.statistics?.powerLevel ?? level * 10,
			rarityLevel: rarityMap[character.statistics?.rarityLevel ?? 'common'] ?? 'Common',
			cardId: `C${character.id.substring(0, 6)}-${level}`,
			healthPoints: character.statistics?.healthPoints,
			manaPoints: character.statistics?.manaPoints,
			totalAttacks: 0,
		},
		level: character.level,
		class: character.class,
		race: character.race,
		backstory: character.backstory,
		alignment: character.alignment,
	};
}

/**
 * 🎭 Verifica si un objeto es CharacterCardData
 * @param character Objeto a verificar
 * @returns true si es CharacterCardData
 */
export function isCharacterCardData(character: any): character is CharacterCardData {
	return character && 'recentImages' in character && 'metadata' in character;
}

/**
 * 🎭 Verifica si un objeto es CharacterWithStats
 * @param character Objeto a verificar
 * @returns true si es CharacterWithStats
 */
export function isCharacterWithStats(character: any): character is CharacterWithStats {
	return character && 'statistics' in character;
}