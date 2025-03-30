import { getThumbnail } from '@/app/actions/thumbnails/thumbnails.actions';
import { THUMBNAIL_QUALITY_CONFIG, ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { createHmac } from 'crypto';
import fs from 'fs/promises';

const thumbLogger = serverLogger.withContext('ThumbnailService');

export { THUMBNAIL_QUALITY_CONFIG, ThumbnailQuality };

export enum EVENTS {
	PROGRESS = 'progress',
	ERROR = 'error',
	COMPLETE = 'complete',
	STATS = 'stats',
}

export interface ThumbnailError {
	imageId: string;
	imagePath: string;
	error: string;
	timestamp: Date | string;
}

export type ThumbnailErrorType = {
	imageId: string;
	imagePath: string;
	error: string;
	timestamp: Date | string;
};

export interface ProcessOptions {
	onProgress?: (status: ProcessStatus) => void;
	onError?: (error: ThumbnailError) => void;
	onComplete?: (data: Record<string, unknown>) => void;
	onStats?: (stats: Record<string, unknown>) => void;
}

export interface ProcessStatus {
	status?: string;
	currentFile?: string;
	current?: number;
	total?: number;
	progress?: number;
	lastProcessed?: {
		id: string;
		path: string;
		processedAt: string;
		saved?: number;
	};
}

// Nueva implementación sin extender de EventEmitter
class ThumbnailService {
	private static instance: ThumbnailService;
	private isProcessing = false;
	private readonly SECRET_KEY = process.env.THUMBNAIL_SECRET_KEY || 'default-secret-key';
	private eventCallbacks = new Map<string, Set<CallableFunction>>();

	private constructor() {
		thumbLogger.info('🚀 Inicializando ThumbnailService');
	}

	static getInstance(): ThumbnailService {
		if (!ThumbnailService.instance) {
			ThumbnailService.instance = new ThumbnailService();
		}
		return ThumbnailService.instance;
	}

	// Métodos auxiliares para gestionar callbacks
	private addCallback(event: string, callback: CallableFunction): void {
		if (!this.eventCallbacks.has(event)) {
			this.eventCallbacks.set(event, new Set());
		}
		this.eventCallbacks.get(event)?.add(callback);
	}

	private removeCallback(event: string, callback: CallableFunction): void {
		this.eventCallbacks.get(event)?.delete(callback);
	}

	// Método para emitir eventos - reemplaza this.emit de EventEmitter
	private async emitEvent(event: string, ...args: unknown[]): Promise<void> {
		// Primero notificar a los callbacks locales
		const callbacks = this.eventCallbacks.get(event);
		if (callbacks) {
			for (const callback of callbacks) {
				try {
					callback(...args);
				} catch (error) {
					thumbLogger.error(`Error al ejecutar callback para evento ${event}:`, error);
				}
			}
		}

		// Mapeo de eventos locales a eventos del sistema central
		let serverEventType: EventType | null = null;
		switch (event) {
			case EVENTS.PROGRESS:
				serverEventType = 'folder:progress';
				break;
			case EVENTS.ERROR:
				serverEventType = 'folder:error';
				break;
			case EVENTS.COMPLETE:
				serverEventType = 'folder:complete';
				break;
			case EVENTS.STATS:
				serverEventType = 'folder:stats';
				break;
			default:
				serverEventType = null;
		}

		// Emitir al sistema central si hay mapeo
		if (serverEventType) {
			try {
				await emit({
					type: serverEventType,
					data: args[0],
				});
				thumbLogger.debug(`Evento ${event} emitido al sistema central como ${serverEventType}`);
			} catch (emitError) {
				thumbLogger.error(`Error al emitir evento ${event} al sistema central:`, emitError);
			}
		}
	}

	// Métodos de eventos
	onProgress(callback: (status: ProcessStatus) => void): void {
		this.addCallback(EVENTS.PROGRESS, callback);
	}

	offProgress(callback: (status: ProcessStatus) => void): void {
		this.removeCallback(EVENTS.PROGRESS, callback);
	}

	onError(callback: (error: ThumbnailError) => void): void {
		this.addCallback(EVENTS.ERROR, callback);
	}

	offError(callback: (error: ThumbnailError) => void): void {
		this.removeCallback(EVENTS.ERROR, callback);
	}

	onComplete(callback: (data: Record<string, unknown>) => void): void {
		this.addCallback(EVENTS.COMPLETE, callback);
	}

	offComplete(callback: (data: Record<string, unknown>) => void): void {
		this.removeCallback(EVENTS.COMPLETE, callback);
	}

	onStats(callback: (stats: Record<string, unknown>) => void): void {
		this.addCallback(EVENTS.STATS, callback);
	}

	offStats(callback: (stats: Record<string, unknown>) => void): void {
		this.removeCallback(EVENTS.STATS, callback);
	}

	private setupEventHandlers(callbacks?: ProcessOptions) {
		if (callbacks?.onProgress) {
			this.onProgress(callbacks.onProgress);
		}
		if (callbacks?.onError) {
			this.onError(callbacks.onError);
		}
		if (callbacks?.onComplete) {
			this.onComplete(callbacks.onComplete);
		}
		if (callbacks?.onStats) {
			this.onStats(callbacks.onStats);
		}

		return () => {
			if (callbacks?.onProgress) {
				this.offProgress(callbacks.onProgress);
			}
			if (callbacks?.onError) {
				this.offError(callbacks.onError);
			}
			if (callbacks?.onComplete) {
				this.offComplete(callbacks.onComplete);
			}
			if (callbacks?.onStats) {
				this.offStats(callbacks.onStats);
			}
		};
	}

	private getFullUrl(path: string): string {
		const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
		const normalizedPath = path.startsWith('/') ? path : `/${path}`;
		return new URL(normalizedPath, baseUrl).toString();
	}

	private async fetchWithTimeout(input: string, init?: RequestInit & { timeout?: number }): Promise<Response> {
		const { timeout = 45000, ...restInit } = init || {};
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), timeout);

		try {
			const url = this.getFullUrl(input);
			const response = await fetch(url, {
				...restInit,
				signal: controller.signal,
			});
			clearTimeout(id);
			return response;
		} catch (error) {
			clearTimeout(id);
			throw error;
		}
	}

	private async handleProcess(endpoint: string, callbacks?: ProcessOptions): Promise<void> {
		if (this.isProcessing) {
			const error = new Error('Ya hay un proceso en ejecución');
			await this.emitEvent(EVENTS.ERROR, error);
			throw error;
		}

		this.isProcessing = true;
		const cleanup = this.setupEventHandlers(callbacks);
		let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

		try {
			// Iniciar con un estado de progreso
			await this.emitEvent(EVENTS.PROGRESS, {
				status: 'Iniciando proceso...',
				progress: 0,
			});

			const response = await this.fetchWithTimeout(endpoint, { timeout: 300000 });
			if (!response.ok || !response.body) {
				throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
			}

			reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			// Leer el stream
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}

				const chunk = decoder.decode(value, { stream: true });
				buffer += chunk;

				// Procesar líneas completas
				let lineEnd = -1;
				while (true) {
					lineEnd = buffer.indexOf('\n');
					if (lineEnd === -1) {
						break;
					}

					const line = buffer.slice(0, lineEnd).trim();
					buffer = buffer.slice(lineEnd + 1);

					if (!line) {
						continue;
					}

					try {
						// Formato esperado: event:data
						const colonIndex = line.indexOf(':');
						if (colonIndex === -1) {
							continue;
						}

						const event = line.slice(0, colonIndex).trim();
						const dataStr = line.slice(colonIndex + 1).trim();
						const parsedData = JSON.parse(dataStr);

						switch (event) {
							case EVENTS.PROGRESS:
								await this.emitEvent(EVENTS.PROGRESS, parsedData);
								break;
							case EVENTS.ERROR:
								await this.emitEvent(EVENTS.ERROR, parsedData);
								break;
							case EVENTS.COMPLETE:
								await this.emitEvent(EVENTS.COMPLETE, parsedData);
								break;
							case EVENTS.STATS:
								await this.emitEvent(EVENTS.STATS, parsedData);
								break;
						}
					} catch (e) {
						thumbLogger.warn('Error procesando línea:', { line, error: e });
					}
				}
			}

			// Cerrar reader
			if (reader) {
				try {
					await reader.cancel();
				} catch (e) {
					thumbLogger.warn('Error cancelando reader:', e);
				}
			}

			await this.emitEvent(EVENTS.COMPLETE, { success: true });
		} catch (error) {
			const errorInfo = {
				error: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString(),
			};
			await this.emitEvent(EVENTS.ERROR, errorInfo);
			thumbLogger.error('Error en el proceso:', error);
		} finally {
			this.isProcessing = false;
			// Limpiar los event handlers
			cleanup();
		}
	}

	// Método para optimizar todas las miniaturas
	async optimizeThumbnails(options: ProcessOptions = {}): Promise<void> {
		thumbLogger.info('🔄 Iniciando optimización de miniaturas');
		return this.handleProcess('/api/thumbnails/optimize', options);
	}

	// Método para limpiar miniaturas huérfanas
	async cleanThumbnails(options: ProcessOptions = {}): Promise<void> {
		thumbLogger.info('🧹 Iniciando limpieza de miniaturas huérfanas');
		return this.handleProcess('/api/thumbnails/clean', options);
	}

	// Método para reprocesar todas las miniaturas
	async reprocessAll(options: ProcessOptions = {}): Promise<void> {
		thumbLogger.info('🔄 Iniciando reprocesamiento de todas las miniaturas');
		return this.handleProcess('/api/thumbnails/reprocess', options);
	}

	async getThumbnail(imageId: string, quality: ThumbnailQuality): Promise<string> {
		try {
			thumbLogger.info('🔄 Obteniendo thumbnail:', { imageId, quality });

			// Validar calidad
			const validQualities = Object.values(ThumbnailQuality);
			if (!validQualities.includes(quality as ThumbnailQuality)) {
				thumbLogger.error('❌ Calidad de thumbnail inválida:', { quality, validQualities });
				throw new Error(`Calidad de thumbnail no válida. Debe ser una de: ${validQualities.join(', ')}`);
			}

			const config = THUMBNAIL_QUALITY_CONFIG[quality as ThumbnailQuality];
			if (!config) {
				throw new Error(`Configuración no encontrada para la calidad: ${quality}`);
			}

			const response = await getThumbnail(imageId, quality as ThumbnailQuality);
			if (!response) {
				throw new Error('No se pudo obtener el thumbnail');
			}

			thumbLogger.info('✅ Thumbnail obtenido:', {
				imageId,
				size: response.size,
				quality,
			});

			return response.thumbnail;
		} catch (error) {
			thumbLogger.error('❌ Error en getThumbnail:', {
				imageId,
				quality,
				error: error instanceof Error ? error.message : 'Error desconocido',
			});
			throw error;
		}
	}

	async verifySignedToken(token: string): Promise<{ buffer: Buffer; mimeType: string }> {
		try {
			thumbLogger.info('🔄 Verificando token firmado:', token);

			// Decodificar el token
			const [signature, payload] = token.split('.');
			if (!signature || !payload) {
				throw new Error('Token inválido');
			}

			// Decodificar el payload
			const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
			const data = JSON.parse(decodedPayload);

			// Verificar que el token no haya expirado
			if (data.exp && Date.now() > data.exp) {
				throw new Error('Token expirado');
			}

			// Generar firma para comparar
			const hmac = createHmac('sha256', this.SECRET_KEY);
			hmac.update(payload);
			const expectedSignature = hmac.digest('base64url');

			// Verificar firma
			if (signature !== expectedSignature) {
				throw new Error('Firma inválida');
			}

			// Obtener la imagen original
			const imageBuffer = await fs.readFile(data.path);
			const mimeType = data.mimeType || 'image/jpeg';

			thumbLogger.info('✅ Token verificado correctamente');
			return { buffer: imageBuffer, mimeType };
		} catch (error) {
			thumbLogger.error('❌ Error verificando token:', error);
			throw new Error('Token inválido o expirado');
		}
	}
}

export const thumbnailService = ThumbnailService.getInstance();
