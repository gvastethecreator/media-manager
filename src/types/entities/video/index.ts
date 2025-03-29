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
  VideoChapter, VideoMetadata, VideoPlayState, VideoVisualConfig
} from './types';

// Tipos extendidos para UI y visualización
export type {
  CreateVideoData, Video
} from './types';

// Tipos completos con campos JSON deserializados
export type {
  VideoComplete, VideoExtendedComplete,
  VideoVisualConfigComplete, VideoWithRelationsComplete
} from './types';

// Alias para el tipo principal (usar el extendido completo por consistencia)
export type { VideoExtendedComplete as Video } from './types';
