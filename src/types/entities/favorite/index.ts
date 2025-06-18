/**
 * @file Re-exportaciones para la entidad Favorite
 * @module types/entities/favorite
 * @description Exporta únicamente los tipos canónicos y validados para la entidad Favorite.
 * No se deben exportar tipos legacy o específicos de UI desde aquí.
 */

export type {
    CreateFavoriteData, FavoriteBase,
    FavoriteComplete,
    FavoriteCreateInput,
    FavoriteRelations
} from './types';

export { FavoriteEntityType } from './types';

