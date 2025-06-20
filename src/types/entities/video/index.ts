/**
 * @file Tipos para la entidad Video
 * @module types/entities/video
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types' y enums desde './enums'.
 * Legacy eliminado.
 */

export * from './enums';
export { VideoSchema } from './types';
export type {
	CreateVideoData,
	PaginatedVideos,
	UpdateVideoData,
	// Alias para retrocompatibilidad
	VideoComplete as Video,
	VideoBase,
	VideoComplete,
	VideoCreateInput,
	VideoExtended,
	VideoFilters,
	VideoMetadata,
	VideoPaginationOptions,
	VideoRelations,
	VideoStats,
	VideoUI,
	VideoUpdateInput,
} from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.
