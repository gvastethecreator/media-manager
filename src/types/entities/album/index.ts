/**
 * @file Exportaciones principales de tipos para la entidad Album
 * @module types/entities/album
 */

export * from './enums';
export * from './extended';
export * from './types';

// Reexportar tipos extendidos explícitamente para facilitar su uso
export type { AlbumComplete, AlbumWithStats } from './extended';

// Reexportar enums explícitamente para solucionar problemas de importación
export { AlbumDisplayState, AlbumPrivacyLevel, AlbumSortCriteria, AlbumType, AlbumViewMode } from './enums';

