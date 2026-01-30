/**
 * =================================================================================
 * DRIZZLE SCHEMA - SISTEMA MODULAR
 * =================================================================================
 * Este archivo actúa como punto de entrada principal para el esquema modularizado.
 * Todas las definiciones de tablas están organizadas por dominio en /schema/
 *
 * Estructura modular:
 * - Core: Tablas fundamentales (profiles, settings, queueJobs)
 * - Media: Archivos multimedia (folders, images, videos, uploadedImages)
 * - Organization: Organización de contenido (albums, collections, groups, favorites, files)
 * - Taxonomy: Clasificación (tags, properties, wildcards, prompts, notes)
 * - Worldbuilding: Construcción de mundos (characters, places, concepts, worldItems)
 * - Content: Contenido adicional (imageStats, activities, audios, documents, etc.)
 * - Relations: Relaciones many-to-many entre entidades
 * =================================================================================
 */

// =================================================================================
// IMPORTACIONES DEL SISTEMA MODULAR
// =================================================================================
// Importar y re-exportar todas las tablas del sistema modular
export * from './schema/index';
