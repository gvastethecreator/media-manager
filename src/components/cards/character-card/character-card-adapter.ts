/**
 * @file Adaptador para convertir CharacterWithStats a CharacterCardData
 * @module components/cards/character-card/character-card-adapter
 */

import { CharacterStats, CharacterWithStats } from '@/types/entities/character/types';
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
		if (!jsonStr) {
			return fallback;
		}
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
		stats: (() => {
			if (typeof character.stats === 'string') {
				return safeJsonParse<CharacterStats>(character.stats, {} as CharacterStats);
			}
			if (character.statistics) {
				return {
					strength: undefined,
					dexterity: undefined,
					constitution: undefined,
					intelligence: undefined,
					wisdom: undefined,
					charisma: undefined,
				} as CharacterStats;
			}
			return {} as CharacterStats;
		})(),
		parsedRelationships: safeJsonParse<Record<string, any>>(character.relationships, {}),
		parsedGoals: safeJsonParse<Record<string, any>>(character.goals, {}),
		parsedFears: safeJsonParse<Record<string, any>>(character.fears, {}),
		parsedBeliefs: safeJsonParse<Record<string, any>>(character.beliefs, {}),
		parsedPersonality: safeJsonParse<Record<string, any>>(character.personality, {}),
		parsedSkills: safeJsonParse<Record<string, any>>(character.skills, {}),
		parsedAbilities: safeJsonParse<Record<string, any>>(character.abilities, {}),
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
