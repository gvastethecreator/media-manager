/**
 * @file Punto de entrada para los transformadores de la entidad Album.
 * @module transformers/album
 * @description Exporta la función `toAlbumWithStats` como el transformador canónico.
 * @see /src/transformers/album/mappers.ts
 * @updated 2025-01-27
 */

export { toAlbumWithStats } from './mappers';

// Alias para compatibilidad con rutas del servidor
export { toAlbumWithStats as serializeAlbum } from './mappers';
