/**
 * @file Exportación del servicio de Miniaturas
 * @module services/thumbnail
 * @description Exporta el servicio de generación de miniaturas para uso en la aplicación
 */

// Importar el servicio y sus tipos
import { type ProcessOptions, type ProcessStatus, type ThumbnailError, thumbnailService as service } from './thumbnail.service';

// Exportar todo del servicio
export * from './thumbnail.service';

// Exportar la instancia del servicio
export const thumbnailService = service;

// Exportar tipos específicamente para facilitar su uso
export type { ProcessOptions, ProcessStatus, ThumbnailError };

// Alias para mantener compatibilidad con código existente
export default thumbnailService;