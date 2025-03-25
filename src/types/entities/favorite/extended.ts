/**
 * @file Tipos extendidos para la entidad Favorite con propiedades adicionales para UI
 * @module types/entities/favorite/extended
 */

import type { FileItem } from '@/types/file-item';
import type { FavoriteBase } from './base';

/**
 * Interfaz para un favorito con la imagen asociada
 */
export interface FavoriteWithImage extends FavoriteBase {
    image: FileItem;
}

/**
 * Interfaz para un favorito con la entidad asociada (genérico)
 */
export interface FavoriteWithEntity<T> extends FavoriteBase {
    entity: T;
}

/**
 * Interfaz para un favorito con entidad y propiedades adicionales para UI
 */
export interface FavoriteExtended extends FavoriteBase {
    // UI properties
    entityName?: string;
    entityPreview?: string;
    entityIcon?: string;
    entityColor?: string;

    // Tracking
    isSelected?: boolean;
    isHovered?: boolean;

    // Relations count
    _count?: {
        relatedEntities?: number;
    };
}

/**
 * Interfaz para favoritos agrupados por tipo
 */
export interface FavoritesByType {
    type: string;
    displayName: string;
    icon: string;
    color: string;
    count: number;
    items: FavoriteExtended[];
}

/**
 * Estadísticas de favoritos
 */
export interface FavoriteStats {
    totalCount: number;
    byType: Record<string, number>;
    recentlyAdded: FavoriteExtended[];
}