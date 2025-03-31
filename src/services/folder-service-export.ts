/**
 * @file Exportación del servicio de Folder
 * @module services/folder
 * @description Exporta el servicio de carpetas para uso en la aplicación
 */

// Importar el servicio funcional
import * as functionalService from './folder.service.functional';

// Exportar todo del servicio funcional
export * from './folder.service.functional';

// Exportar la instancia del servicio
export const folderService = functionalService.folderService;

// Alias para mantener compatibilidad con código existente
export default folderService;