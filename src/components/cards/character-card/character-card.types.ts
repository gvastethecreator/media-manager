import type { CharacterStats, CharacterWithStats } from '@/types/entities/character';

export type CharacterCardData = Omit<CharacterWithStats, 'stats'> & {
	recentImages: string[];
	recentVideos: string[];
	totalSize: number;
	stats: CharacterStats;
	parsedRelationships: Record<string, any>;
	parsedGoals: Record<string, any>;
	parsedFears: Record<string, any>;
	parsedBeliefs: Record<string, any>;
	parsedPersonality: Record<string, any>;
	parsedSkills: Record<string, any>;
	parsedAbilities: Record<string, any>;
	metadata: {
		power: number;
		rarityLevel: 'Common' | 'Uncommon' | 'Rare' | 'Mythic';
		cardId: string;
		healthPoints?: number;
		manaPoints?: number;
		totalAttacks?: number;
	};
};

export interface CharacterCardProps {
	characterId: string;
	character: CharacterCardData;
	onClick?: (character: CharacterCardData) => void;
	onDoubleClick?: (character: CharacterCardData) => void;
	disabled?: boolean;
	className?: string;
	style?: React.CSSProperties;
	tcgMode?: boolean;
	compact?: boolean;
	isSelected?: boolean;
	onSelect?: (character: CharacterCardData) => void;
}
