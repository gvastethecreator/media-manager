/**
 * @file Exportación del servicio de Configuración
 * @module services/settings
 * @description Exporta el servicio de configuración para uso en la aplicación
 */

// Importar el servicio
import { settingsService as service } from './settings.service';

// Exportar todo del servicio
export * from './settings.service';

// Exportar la instancia del servicio
export const settingsService = service;

// Alias para mantener compatibilidad con código existente
export default settingsService;