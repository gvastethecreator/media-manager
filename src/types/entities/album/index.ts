/**
 * @file Índice de tipos para la entidad Album
 * @module types/entities/album
 */

// Exportar desde enumeraciones
export {
	AlbumDisplayState,
	AlbumPrivacyLevel,
	AlbumSortCriteria,
	AlbumType,
	AlbumViewMode,
} from './enums';
// Exportar desde definiciones extendidas
// 🎯 Alias principal para el tipo Album
export type {
	AlbumComplete,
	AlbumComplete as Album,
	AlbumWithStats,
	FolderDistribution,
	ParsedAlbum,
	ParsedAlbumWithRelations,
} from './extended';
// Exportar desde archivo base
export * from './extended';
// Exportar tipos estadísticos
export type {
	AlbumDateDistribution,
	AlbumItemDistribution,
	AlbumLocationDistribution,
	AlbumStats,
	AlbumStatsOverview,
	AlbumTimeRange,
} from './stats-types';
export * from './stats-types';
export * from './types';
