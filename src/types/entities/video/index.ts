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
    UpdateVideoData,
    // Alias para retrocompatibilidad
    VideoComplete as Video, VideoBase, VideoComplete, VideoCreateInput,
    VideoFilters,
    VideoMetadata,
    VideoRelations,
    VideoUI,
    VideoUpdateInput
} from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.
