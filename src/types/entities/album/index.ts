/**
 * @file Índice de tipos para la entidad Album
 * @module types/entities/album
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types', extendidos desde './extended', estadísticos desde './stats-types' y enums desde './enums'.
 * Legacy eliminado.
 */

export {
    AlbumSortCriteria, AlbumType,
    AlbumViewMode
} from './enums';
export type {
    AlbumComplete, AlbumWithStats, FolderDistribution, ParsedAlbum,
    ParsedAlbumWithRelations
} from './extended';
export type {
    AlbumDateDistribution, AlbumItemDistribution,
    AlbumLocationDistribution, AlbumStats, AlbumStatsOverview, AlbumTimeRange
} from './stats-types';
export type {
    AlbumBase,
    AlbumCreateInput,
    AlbumUpdateInput
} from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.
