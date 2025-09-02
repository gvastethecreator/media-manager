/**
 * =================================================================================
 * CORE DOMAIN SCHEMA INDEX - DRIZZLE ORM
 * =================================================================================
 * Exportación centralizada de todas las entidades del dominio Core
 *
 * Tablas incluidas:
 * - queueJobs: Sistema de colas de trabajo
 * - profiles: Perfiles de usuario
 * - settings: Configuraciones del sistema
 * - activities: Actividades del sistema
 * - metadatas: Metadatos del sistema
 * - fileStats: Estadísticas por archivo
 * =================================================================================
 */

export { activities } from './activities';
export { fileStats } from './fileStats';
export { metadatas } from './metadatas';
export { profiles } from './profiles';
export { queueJobs } from './queueJobs';
export { settings } from './settings';
export { thumbnails } from './thumbnails';
