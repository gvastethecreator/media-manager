import type { CardDesignData, CardOptions, RarityConfig, TextureConfig } from './base-card-types';

export interface CharacterCardProps {
	character: CardDesignData;
	showStats?: boolean;
	showMetadata?: boolean;
	className?: string;
	options?: Partial<CardOptions>;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	onHoverStart?: () => void;
	onHoverEnd?: () => void;
	showVisualizationConfig?: boolean;
	enableExplode?: boolean;
}

export interface CharacterStats {
	strength: number;
	dexterity: number;
	intelligence: number;
	charisma: number;
	vitality: number;
	[key: string]: number;
}

export interface CharacterInfo {
	level?: number;
	class?: string;
	race?: string;
	alignment?: string;
	stats?: CharacterStats;
}
