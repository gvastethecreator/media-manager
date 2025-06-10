/**
 * @file Tipos para la entidad Video
 * @module types/entities/video
 */

// Exportar enums y constantes
export * from './enums';

// Exportar tipos base
export * from './types';

// Reexportar enums explícitamente para evitar problemas de importación
export { VideoFormat, VideoPrivacyLevel, VideoQuality, VideoType } from './enums';

// Tipos base para estructuras de datos
export type {
    VideoBase,
    VideoChapter,
    VideoMetadata,
    VideoPlayState,
    VideoVisualConfig
} from './types';

// Tipos extendidos para UI y visualización
export type {
    VideoComplete,
    VideoCreateInput,
    VideoUpdateInput,
    VideoSearchOptions,
    VideoSearchResult,
    VideoTransformerOptions,
    RelatedVideo,
    VideoVisualConfigComplete,
    VideoValidated,
    VideoRelations,
    VideoCounts,
    VideoUI,
    VideoFilters
} from './types';

// 🎯 Alias principal para el tipo Video
export type { VideoComplete as Video } from './types';

