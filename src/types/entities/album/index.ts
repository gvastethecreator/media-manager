/**
 * @file Índice de tipos para la entidad Album
 * @module types/entities/album
 * @description Exportaciones centralizadas para tipos de Album
 * @updated 2025-06-21
 */

// Exportar todos los tipos canónicos
export * from './types';

// Exportar enumeraciones
export * from './enums';

// Exportar tipos estadísticos
export * from './stats-types';

// Re-exportación de tipos extendidos (para compatibilidad con código existente)
export type {
    AlbumComplete,
    AlbumWithStats,
    FolderDistribution,
    ParsedAlbum,
    ParsedAlbumWithRelations
} from './extended';

// Tipo principal para Album (para compatibilidad con código legacy)
export type { Album } from './types';

/**
 * 📊 Configuración visual de álbum
 * Para compatibilidad con código existente
 */
export interface AlbumVisualConfig {
  view: string;
  sortBy: string;
  filters: string;
  lastViewedId: string | null;
  expandedIds: string[];
  selectedIds: string[];
}
