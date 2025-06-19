/**
 * @file Exportaciones principales de tipos para la entidad Image
 * @module types/entities/image
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types'.
 * Legacy eliminado.
 */

export { ImageSchema } from './types';
export type {
    CreateImageData,
    // Alias para retrocompatibilidad
    ImageComplete as Image, ImageAIMetadata,
    ImageBase,
    ImageComplete, ImageCreateInput,
    ImageExtended,
    ImageFilters,
    ImageMetadata,
    ImageSearchOptions,
    ImageSearchResult,
    ImageStatsBase,
    ImageTransformerOptions,
    ImageUpdateInput,
    ImageVisualConfigBase,
    UpdateImageData
} from './types';

// 📝 Documentación: Solo tipos canónicos. Legacy removido.
