/**
 * @file Exportación del servicio de Videos
 * @module services/video
 * @description Exporta el servicio de videos para uso en la aplicación
 */

// Importar el servicio
import { VideoService } from './video.service';

// Exportar todo del servicio
export * from './video.service';

// Exportar la instancia del servicio con nombre consistente
export const videoService = VideoService;

// Alias para mantener compatibilidad con código existente
export default VideoService;
