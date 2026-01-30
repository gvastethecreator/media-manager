/**
 * @file Servicio de eventos para thumbnails
 * @module services/thumbnail/thumbnail-events.service
 * @description Event emitter para thumbnails para compatibilidad con código existente
 */

import type { ProcessStatus, ThumbnailError } from './types';

/**
 * Event emitter para thumbnails (Legacy compatibility)
 */
class ThumbnailEventEmitter {
	private readonly listeners: Map<string, Array<(data: any) => void>> = new Map();

	on(event: string, callback: (data: any) => void): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)?.push(callback);
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
	onProgress(callback: (status: ProcessStatus) => void): void {
		this.on('progress', callback);
	}
	offProgress(callback: (status: ProcessStatus) => void): void {
		this.off('progress', callback);
	}
	onError(callback: (error: ThumbnailError) => void): void {
		this.on('error', callback);
	}
	offError(callback: (error: ThumbnailError) => void): void {
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
