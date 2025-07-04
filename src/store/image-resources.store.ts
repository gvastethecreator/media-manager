// import { getThumbnail as getServerThumbnail } from '@/services/thumbnail/thumbnail.service'; // Eliminado
import { create } from 'zustand';
import { getImageUrl } from '@/lib/api/client/image.client';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { clientLogger } from '@/lib/logger/client-logger';

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

			if (!id || typeof id !== 'string' || id.trim() === '') {
				resourceLogger.error('❌ Intento de cargar thumbnail con ID inválido:', { id });
				return undefined;
			}

			const resource = state.resources.get(id);
			const thumbnailUrl = getImageUrl(id, 'thumbnail'); // Usar el cliente de API

			// Si ya tenemos la URL y no está expirada, retornarla.
			// La lógica de caché ahora se simplifica a la URL.
			if (resource?.thumbnail === thumbnailUrl && Date.now() - resource.lastUpdate < CACHE_CONFIG.maxAge) {
				resourceLogger.debug(`✅ URL de thumbnail encontrada en caché para ID ${id}`);
				state.resources.touch(id);
				return resource.thumbnail;
			}

			// No hay necesidad de una llamada a la API, simplemente construimos la URL.
			// La carga real la hace el tag <img> del navegador.

			const newImageResource: ImageResource = {
				id,
				thumbnail: thumbnailUrl,
				isLoading: false,
				lastUpdate: Date.now(),
				// Las dimensiones se podrían obtener de otra forma si es necesario
			};

			state.resources.set(id, newImageResource);

			// Incrementar la versión para forzar re-renderizado en los componentes que usan el thumbnail.
			set((s) => ({ version: s.version + 1 }));

			return thumbnailUrl;
		},

		getOriginalUrl: async (id: string) => {
			// Lógica similar para la URL original
			if (!id) return undefined;
			const originalUrl = getImageUrl(id, 'original');

			const resource = get().resources.get(id);
			if (resource?.originalUrl !== originalUrl) {
				const newResource = {
					...get().resources.get(id)!,
					id,
					originalUrl,
					lastUpdate: Date.now(),
				};
				get().resources.set(id, newResource as ImageResource);
				set((s) => ({ version: s.version + 1 }));
			}

			return originalUrl;
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
