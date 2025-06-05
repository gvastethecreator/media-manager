import { getImageUrl } from '@/app/actions/images';
import { getThumbnail } from '@/app/actions/thumbnails/thumbnails.actions';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { clientLogger } from '@/lib/logger/client-logger';
import { create } from 'zustand';

const resourceLogger = clientLogger.withContext('ImageResources');

// Configuración optimizada
const CACHE_CONFIG = {
	maxAge: 5 * 60 * 1000, // 5 minutos
	cleanupInterval: 60 * 1000, // 1 minuto
	maxQueueSize: 10,
	preloadDelay: 500,
	retryDelay: 2000,
	maxRetries: 3,
	maxCacheSize: 100, // Máximo número de items en caché
};

// Sistema de caché LRU optimizado
class LRUCache<K, V> {
	private cache: Map<K, { value: V; timestamp: number }>;
	private maxSize: number;

	constructor(maxSize: number) {
		this.cache = new Map();
		this.maxSize = maxSize;
	}

	get(key: K): V | undefined {
		const item = this.cache.get(key);
		if (item) {
			// Actualizar timestamp y mover al final (más reciente)
			this.cache.delete(key);
			this.cache.set(key, { ...item, timestamp: Date.now() });
			return item.value;
		}
		return undefined;
	}

	set(key: K, value: V): void {
		if (this.cache.size >= this.maxSize) {
			// Eliminar el item más antiguo
			const oldestKey = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
			this.cache.delete(oldestKey);
		}
		this.cache.set(key, { value, timestamp: Date.now() });
	}

	has(key: K): boolean {
		return this.cache.has(key);
	}

	clear(): void {
		this.cache.clear();
	}

	cleanup(maxAge: number): void {
		const now = Date.now();
		for (const [key, item] of this.cache.entries()) {
			if (now - item.timestamp > maxAge) {
				this.cache.delete(key);
			}
		}
	}
}

interface ImageResource {
	id: string;
	thumbnail?: string;
	originalUrl?: string;
	isLoading: boolean;
	error?: string;
	lastUpdate: number;
	dimensions?: {
		width: number;
		height: number;
	};
}

interface ImageResourcesState {
	resources: LRUCache<string, ImageResource>;
	loadingQueue: Set<string>;
	preloadQueue: string[];
	isProcessing: boolean;

	// Métodos principales
	getThumbnail: (id: string) => Promise<string | undefined>;
	getOriginalUrl: (id: string) => Promise<string | undefined>;
	preloadResources: (ids: string[]) => void;
	isLoading: (id: string) => boolean;
	clearResources: () => void;
}

