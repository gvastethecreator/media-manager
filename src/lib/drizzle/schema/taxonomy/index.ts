/**
 * =================================================================================
 * TAXONOMY DOMAIN SCHEMA INDEX - DRIZZLE ORM
 * =================================================================================
 * Exportación centralizada de todas las entidades del dominio Taxonomy
 *
 * Tablas incluidas:
 * - tags: Etiquetas para clasificación
 * - properties: Propiedades de elementos
 * - wildcards: Comodines para búsquedas
 * - prompts: Prompts para generación
 * - notes: Notas del sistema
 * =================================================================================
 */

export { tags } from '../organization/tags';
export { notes } from './notes';
export { prompts } from './prompts';
export { properties } from './properties';
export { wildcards } from './wildcards';
export { taxonomyArtifactDeletionLedger, taxonomyArtifactMutationPermits, taxonomyArtifacts } from './artifacts';
