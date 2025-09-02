/**
 * =================================================================================
 * ORGANIZATION DOMAIN SCHEMA INDEX - DRIZZLE ORM
 * =================================================================================
 * Exportación centralizada de todas las entidades del dominio Organization
 *
 * Tablas incluidas:
 * - groups: Grupos de elementos
 * - albums: Álbumes de contenido
 * - collections: Colecciones de elementos
 * - favorites: Sistema de favoritos
 * - files: Archivos genéricos del sistema
 * =================================================================================
 */

export { files } from '../files/files';
export { albums } from './albums';
export { collections } from './collections';
export { favorites } from './favorites';
export { folders } from './folders';
export { groups } from './groups';
