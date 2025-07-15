/**
 * @file Servicio de thumbnails (shim de compatibilidad)
 * @module services/thumbnail
 */

import type { ProcessOptions } from '@/types/thumbnails';

/**
 * Estado de procesamiento de thumbnails
 */
export type ProcessStatus = {
	processed: number;
	total: number;
	current?: string;
	progress: number;
};

/**
 * Error de thumbnail
 */
export type ThumbnailError = {
	message: string;
	code?: string;
	path?: string;
	details?: unknown;
};

/**
 * Servicio básico de thumbnails (implementación mínima)
 */
class ThumbnailService {
	/**
	 * Optimizar thumbnails
	 */
	async optimizeThumbnails(options?: ProcessOptions) {
		// TODO: Implementar funcionalidad completa
		return {
			processed: 0,
			errors: 0,
			options,
		};
	}

	/**
	 * Reprocesar todos los thumbnails
	 */
	async reprocessAll(options?: ProcessOptions) {
		// TODO: Implementar funcionalidad completa
		return {
			processed: 0,
			errors: 0,
			options,
		};
	}

	/**
	 * Limpiar thumbnails
	 */
	async cleanThumbnails(options?: ProcessOptions) {
		// TODO: Implementar funcionalidad completa
		return {
			processed: 0,
			errors: 0,
			options,
		};
	}

	/**
	 * Verificar token firmado
	 */
	async verifySignedToken(token: string) {
		// TODO: Implementar funcionalidad completa
		return {
			valid: false,
			token,
		};
	}

	// Event handlers (stubs)
	onProgress(_handler: (status: ProcessStatus) => void) {
		// TODO: Implementar funcionalidad completa
	}

	onError(_handler: (error: ThumbnailError) => void) {
		// TODO: Implementar funcionalidad completa
	}

	onComplete(_handler: (data: Record<string, unknown>) => void) {
		// TODO: Implementar funcionalidad completa
	}

	onStats(_handler: (stats: Record<string, unknown>) => void) {
		// TODO: Implementar funcionalidad completa
	}

	// Event unsubscribers (stubs)
	offProgress(_handler: (status: ProcessStatus) => void) {
		// TODO: Implementar funcionalidad completa
	}

	offError(_handler: (error: ThumbnailError) => void) {
		// TODO: Implementar funcionalidad completa
	}

	offComplete(_handler: (data: Record<string, unknown>) => void) {
		// TODO: Implementar funcionalidad completa
	}

	offStats(_handler: (stats: Record<string, unknown>) => void) {
		// TODO: Implementar funcionalidad completa
	}
}

/**
 * Instancia singleton del servicio de thumbnails
 */
export const thumbnailService = new ThumbnailService();

// Exports de tipos
export type { ProcessOptions, ProcessStatus, ThumbnailError };
