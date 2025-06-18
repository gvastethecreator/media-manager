/**
 * @file Re-exportaciones para entidad Favorite
 * @module types/entities/favorite
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types' y extendidos desde './extended'.
 * Legacy eliminado.
 */

export * from './extended';
export type {
    FavoriteBase, FavoriteCreateInput, FavoriteEntityType,
    FavoriteExtended, FavoriteRelations, FavoriteStats, FavoriteUpdateInput, FavoritesByType
} from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.
