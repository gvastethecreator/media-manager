/**
 * @file Exportación del servicio de Videos
 * @module services/video
 * @description Exporta el servicio de videos para uso en la aplicación
 */

// Importar el servicio
import { videoService } from './video/video.service';

// Exportar todo del servicio
export * from './video/video.service';

// Exportar la instancia del servicio con nombre consistente
export { videoService };

// Alias para mantener compatibilidad con código existente
export default videoService;
