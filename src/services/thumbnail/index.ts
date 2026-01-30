/**
 * @file Índice del servicio de thumbnails
 * @module services/thumbnail
 * @description Exporta el servicio unificado de thumbnails y utilidades relacionadas
 */

// Exportar también el servicio legacy por compatibilidad
export { thumbnailService } from '../image/image-thumbnail.service';
// Servicio unificado
// Re-exportar thumbnailUnifiedService como thumbnailService para código que espera
// el servicio con métodos legacy
export {
	type ThumbnailEntityType,
	type ThumbnailInfo,
	type ThumbnailOptions,
	type ThumbnailResult,
	ThumbnailUnifiedService,
	thumbnailUnifiedService,
	thumbnailUnifiedService as thumbnailUnified,
} from './thumbnail-unified.service';
// Tipos (Legacy compatibility)
export type {
	ProcessStatus,
	ThumbnailError,
	ThumbnailProcessOptions,
	ThumbnailStats,
} from './types';

// Event emitter mock para compatibilidad (el código legacy usa eventos)
class ThumbnailEventEmitter {
	private listeners: Map<string, Array<(data: any) => void>> = new Map();

	on(event: string, callback: (data: any) => void): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)!.push(callback);
	}

	off(event: string, callback: (data: any) => void): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			const index = listeners.indexOf(callback);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	emit(event: string, data: any): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			listeners.forEach((callback) => callback(data));
		}
	}

	// Métodos específicos para compatibilidad
	onProgress(callback: (status: any) => void): void {
		this.on('progress', callback);
	}
	offProgress(callback: (status: any) => void): void {
		this.off('progress', callback);
	}
	onError(callback: (error: any) => void): void {
		this.on('error', callback);
	}
	offError(callback: (error: any) => void): void {
		this.off('error', callback);
	}
	onComplete(callback: (data: any) => void): void {
		this.on('complete', callback);
	}
	offComplete(callback: (data: any) => void): void {
		this.off('complete', callback);
	}
	onStats(callback: (stats: any) => void): void {
		this.on('stats', callback);
	}
	offStats(callback: (stats: any) => void): void {
		this.off('stats', callback);
	}

	// Métodos del servicio legacy que no existen
	async optimizeThumbnails(_options?: any): Promise<any> {
		return { success: true, message: 'Not implemented' };
	}

	async reprocessAll(_options?: any): Promise<any> {
		return { success: true, message: 'Not implemented' };
	}

	async cleanThumbnails(_options?: any): Promise<any> {
		return { success: true, message: 'Not implemented' };
	}
}

// Exportar el event emitter como thumbnailService para compatibilidad
export const thumbnailEventService = new ThumbnailEventEmitter();
