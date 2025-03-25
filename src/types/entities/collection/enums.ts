/**
 * @file Enumeraciones y constantes para la entidad Collection
 * @module types/entities/collection/enums
 */

/**
 * Categorías predefinidas para las colecciones
 */
export enum CollectionCategory {
  ART = 'art',
  PHOTOGRAPHY = 'photography',
  DIGITAL = 'digital',
  NFT = 'nft',
  GAME = 'game',
  MERCHANDISE = 'merchandise',
  COMIC = 'comic',
  ANIME = 'anime',
  MOVIE = 'movie',
  MUSIC = 'music',
  OTHER = 'other',
}

/**
 * Rareza predefinida para las colecciones
 */
export enum CollectionRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
  UNIQUE = 'unique',
}

/**
 * Plataformas predefinidas para colecciones
 */
export enum CollectionPlatform {
  OPENSEA = 'opensea',
  RARIBLE = 'rarible',
  SUPER_RARE = 'superrare',
  FOUNDATION = 'foundation',
  MINTABLE = 'mintable',
  BINANCE = 'binance',
  EBAY = 'ebay',
  AMAZON = 'amazon',
  CUSTOM = 'custom',
  OTHER = 'other',
}

/**
 * Opciones para ordenar colecciones
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

/**
 * Mapa de colores sugeridos por categoría
 */
export const COLLECTION_CATEGORY_COLORS: Record<CollectionCategory, string> = {
  [CollectionCategory.ART]: '#F59E0B',
  [CollectionCategory.PHOTOGRAPHY]: '#10B981',
  [CollectionCategory.DIGITAL]: '#3B82F6',
  [CollectionCategory.NFT]: '#8B5CF6',
  [CollectionCategory.GAME]: '#EC4899',
  [CollectionCategory.MERCHANDISE]: '#F97316',
  [CollectionCategory.COMIC]: '#EF4444',
  [CollectionCategory.ANIME]: '#6366F1',
  [CollectionCategory.MOVIE]: '#0EA5E9',
  [CollectionCategory.MUSIC]: '#14B8A6',
  [CollectionCategory.OTHER]: '#6B7280',
}

/**
 * Mapa de emojis sugeridos por categoría
 */
export const COLLECTION_CATEGORY_EMOJIS: Record<CollectionCategory, string> = {
  [CollectionCategory.ART]: '🎨',
  [CollectionCategory.PHOTOGRAPHY]: '📷',
  [CollectionCategory.DIGITAL]: '💻',
  [CollectionCategory.NFT]: '🔮',
  [CollectionCategory.GAME]: '🎮',
  [CollectionCategory.MERCHANDISE]: '🛍️',
  [CollectionCategory.COMIC]: '📚',
  [CollectionCategory.ANIME]: '🌟',
  [CollectionCategory.MOVIE]: '🎬',
  [CollectionCategory.MUSIC]: '🎵',
  [CollectionCategory.OTHER]: '🌈',
}