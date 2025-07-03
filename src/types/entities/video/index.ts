/**
 * @file Exportaciones principales para la entidad Video
 * @module types/entities/video
 * @description Barrel de exportaciones optimizado para Video con patrón EntityWithStats
 */

// 🎬 Tipos principales (solo canónicos)
// 🔄 Inputs y operaciones
// 📊 Estadísticas y estado
export type {
	PaginatedVideos,
	
	VideoBase,
	VideoComplete,
	VideoCreateInput,
	VideoFilters,
	VideoPaginationOptions,
	VideoPlayState,
	VideoRelations,
	VideoStatistics,
	VideoStats,
	VideoUpdateInput,
	VideoWithStats,
} from './types';
// 🎯 Enums
// ⚡ Validación
export {
	VideoCodec,
	VideoFormat,
	VideoQuality,
	VideoSchema,
	VideoSortCriteria,
	VideoViewMode,
} from './types';

// 🟢 Documentación:
// - VideoWithStats es el tipo principal para toda la aplicación
// - VideoComplete solo para casos especiales con relaciones completas
