/**
 * @file Exportación del servicio de Estadísticas
 * @module services/stats
 * @description Exporta el servicio de estadísticas para uso en la aplicación
 */

// Importar el servicio y sus eventos
import { STATS_EVENTS, statsService as service, statsEventEmitter } from './stats.service';

// Exportar todo del servicio
export * from './stats.service';

// Exportar la instancia del servicio
export const statsService = service;

// Exportar eventos y emitter específicamente para facilitar su uso
export { STATS_EVENTS, statsEventEmitter };

// Alias para mantener compatibilidad con código existente
export default statsService;
