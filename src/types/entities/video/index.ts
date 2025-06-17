/**
 * @file Tipos para la entidad Video
 * @module types/entities/video
 */

// Exportar enums y constantes
export * from './enums';
// Reexportar enums explícitamente para evitar problemas de importación
export { VideoFormat, VideoPrivacyLevel, VideoQuality, VideoType } from './enums';
// Tipos base para estructuras de datos
// Tipos extendidos para UI y visualización
// 🎯 Alias principal para el tipo Video
export type {
	RelatedVideo,
	VideoBase,
	VideoChapter,
	VideoComplete,
	VideoComplete as Video,
	VideoCounts,
	VideoCreateInput,
	VideoFilters,
	VideoMetadata,
	VideoPlaybackState,
	VideoRelations,
	VideoSearchOptions,
	VideoSearchResult,
	VideoTransformerOptions,
	VideoUI,
	VideoUpdateInput,
	VideoValidated,
	VideoVisualConfig,
	VideoVisualConfigComplete,
} from './types';
// Exportar tipos base
export * from './types';
