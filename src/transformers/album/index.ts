/**
 * @file Punto de entrada para los transformadores de la entidad Album.
 * @module transformers/album
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 *
 * Estado de migración:
 * - ✅ Mappers: Convertidos a tipos Drizzle
 
 * - ✅ Validators: Usando tipos locales
 * - ✅ Schema: Esquemas Zod puros
 * - ✅ Documentación: Actualizada a Drizzle
 */

// Exportar todas las funciones de transformación
export * from './mappers';
// Alias para compatibilidad con rutas del servidor
export { toAlbumWithStats as serializeAlbum } from './mappers';
export * from './schema';
export * from './serializers';
export * from './validators';
