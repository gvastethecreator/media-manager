/**
 * @file Exportaciones del servicio de Folder
 * @module services/folder
 * @description Punto de entrada para el servicio de carpetas
 */

// Operaciones CRUD con fetch API (cliente)
export * from './folder-api.service';

// Operaciones de estadísticas con SQL directo (optimizadas)
export * from './folder-stats.service';