export const useImageResources = create<ImageResourcesState>((set, get) => {
	// Crear instancia de caché LRU
	const cache = new LRUCache<string, ImageResource>(CACHE_CONFIG.maxCacheSize);
	let cleanupInterval: NodeJS.Timeout;

	// Iniciar limpieza periódica
	const startCleanup = () => {
		if (cleanupInterval) {
			clearInterval(cleanupInterval);
		}
		cleanupInterval = setInterval(() => {
			cache.cleanup(CACHE_CONFIG.maxAge);
		}, CACHE_CONFIG.cleanupInterval);
	};

	// Iniciar limpieza
	startCleanup();

	return {
		resources: cache,
		loadingQueue: new Set(),
		preloadQueue: [],
		isProcessing: false,

		getThumbnail: async (id: string) => {
			const state = get();

			// Validar que el ID sea válido antes de proceder
			if (!id || typeof id !== 'string' || id.trim() === '') {
				resourceLogger.error('Intento de cargar thumbnail con ID inválido:', { id });
				return undefined;
			}

			// Verificar si el recurso ya está en caché
			const resource = state.resources.get(id);

			// Agregar más logging para diagnóstico
			if (resource) {
				resourceLogger.debug(
					`Recurso encontrado en caché para ID: ${id}, tiene thumbnail: ${!!resource.thumbnail}, error: ${resource.error || 'ninguno'}`
				);
			} else {
				resourceLogger.debug(`Recurso no encontrado en caché para ID: ${id}, intentando cargar...`);
			}

			// Si ya tenemos el thumbnail y no está expirado, retornarlo
			if (resource?.thumbnail && Date.now() - resource.lastUpdate < CACHE_CONFIG.maxAge) {
				resourceLogger.debug(`Devolviendo thumbnail en caché para ID: ${id}`);
				return resource.thumbnail;
			}

			// Si ya está en cola de carga, esperar
			if (state.loadingQueue.has(id)) {
				resourceLogger.debug(`ID ${id} ya está en cola de carga, esperando...`);
				return new Promise((resolve) => {
					let attempts = 0;
					const checkInterval = setInterval(() => {
						attempts++;
						const updatedResource = state.resources.get(id);
						resourceLogger.debug(
							`Intento ${attempts}/${CACHE_CONFIG.maxRetries} esperando thumbnail para ID ${id}, thumbnail disponible: ${!!updatedResource?.thumbnail}`
						);

						if (updatedResource?.thumbnail || attempts >= CACHE_CONFIG.maxRetries) {
							clearInterval(checkInterval);
							if (updatedResource?.thumbnail) {
								resourceLogger.debug(`Se ha encontrado el thumbnail para ID ${id} después de esperar`);
							} else {
								resourceLogger.warn(`⚠️ Se ha excedido el tiempo de espera para ID ${id}`);
							}
							resolve(updatedResource?.thumbnail);
						}
					}, CACHE_CONFIG.retryDelay);
				});
			}

			try {
				state.loadingQueue.add(id);
				resourceLogger.info('Solicitando thumbnail:', { id, quality: ThumbnailQuality.MEDIUM });

				// Asegurarse de que se use un valor válido de ThumbnailQuality
				const quality = ThumbnailQuality.MEDIUM;
				let data;

				try {
					data = await getThumbnail(id, quality);
				} catch (requestError) {
					resourceLogger.error(`Error en la solicitud de thumbnail para ID ${id}:`, requestError);
					// Propagar el error para que se maneje en el catch exterior
					throw requestError;
				}

				if (!data) {
					throw new Error(`No se recibieron datos para el thumbnail ${id}`);
				}

				if (data?.thumbnail) {
					const thumbnailUrl = `data:${data.mimeType || 'image/webp'};base64,${data.thumbnail}`;

					const newResource: ImageResource = {
						id,
						thumbnail: thumbnailUrl,
						isLoading: false,
						lastUpdate: Date.now(),
						dimensions: {
							width: data.width || 0,
							height: data.height || 0,
						},
					};

					state.resources.set(id, newResource);
					resourceLogger.info(`✅ Thumbnail cargado correctamente para ID ${id}`);
					return thumbnailUrl;
				}

				// Si llegamos aquí, no hay thumbnail pero podría haber un error
				if (data?.error) {
					resourceLogger.error('Error desde el servidor al cargar thumbnail:', { id, error: data.error });
					const errorResource: ImageResource = {
						id,
						isLoading: false,
						error: data.error,
						lastUpdate: Date.now(),
					};
					state.resources.set(id, errorResource);
					throw new Error(data.error);
				}
					throw new Error(`No se pudo cargar el thumbnail para ID ${id}, sin error específico`);
			} catch (error) {
				resourceLogger.error('Error al cargar thumbnail:', {
					id,
					error: error instanceof Error ? error.message : 'Error desconocido',
				});
				const errorResource: ImageResource = {
					id,
					isLoading: false,
					error: error instanceof Error ? error.message : 'Error desconocido',
					lastUpdate: Date.now(),
				};
				state.resources.set(id, errorResource);
				throw error; // Propagamos el error para que el componente pueda manejarlo
			} finally {
				state.loadingQueue.delete(id);
			}
		},

		getOriginalUrl: async (id: string) => {
			const state = get();
			const resource = state.resources.get(id);

			// Si ya tenemos la URL original y no está expirada, retornarla
			if (resource?.originalUrl && Date.now() - resource.lastUpdate < CACHE_CONFIG.maxAge) {
				return resource.originalUrl;
			}

			try {
				const url = await getImageUrl(id);
				if (url) {
					const existingResource = state.resources.get(id) || {
						id,
						isLoading: false,
						lastUpdate: Date.now(),
					};
					const updatedResource = {
						...existingResource,
						originalUrl: url,
						lastUpdate: Date.now(),
					};
					state.resources.set(id, updatedResource);
					return url;
				}
			} catch (error) {
				resourceLogger.error('Error loading original URL:', { id, error });
				const existingResource = state.resources.get(id) || {
					id,
					isLoading: false,
					lastUpdate: Date.now(),
				};
				const errorResource = {
					...existingResource,
					error: error instanceof Error ? error.message : 'Unknown error',
					lastUpdate: Date.now(),
				};
				state.resources.set(id, errorResource);
			}
		},

		preloadResources: (ids: string[]) => {
			const state = get();
			if (state.isProcessing) {
				return;
			}

			// Filtrar IDs vacíos o invalidos
			const validIds = ids.filter((id) => id && typeof id === 'string' && id.trim() !== '');

			// Filtrar IDs que ya están en caché y son recientes
			const newIds = validIds.filter((id) => {
				const resource = state.resources.get(id);
				return !resource?.thumbnail || Date.now() - resource.lastUpdate > CACHE_CONFIG.maxAge;
			});

			if (newIds.length === 0) {
				return;
			}

			set({
				preloadQueue: [...state.preloadQueue, ...newIds].slice(0, CACHE_CONFIG.maxQueueSize),
				isProcessing: true,
			});

			// Procesar cola de precarga con rate limiting
			const processQueue = async () => {
				const currentState = get();
				if (currentState.preloadQueue.length === 0) {
					set({ isProcessing: false });
					return;
				}

				const id = currentState.preloadQueue[0];

				// Verificar que el ID sea válido antes de procesarlo
				if (id && typeof id === 'string' && id.trim() !== '') {
					await currentState.getThumbnail(id);
				} else {
					resourceLogger.warn('ID inválido en cola de precarga, omitiendo:', { id });
				}

				set((state) => ({
					preloadQueue: state.preloadQueue.slice(1),
				}));

				// Rate limiting para la precarga
				setTimeout(processQueue, CACHE_CONFIG.preloadDelay);
			};

			processQueue();
		},

		isLoading: (id: string) => {
			const state = get();
			return state.loadingQueue.has(id);
		},

		clearResources: () => {
			const state = get();
			state.resources.clear();
			if (cleanupInterval) {
				clearInterval(cleanupInterval);
			}
			set({
				loadingQueue: new Set(),
				preloadQueue: [],
				isProcessing: false,
			});
			startCleanup();
		},
	};
});
