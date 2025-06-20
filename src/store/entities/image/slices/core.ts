/**
 * @file Slice principal para operaciones CRUD del store de imágenes
 * @module store/entities/image/slices/core
 * @description Implementa operaciones CRUD básicas y gestión de estado para imágenes
 */

import {
	createImage as createServerImage,
	deleteImage as deleteServerImage,
	getImage,
	getImages,
	updateImage as updateServerImage,
} from '@/app/actions/images/image-crud.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { extendImage } from '@/transformers/image/serializers';
import type { CreateImageData, ImageExtended, UpdateImageData } from '@/types/entities/image/types';
import type { StateCreator } from 'zustand';
import type { ImageState } from '../types';

const imageLogger = clientLogger.withContext('ImageStore');

export interface ImageCoreSlice {
	images: Record<string, ImageExtended>;
	isLoading: boolean;
	error: string | null;

	// Getters
	getImage: (id: string) => ImageExtended | undefined;
	getImages: () => ImageExtended[];
	getImagesByFolder: (folderId: string) => ImageExtended[];
	getImageByPath: (path: string) => ImageExtended | undefined;

	// Operaciones síncronas
	addImage: (image: ImageExtended) => void;
	addImages: (images: ImageExtended[]) => void;
	_updateImage: (id: string, data: Partial<ImageExtended>) => void;
	deleteImage: (id: string) => void;
	clearImages: () => void;
	clearFolderImages: (folderId: string) => void;

	// Acciones asíncronas
	fetchImage: (id: string) => Promise<ImageExtended | undefined>;
	fetchImages: (options?: { folderIds?: string[]; refresh?: boolean }) => Promise<ImageExtended[]>;
	createImage: (data: CreateImageData) => Promise<ImageExtended | undefined>;
	updateImage: (id: string, data: UpdateImageData) => Promise<ImageExtended | undefined>;
	removeImage: (id: string) => Promise<boolean>;
}

export const createImageCoreSlice: StateCreator<ImageState & ImageCoreSlice, [], [], ImageCoreSlice> = (set, get) => ({
	images: {},
	isLoading: false,
	error: null,

	// --- Getters ---
	getImage: (id) => get().images[id],
	getImages: () => Object.values(get().images),
	getImagesByFolder: (folderId) => Object.values(get().images).filter((image) => image.folderId === folderId),
	getImageByPath: (path) => Object.values(get().images).find((image) => image.path === path),

	// --- Operaciones síncronas ---
	addImage: (image) => {
		if (!image || !image.id) {
			imageLogger.warn('Intento de agregar una imagen inválida', { image });
			return;
		}
		set((state) => ({ images: { ...state.images, [image.id]: image } }));
	},
	addImages: (images) => {
		if (!Array.isArray(images) || images.length === 0) {
			return;
		}

		const imagesMap = images.reduce<Record<string, ImageExtended>>((acc, img) => {
			if (img?.id) {
				acc[img.id] = img;
			}
			return acc;
		}, {});

		set((state) => ({ images: { ...state.images, ...imagesMap } }));
	},
	_updateImage: (id, data) => {
		const existing = get().images[id];
		if (existing) {
			get().addImage({ ...existing, ...data, updatedAt: new Date() });
		}
	},
	deleteImage: (id) => {
		set((state) => {
			const { [id]: _, ...remaining } = state.images;
			return { images: remaining };
		});
	},
	clearImages: () => {
		set({ images: {} });
	},
	clearFolderImages: (folderId) => {
		set((state) => {
			const newImages: Record<string, ImageExtended> = {};

			for (const img of Object.values(state.images)) {
				if (img.folderId !== folderId) {
					newImages[img.id] = img;
				}
			}

			return { images: newImages };
		});
	},

	// --- Acciones Asíncronas ---
	fetchImage: async (id) => {
		set({ isLoading: true, error: null });
		try {
			const image = await getImage(id);
			if (image) {
				const extendedImage = extendImage(image);
				get().addImage(extendedImage);
				return extendedImage;
			}
			return undefined;
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to fetch image';
			imageLogger.error(errorMessage, { error: e });
			set({ error: errorMessage });
			return undefined;
		} finally {
			set({ isLoading: false });
		}
	},
	fetchImages: async (options = {}) => {
		set({ isLoading: true, error: null });
		try {
			if (options.refresh) {
				get().clearImages();
			}

			const images = await getImages(options);
			// Convertir cada imagen individualmente usando extendImage
			const extendedImages = images.map((image) => extendImage(image));
			get().addImages(extendedImages);
			return extendedImages;
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to fetch images';
			imageLogger.error(errorMessage, { error: e });
			set({ error: errorMessage });
			return [];
		} finally {
			set({ isLoading: false });
		}
	},
	createImage: async (data) => {
		set({ isLoading: true, error: null });
		try {
			const image = await createServerImage(data);
			const extendedImage = extendImage(image);
			get().addImage(extendedImage);
			toastService.success('Imagen creada');
			return extendedImage;
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to create image';
			imageLogger.error(errorMessage, { error: e });
			set({ error: errorMessage });
			toastService.error(errorMessage);
			return undefined;
		} finally {
			set({ isLoading: false });
		}
	},
	updateImage: async (id, data) => {
		set({ isLoading: true, error: null });
		try {
			const image = await updateServerImage(id, data);
			const extendedImage = extendImage(image);
			get().addImage(extendedImage);
			toastService.success('Imagen actualizada');
			return extendedImage;
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to update image';
			imageLogger.error(errorMessage, { error: e });
			set({ error: errorMessage });
			toastService.error(errorMessage);
			return undefined;
		} finally {
			set({ isLoading: false });
		}
	},
	removeImage: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await deleteServerImage(id);
			get().deleteImage(id);
			toastService.success('Imagen eliminada');
			return true;
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to remove image';
			imageLogger.error(errorMessage, { error: e });
			set({ error: errorMessage });
			toastService.error(errorMessage);
			return false;
		} finally {
			set({ isLoading: false });
		}
	},
});
