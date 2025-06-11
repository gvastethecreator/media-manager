/**
 * @file Índice de tipos para la entidad Album
 * @module types/entities/album
 */

// Exportar desde archivo base
export * from './extended';
export * from './stats-types';
export * from './types';

// Exportar específicamente CreateAlbumData para compatibilidad
export type { CreateAlbumData } from './types';

// Exportar desde enumeraciones
export {
    AlbumDisplayState,
    AlbumPrivacyLevel,
    AlbumSortCriteria,
    AlbumType,
    AlbumViewMode
} from './enums';

// Exportar desde definiciones extendidas
export type {
    AlbumComplete,
    AlbumWithStats,
    FolderDistribution,
    ParsedAlbum,
    ParsedAlbumWithRelations
} from './extended';

// Exportar tipos estadísticos
export type {
    AlbumDateDistribution,
    AlbumItemDistribution,
    AlbumLocationDistribution,
    AlbumStats,
    AlbumStatsOverview,
    AlbumTimeRange
} from './stats-types';

// 🎯 Alias principal para el tipo Album
export type { AlbumComplete as Album } from './extended';

