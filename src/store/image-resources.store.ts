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
			// No modificar la caché aquí. Solo retornar el valor.
			return item.value;
		}
		return undefined;
	}

	set(key: K, value: V): void {
		if (this.cache.has(key)) {
			this.cache.delete(key); // Eliminar para asegurar que se añada al final (más reciente)
		} else if (this.cache.size >= this.maxSize) {
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

	// Nuevo método para 'tocar' un ítem, actualizando su 'recencia' (lógica LRU)
	touch(key: K): void {
		const item = this.cache.get(key);
		if (item) {
			// Mover al final (más reciente) y actualizar timestamp
			this.cache.delete(key);
			this.cache.set(key, { ...item, timestamp: Date.now() });
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
	version: number;

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
		version: 0,

		getThumbnail: async (id: string) => {
			const state = get();

			// Validar que el ID sea válido antes de proceder
			if (!id || typeof id !== 'string' || id.trim() === '') {
				resourceLogger.error('Intento de cargar thumbnail con ID inválido:', { id });
				return undefined;
			}

			// Verificar si el recurso ya está en caché, usando la instancia correcta
			const resource = state.resources.get(id);

			// Si ya tenemos el thumbnail y no está expirado, retornarlo
			if (resource?.thumbnail && Date.now() - resource.lastUpdate < CACHE_CONFIG.maxAge) {
				state.resources.touch(id); // ✨ Tocarlo inmediatamente si se sirve desde la caché, usando la instancia correcta
				return resource.thumbnail;
			}

			// Si ya está en cola de carga, esperar
			if (state.loadingQueue.has(id)) {
				return new Promise((resolve) => {
					let attempts = 0;
					const checkInterval = setInterval(() => {
						attempts++;
						const updatedResource = state.resources.get(id); // Usar la instancia correcta de caché

						if (updatedResource?.thumbnail || attempts >= CACHE_CONFIG.maxRetries) {
							clearInterval(checkInterval);
							if (updatedResource?.thumbnail) {
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
				let data:
					| {
							thumbnailUrl?: string;
							mimeType?: string;
							width?: number;
							height?: number;
							error?: string;
					  }
					| undefined;

				try {
					data = await getThumbnail(id, quality);
				} catch (requestError) {
					resourceLogger.error(`Error en la solicitud de thumbnail para ID ${id}:`, requestError);
					// Propagar el error para que se maneje en el catch exterior
					throw requestError;
				}

				resourceLogger.debug(`Data recibida de getThumbnail para ID ${id}:`, data); // ✨ Log para depuración

				if (!data || !data.thumbnailUrl) {
					throw new Error(`No se recibió una URL de thumbnail para el ID ${id}`);
				}

				// Directamente usar la URL de la miniatura, sin convertir a data:URL
				const finalThumbnailUrl = data.thumbnailUrl;
				const newDimensions = data.width && data.height ? { width: data.width, height: data.height } : undefined;

				const existingResource = state.resources.get(id); // Usar la instancia correcta de caché
				const isThumbnailContentChanged = !existingResource || existingResource.thumbnail !== finalThumbnailUrl;
				const areDimensionsChanged = !existingResource?.dimensions || !newDimensions ||
					(existingResource.dimensions.width !== newDimensions.width || existingResource.dimensions.height !== newDimensions.height);

				const needsVersionUpdateDueToContent = isThumbnailContentChanged || areDimensionsChanged;

				if (existingResource && !needsVersionUpdateDueToContent) {
					// ✨ NUEVO: Reutilizar el objeto existente, actualizando solo las propiedades de estado si cambiaron
					if (existingResource.isLoading || existingResource.lastUpdate !== Date.now()) { // Comprobar si isLoading o lastUpdate necesitan actualización
						existingResource.isLoading = false; // Asegurar que isLoading sea false al completar
						existingResource.lastUpdate = Date.now();
						state.resources.touch(id); // Solo tocar para actualizar recencia si se modificó o accedió, usando la instancia correcta
					}
				} else {
					// Contenido cambiado o recurso nuevo, crear un nuevo objeto ImageResource completo
					const newImageResource: ImageResource = {
						id,
						thumbnail: finalThumbnailUrl,
						isLoading: false,
						lastUpdate: Date.now(),
						dimensions: newDimensions,
					};
					state.resources.set(id, newImageResource); // Almacenar el nuevo objeto, usando la instancia correcta
				}

				// Incrementar la versión solo si el contenido principal cambió o si un error previo fue resuelto
				if (needsVersionUpdateDueToContent || (existingResource && existingResource.error)) {
					set({ version: get().version + 1 });
				}
				return finalThumbnailUrl;
			} catch (error) {
				resourceLogger.error(`❌ Error al obtener o procesar thumbnail para ID ${id}:`, error);
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				const existingResource = state.resources.get(id); // Usar la instancia correcta de caché
				const hasErrorChanged = existingResource?.error !== errorMessage; // ✨ Simplificado para comparar directamente el mensaje de error

				// Siempre se establece el estado de error, ya sea en un objeto nuevo o existente
				state.resources.set(id, { id, isLoading: false, error: errorMessage, lastUpdate: Date.now() }); // Usar la instancia correcta de caché
				state.loadingQueue.delete(id);

				if (hasErrorChanged) {
					set({ version: get().version + 1 }); // Solo incrementar si el estado de error cambia
				}
				return undefined;
			}
		},

		getOriginalUrl: async (id: string) => {
			const state = get();
			const resource = state.resources.get(id); // Usar la instancia correcta de caché

			// Si ya tenemos la URL original y no está expirada, retornarla
			if (resource?.originalUrl && Date.now() - resource.lastUpdate < CACHE_CONFIG.maxAge) {
				state.resources.touch(id); // Tocarlo inmediatamente si se sirve desde la caché, usando la instancia correcta
				return resource.originalUrl;
			}

			try {
				const url = await getImageUrl(id);
				if (url) {
					const existingResource = state.resources.get(id); // Usar la instancia correcta de caché
					const isOriginalUrlContentChanged = !existingResource || existingResource.originalUrl !== url;

					const needsVersionUpdateDueToContent = isOriginalUrlContentChanged;

					if (existingResource && !needsVersionUpdateDueToContent) {
						// ✨ NUEVO: Reutilizar el objeto existente, actualizando solo las propiedades de estado si cambiaron
						if (existingResource.isLoading || existingResource.lastUpdate !== Date.now()) { // Comprobar si isLoading o lastUpdate necesitan actualización
							existingResource.isLoading = false; // Asegurar que isLoading sea false al completar
							existingResource.lastUpdate = Date.now();
							state.resources.touch(id); // Solo tocar para actualizar recencia si se modificó o accedió, usando la instancia correcta
						}
					} else {
						// Contenido cambiado o recurso nuevo, crear un nuevo objeto ImageResource completo
						const newImageResource: ImageResource = {
							id,
							originalUrl: url,
							isLoading: false,
							lastUpdate: Date.now(),
							dimensions: existingResource?.dimensions, // Mantener dimensiones si no se actualizan aquí
						};
						state.resources.set(id, newImageResource); // Almacenar el nuevo objeto, usando la instancia correcta
					}

					// Incrementar la versión solo si el contenido principal cambió o si un error previo fue resuelto
					if (needsVersionUpdateDueToContent || (existingResource && existingResource.error)) {
						set({ version: get().version + 1 });
					}
					return url;
				}
				return undefined;
			} catch (error) {
				resourceLogger.error('Error loading original URL:', { id, error });
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				const existingResource = state.resources.get(id); // Usar la instancia correcta de caché
				const hasErrorChanged = existingResource?.error !== errorMessage; // ✨ Simplificado para comparar directamente el mensaje de error

				const errorResource = {
					...existingResource,
					error: errorMessage,
					lastUpdate: Date.now(),
				};
				state.resources.set(id, errorResource); // Usar la instancia correcta de caché

				if (hasErrorChanged) {
					set({ version: get().version + 1 }); // Solo incrementar si el estado de error cambia
				}
				return undefined;
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
				const resource = state.resources.get(id); // Usar la instancia correcta de caché
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
			// currentCleanupInterval ha sido eliminado, usar cleanupInterval local
			if (cleanupInterval) {
				clearInterval(cleanupInterval);
			}
			set({
				loadingQueue: new Set(),
				preloadQueue: [],
				isProcessing: false,
				version: 0,
			});
			// Reiniciar el intervalo de limpieza local
			startCleanup();
		},
	};
});
