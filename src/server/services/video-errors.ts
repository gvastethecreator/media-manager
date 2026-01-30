/**
 * @file Errores personalizados para operaciones de videos
 * @module server/services/video-errors
 */

/**
 * Función auxiliar para crear errores de video
 */
export const createVideoError = (message: string, code = 'VIDEO_ERROR'): Error => {
	return new Error(`[${code}] ${message}`);
};
