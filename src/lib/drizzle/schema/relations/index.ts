/**
 * =================================================================================
 * RELATIONS DOMAIN SCHEMA INDEX - DRIZZLE ORM
 * =================================================================================
 * Exportación centralizada de todas las tablas de relaciones
 *
 * Tablas incluidas:
 * - imageAlbums: Relación imagen-álbum
 * - videoAlbums: Relación video-álbum
 * - imageCollections: Relación imagen-colección
 * - videoCollections: Relación video-colección
 * - imageTags: Relación imagen-etiqueta
 * - videoTags: Relación video-etiqueta
 * - imageProperties: Relación imagen-propiedad
 * - videoProperties: Relación video-propiedad
 * - Más relaciones many-to-many del sistema
 * =================================================================================
 */

export { imageAlbums } from './imageAlbums';
export { imageCollections } from './imageCollections';
export { imageProperties } from './imageProperties';
export { imageTags } from './imageTags';
// Exportar helpers para crear nuevas relaciones
export { createRelationTable, type RelationTable } from './relation-helpers';
// Importar las relaciones restantes desde remainingRelations
export * from './remainingRelations';
export { videoAlbums } from './videoAlbums';
export { videoCollections } from './videoCollections';
export { videoProperties } from './videoProperties';
export { videoTags } from './videoTags';
