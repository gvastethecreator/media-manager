/**
 * @file Exportación del servicio de Toast
 * @module services/toast
 * @description Exporta el servicio de notificaciones toast para uso en la aplicación
 */

// Importar el servicio directamente desde su ubicación actual
import toastService from './toast.service';

// Exportar todo del servicio
export * from './toast.service';

// Exportar la instancia del servicio
export { toastService };

// Alias para mantener compatibilidad con código existente
export default toastService;