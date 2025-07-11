/**
 * @file Adaptador para convertir CharacterWithStats a CharacterCardData
 * @module components/cards/character-card/character-card-adapter
 */

import type { CharacterStatistics, CharacterWithStats } from '@/types/entities/character';
import type { CharacterCardData } from './character-card.types';

/**
 * 🎭 Adaptador para convertir CharacterWithStats a CharacterCardData para compatibilidad con CharacterCard
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

	const safeJsonParse = <T>(jsonStr: string | null | undefined, fallback: T): T => {
		if (!jsonStr) return fallback;
		try {
			return JSON.parse(jsonStr) as T;
		} catch {
			return fallback;
		}
	};

	const level = character.level ?? 1;

	return {
		...character,
		recentImages: [],
		recentVideos: [],
		totalSize: character.statistics?.totalAssociations ?? 0,
		stats: safeJsonParse<CharacterStats>(character.stats, {} as CharacterStats),
		parsedRelationships: safeJsonParse(character.relationships, {}),
		parsedGoals: safeJsonParse(character.goals, {}),
		parsedFears: safeJsonParse(character.fears, {}),
		parsedBeliefs: safeJsonParse(character.beliefs, {}),
		parsedPersonality: safeJsonParse(character.personality, {}),
		parsedSkills: safeJsonParse(character.skills, {}),
		parsedAbilities: safeJsonParse(character.abilities, {}),
		metadata: {
			power: character.statistics?.powerLevel ?? level * 10,
			rarityLevel: rarityMap[character.statistics?.rarityLevel ?? 'common'] ?? 'Common',
			cardId: `C${character.id.substring(0, 6)}-${level}`,
			healthPoints: character.statistics?.healthPoints,
			manaPoints: character.statistics?.manaPoints,
			totalAttacks: 0,
		},
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
('');
