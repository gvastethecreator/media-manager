/**
 * @file Slice principal para operaciones CRUD del store de imágenes
 * @module store/entities/image/slices/core
 * @description Implementa operaciones CRUD básicas y gestión de estado para imágenes
 */

import {
	createImage as createServerImage,
	deleteImage,
	getImage,
	getImages,
} from '@/app/actions/images/image-crud.actions';
import { extendImage } from '@/transformers/image/serializers';
import type { CreateImageData, Image, ImageExtended, UpdateImageData } from '@/types/entities/image';
import type { StateCreator } from 'zustand';
import type { ImageState } from '../types';

// Slice para operaciones CRUD básicas
export interface ImageCoreSlice {
	// Getters
	getImage: (id: string) => Image | undefined;
	getImages: () => Image[];
	getImagesByFolder: (folderId: string) => Image[];
	getImageByPath: (path: string) => Image | undefined;

	// Operaciones
	addImage: (image: ImageExtended) => void;
	addImages: (images: ImageExtended[]) => void;
	updateImage: (id: string, data: UpdateImageData) => void;
	deleteImage: (id: string) => void;
	clearImages: () => void;
	clearFolderImages: (folderId: string) => void;

	// Estado de carga
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas
	fetchImage: (id: string) => Promise<ImageExtended | undefined>;
	fetchImages: (options?: { folderIds?: string[]; refresh?: boolean }) => Promise<ImageExtended[]>;
	createImage: (data: CreateImageData) => Promise<ImageExtended | undefined>;
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
	addImage: (image: ImageExtended) => {
		set((state) => ({
			core: {
				...state.core,
				images: {
					...state.core.images,
					[image.id]: image,
				},
				lastUpdated: Date.now(),
			},
		}));
	},

	addImages: (images: ImageExtended[]) => {
		// 🛡️ Robustez: filtrar nulos, promesas y tipos inválidos antes de agregar al store
		const validImages = images.filter((img, idx) => {
			const isValid = img && typeof img === 'object' && typeof (img as any).then !== 'function';
			if (!isValid) {
				console.warn(`🛡️ Imagen excluida en posición ${idx}: nulo, promesa o tipo inválido`, { img });
			}
			return isValid;
		});
		const imagesMap = validImages.reduce(
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
	},

	updateImage: (id: string, data: UpdateImageData) => {
		set((state) => {
			const image = state.core.images[id];
			if (!image) {
				return state;
			}

			const updatedImage = { ...image, ...data } as Image;
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
		});
	},

	deleteImage: (id: string) => {
		set((state) => {
			const newImages = { ...state.core.images };
			if (id in newImages) {
				delete newImages[id];
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

	// Operaciones asíncronas con Server Actions
	fetchImage: async (id: string) => {
		const { setLoading, setError, addImage } = get();
		try {
			setLoading(true);
			const image = await getImage(id);
			if (image) {
				addImage(image);
			}
			return image ?? undefined;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			setError(errorMessage);
			return undefined;
		} finally {
			setLoading(false);
		}
	},

	fetchImages: async (options = {}) => {
		const { setLoading, setError, addImages, clearImages } = get();
		const { refresh = false } = options;

		try {
			setLoading(true);

			if (refresh) {
				clearImages();
			}

			const result = await getImages(options);
			addImages(result.images);
			return Object.values(get().core.images);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
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

			const newImageBase = await createServerImage(data);
			const extended = extendImage(newImageBase);
			addImage(extended);
			return get().core.images[newImageBase.id];
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			setError(errorMessage);
			return undefined;
		} finally {
			setLoading(false);
		}
	},

	removeImage: async (id: string) => {
		const { setLoading, setError, deleteImage: removeLocal } = get();
		try {
			setLoading(true);
			await deleteImage(id);
			removeLocal(id);
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			setError(errorMessage);
			return false;
		} finally {
			setLoading(false);
		}
	},
});
