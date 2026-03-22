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
	character: CharacterCardData;
	characterId: string;
	className?: string;
	compact?: boolean;
	disabled?: boolean;
	isSelected?: boolean;
	onClick?: (character: CharacterCardData) => void;
	onDoubleClick?: (character: CharacterCardData) => void;
	onSelect?: (character: CharacterCardData) => void;
	style?: React.CSSProperties;
	tcgMode?: boolean;
}
