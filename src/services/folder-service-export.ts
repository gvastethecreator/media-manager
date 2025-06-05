/**
 * @file Exportación del servicio de Folder
 * @module services/folder
 * @description Exporta el servicio de carpetas para uso en la aplicación
 */

// Importar el servicio directamente desde su ubicación actual
import { folderService as service } from './folder/folder.service';

// Exportar todo del servicio
export * from './folder/folder.service';

// Exportar la instancia del servicio
export const folderService = service;

// Alias para mantener compatibilidad con código existente
export default folderService;
