/**
 * @file Punto de entrada para los transformadores de la entidad Album.
 * @module transformers/album
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Album.
 */

// De mappers.ts
export { mapCreateAlbumDataToPrisma, mapUpdateAlbumDataToPrisma } from './mappers';

// De transformer.ts
export { fromPrismaAlbum, fromPrismaAlbums } from './transformer';

