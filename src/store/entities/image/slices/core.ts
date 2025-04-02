/**
 * @file Slice principal para operaciones CRUD del store de imágenes
 * @module store/entities/image/slices/core
 * @description Implementa operaciones CRUD básicas y gestión de estado para imágenes
 */

import { Logger } from '@/lib/logger';
import {
    transformImageToExtended,
    transformImagesToExtended
} from '@/transformers/image/transformer';
import type { CreateImageData, Image, ImageBase, UpdateImageData } from '@/types/entities/image';
import type { StateCreator } from 'zustand';
import type { ImageState } from '../types';

// Logger para el slice
const logger = new Logger('ImageCoreSlice');

// Slice para operaciones CRUD básicas
export interface ImageCoreSlice {
	// Getters
	getImage: (id: string) => Image | undefined;
	getImages: () => Image[];
	getImagesByFolder: (folderId: string) => Image[];
	getImageByPath: (path: string) => Image | undefined;

	// Operaciones
	addImage: (image: ImageBase) => void;
	addImages: (images: ImageBase[]) => void;
	updateImage: (id: string, data: UpdateImageData) => void;
	deleteImage: (id: string) => void;
	clearImages: () => void;
	clearFolderImages: (folderId: string) => void;

	// Estado de carga
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas
	fetchImage: (id: string) => Promise<Image | undefined>;
	fetchImages: (options?: { folderIds?: string[]; refresh?: boolean }) => Promise<Image[]>;
	createImage: (data: CreateImageData) => Promise<Image | undefined>;
	removeImage: (id: string) => Promise<boolean>;
}

