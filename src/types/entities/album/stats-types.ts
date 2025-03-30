/**
 * @file Tipos estadísticos para la entidad Album
 * @module types/entities/album/stats-types
 */

/**
 * Estadísticas base de un álbum
 */
export interface AlbumStats {
    totalSize: number;
    itemCount: number;
    imageCount: number;
    videoCount: number;
    lastModified: Date;
    averageItemSize: number;
}

/**
 * Distribución de items por tipo
 */
export interface AlbumItemDistribution {
    type: string;
    count: number;
    totalSize: number;
    percentage: number;
}

/**
 * Distribución de items por ubicación
 */
export interface AlbumLocationDistribution {
    name: string;
    latitude: number;
    longitude: number;
    itemCount: number;
    imageCount: number;
    videoCount: number;
}

/**
 * Distribución de items por fecha
 */
export interface AlbumDateDistribution {
    date: Date;
    count: number;
    size: number;
}

/**
 * Resumen temporal del álbum
 */
export interface AlbumTimeRange {
    from: Date;
    to: Date;
    duration: number;
    itemsPerDay: number;
}

/**
 * Resumen de estadísticas
 */
export interface AlbumStatsOverview {
    totalStats: AlbumStats;
    itemDistribution: AlbumItemDistribution[];
    locationDistribution: AlbumLocationDistribution[];
    dateDistribution: AlbumDateDistribution[];
    timeRange: AlbumTimeRange;
}