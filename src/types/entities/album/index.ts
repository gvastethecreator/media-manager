/**
 * @file Índice de tipos para la entidad Album
 * @module types/entities/album
 */

export type {
       AlbumBase,
       AlbumRelations,
       AlbumCounts,
       AlbumFilters,
       AlbumComplete,
       AlbumCreateInput,
       AlbumUpdateInput,
       AlbumSearchOptions,
       AlbumSearchResult,
       AlbumTransformerOptions,
       RelatedAlbum,
} from './types';

export type {
       AlbumWithStats,
       FolderDistribution,
       ParsedAlbum,
       ParsedAlbumWithRelations,
} from './extended';

export type {
       AlbumDateDistribution,
       AlbumItemDistribution,
       AlbumLocationDistribution,
       AlbumStats,
       AlbumStatsOverview,
       AlbumTimeRange,
} from './stats-types';

// Exportar específicamente CreateAlbumData para compatibilidad
export type { CreateAlbumData } from './types';

export {
       AlbumDisplayState,
       AlbumPrivacyLevel,
       AlbumSortCriteria,
       AlbumType,
       AlbumViewMode,
} from './enums';

// 🎯 Alias principal para el tipo Album
export type { AlbumComplete as Album } from './extended';

