/**
 * @file Índice de tipos para la entidad Album
 * @module types/entities/album
 * @description Exportaciones centralizadas para tipos de Album
 * @updated 2025-06-21
 */

// Exportar enumeraciones
export * from './enums';
// Re-exportación de tipos extendidos (para compatibilidad con código existente)
export type {
    AlbumComplete,
    AlbumWithStats,
    FolderDistribution,
    ParsedAlbum,
    ParsedAlbumWithRelations
} from './extended';
// Exportar esquemas de validación
export * from './schema';
// Exportar tipos estadísticos
export * from './stats-types';
// Tipo principal para Album (para compatibilidad con código legacy)
export type { Album } from './types';
// Exportar todos los tipos canónicos
export * from './types';

