/**
 * @file Enumeraciones para la entidad Collection
 * @module types/entities/collection/enums
 */

export enum CollectionSortOption {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	DATE_ASC = 'date_asc',
	DATE_DESC = 'date_desc',
	ITEMS_ASC = 'items_asc',
	ITEMS_DESC = 'items_desc',
	PRICE_ASC = 'price_asc',
	PRICE_DESC = 'price_desc',
}

export enum CollectionViewMode {
	GRID = 'grid',
	LIST = 'list',
	CARDS = 'cards',
}

export enum CollectionCategory {
	ART = 'art',
	PHOTOGRAPHY = 'photography',
	DIGITAL = 'digital',
	NFT = 'nft',
	PERSONAL = 'personal',
	WORK = 'work',
	PROJECT = 'project',
	GAME = 'game',
	COMIC = 'comic',
	MUSIC = 'music',
	MOVIE = 'movie',
	OTHER = 'other',
}

export enum CollectionPlatform {
	OPENSEA = 'opensea',
	RARIBLE = 'rarible',
	FOUNDATION = 'foundation',
	SUPERRARE = 'superrare',
	ASYNC = 'async',
	MAKERSPLACE = 'makersplace',
	KNOWN_ORIGIN = 'known_origin',
	OTHER = 'other',
}

export enum CollectionRarity {
	COMMON = 'common',
	UNCOMMON = 'uncommon',
	RARE = 'rare',
	EPIC = 'epic',
	LEGENDARY = 'legendary',
}

export const COLLECTION_CATEGORY_COLORS: Record<CollectionCategory, string> = {
	[CollectionCategory.ART]: '#f59e0b',
	[CollectionCategory.PHOTOGRAPHY]: '#10b981',
	[CollectionCategory.DIGITAL]: '#3b82f6',
	[CollectionCategory.NFT]: '#8b5cf6',
	[CollectionCategory.PERSONAL]: '#ef4444',
	[CollectionCategory.WORK]: '#6b7280',
	[CollectionCategory.PROJECT]: '#06b6d4',
	[CollectionCategory.GAME]: '#ef4444',
	[CollectionCategory.COMIC]: '#6366f1',
	[CollectionCategory.MUSIC]: '#ec4899',
	[CollectionCategory.MOVIE]: '#f97316',
	[CollectionCategory.OTHER]: '#9ca3af',
};

export const COLLECTION_CATEGORY_EMOJIS: Record<CollectionCategory, string> = {
	[CollectionCategory.ART]: '🎨',
	[CollectionCategory.PHOTOGRAPHY]: '📸',
	[CollectionCategory.DIGITAL]: '💻',
	[CollectionCategory.NFT]: '🖼️',
	[CollectionCategory.PERSONAL]: '👤',
	[CollectionCategory.WORK]: '💼',
	[CollectionCategory.PROJECT]: '📋',
	[CollectionCategory.GAME]: '🎮',
	[CollectionCategory.COMIC]: '📚',
	[CollectionCategory.MUSIC]: '🎵',
	[CollectionCategory.MOVIE]: '🎬',
	[CollectionCategory.OTHER]: '📚',
};