// Creador del slice
export const createImageCoreSlice: StateCreator<ImageState, [], [], ImageCoreSlice> = (set, get) => ({
	// Getters
	getImage: (id: string) => {
		return get().core.images[id];
	},

	getImages: () => {
		return Object.values(get().core.images);
	},

	getImagesByFolder: (folderId: string) => {
		return Object.values(get().core.images).filter((image) => image.folderId === folderId);
	},

	getImageByPath: (path: string) => {
		return Object.values(get().core.images).find((image) => image.path === path);
	},

	// Operaciones síncronas
	addImage: (image: ImageBase) => {
		try {
			// Usar el nuevo transformador para garantizar formato correcto
			const extendedImage = transformImageToExtended(image);

			set((state) => ({
				core: {
					...state.core,
					images: {
						...state.core.images,
						[image.id]: extendedImage,
					},
					lastUpdated: Date.now(),
				},
			}));
		} catch (error) {
			logger.error('Error al añadir imagen:', error);
			// Intentar una versión mínima para evitar interrumpir el flujo
			if (image && typeof image === 'object' && 'id' in image) {
				set((state) => ({
					core: {
						...state.core,
						images: {
							...state.core.images,
							[image.id as string]: image as Image,
						},
						error: error instanceof Error ? error.message : 'Error al procesar imagen',
						lastUpdated: Date.now(),
					},
				}));
			}
		}
	},

	addImages: (images: ImageBase[]) => {
		try {
			// Usar el nuevo transformador para arrays
			const extendedImages = transformImagesToExtended(images);

			const imagesMap = extendedImages.reduce(
				(acc, image) => {
					if (image?.id) {
						acc[image.id] = image;
					}
					return acc;
				},
				{} as Record<string, Image>
			);

			set((state) => ({
				core: {
					...state.core,
					images: {
						...state.core.images,
						...imagesMap,
					},
					lastUpdated: Date.now(),
				},
			}));
		} catch (error) {
			logger.error('Error al añadir múltiples imágenes:', error);
			// Establecer error en el estado
			set((state) => ({
				core: {
					...state.core,
					error: error instanceof Error ? error.message : 'Error al procesar imágenes',
				},
			}));
		}
	},

	updateImage: (id: string, data: UpdateImageData) => {
		set((state) => {
			const image = state.core.images[id];
			if (!image) {
				logger.warn(`Intento de actualizar imagen inexistente, ID: ${id}`);
				return state;
			}

			try {
				// Combinar datos y transformar para garantizar consistencia
				const updatedImageBase = { ...image, ...data };
				const updatedImage = transformImageToExtended(updatedImageBase);

				return {
					core: {
						...state.core,
						images: {
							...state.core.images,
							[id]: updatedImage,
						},
						lastUpdated: Date.now(),
					},
				};
			} catch (error) {
				logger.error(`Error al actualizar imagen ${id}:`, error);
				// Caer de nuevo a la actualización simple sin transformar
				return {
					core: {
						...state.core,
						images: {
							...state.core.images,
							[id]: {
								...image,
								...data,
							},
						},
						error: error instanceof Error ? error.message : 'Error al actualizar imagen',
						lastUpdated: Date.now(),
					},
				};
			}
		});
	},

	deleteImage: (id: string) => {
		set((state) => {
			const newImages = { ...state.core.images };
			if (id in newImages) {
				delete newImages[id];
				logger.debug(`Imagen eliminada del store: ${id}`);
			} else {
				logger.warn(`Intento de eliminar imagen inexistente, ID: ${id}`);
			}

			return {
				core: {
					...state.core,
					images: newImages,
					lastUpdated: Date.now(),
				},
			};
		});
	},

	clearImages: () => {
		set((state) => ({
			core: {
				...state.core,
				images: {},
				lastUpdated: Date.now(),
			},
		}));
		logger.debug('Store de imágenes limpiado completamente');
	},

	clearFolderImages: (folderId: string) => {
		set((state) => {
			const newImages = { ...state.core.images };
			let count = 0;

			// Usar for...of en lugar de forEach
			for (const imageId of Object.keys(newImages)) {
				if (newImages[imageId].folderId === folderId) {
					delete newImages[imageId];
					count++;
				}
			}

			logger.debug(`Eliminadas ${count} imágenes de la carpeta ${folderId}`);

			return {
				core: {
					...state.core,
					images: newImages,
					lastUpdated: Date.now(),
				},
			};
		});
	},

	// Estado de carga
	setLoading: (isLoading: boolean) => {
		set((state) => ({
			core: {
				...state.core,
				isLoading,
			},
		}));
	},

	setError: (error: string | null) => {
		set((state) => ({
			core: {
				...state.core,
				error,
			},
		}));
	},

	// Operaciones asíncronas con integración real a la API
	fetchImage: async (id: string) => {
		const { setLoading, setError, addImage } = get();
		try {
			setLoading(true);
			logger.debug(`Obteniendo imagen: ${id}`);

			// Implementación real con fetch a la API
			const response = await fetch(`/api/images/${id}`);
			if (!response.ok) throw new Error(`Error al cargar la imagen: ${response.statusText}`);

			const result = await response.json();
			if (!result.success || !result.data) {
				throw new Error(result.error || 'No se pudo obtener la imagen');
			}

			// Transformar y guardar en el store
			addImage(result.data);
			return get().core.images[id];
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error(`Error al obtener imagen ${id}:`, error);
			setError(errorMessage);
			return undefined;
		} finally {
			setLoading(false);
		}
	},

	fetchImages: async (options = {}) => {
		const { setLoading, setError, addImages, clearImages } = get();
		const { folderIds, refresh = false } = options;

		try {
			setLoading(true);
			logger.debug(`Obteniendo imágenes${folderIds ? ` de carpetas: ${folderIds.join(', ')}` : ''}`);

			// Si se solicita recargar, limpiamos primero
			if (refresh) {
				clearImages();
			}

			// Construir URL con parámetros
			const searchParams = new URLSearchParams();
			if (folderIds && folderIds.length > 0) {
				for (const id of folderIds) {
					searchParams.append('folderIds', id);
				}
			}

			const url = `/api/images?${searchParams.toString()}`;
			const response = await fetch(url);

			if (!response.ok) throw new Error(`Error al cargar imágenes: ${response.statusText}`);

			const result = await response.json();
			if (!result.success || !result.data) {
				throw new Error(result.error || 'No se pudieron obtener las imágenes');
			}

			// Transformar y guardar en el store
			addImages(result.data);
			return Object.values(get().core.images);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error('Error al obtener imágenes:', error);
			setError(errorMessage);
			return [];
		} finally {
			setLoading(false);
		}
	},

	createImage: async (data: CreateImageData) => {
		const { setLoading, setError, addImage } = get();
		try {
			setLoading(true);
			logger.debug('Creando nueva imagen:', data.name);

			// Implementación real con fetch a la API
			const response = await fetch('/api/images', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) throw new Error(`Error al crear imagen: ${response.statusText}`);

			const result = await response.json();
			if (!result.success || !result.data) {
				throw new Error(result.error || 'No se pudo crear la imagen');
			}

			// Transformar y guardar en el store
			addImage(result.data);
			return get().core.images[result.data.id];
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error('Error al crear imagen:', error);
			setError(errorMessage);
			return undefined;
		} finally {
			setLoading(false);
		}
	},

	removeImage: async (id: string) => {
		const { setLoading, setError, deleteImage } = get();
		try {
			setLoading(true);
			logger.debug(`Eliminando imagen: ${id}`);

			// Implementación real con fetch a la API
			const response = await fetch(`/api/images/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) throw new Error(`Error al eliminar imagen: ${response.statusText}`);

			const result = await response.json();
			if (!result.success) {
				throw new Error(result.error || 'No se pudo eliminar la imagen');
			}

			// Eliminar del store
			deleteImage(id);
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error(`Error al eliminar imagen ${id}:`, error);
			setError(errorMessage);
			return false;
		} finally {
			setLoading(false);
		}
	},
});
