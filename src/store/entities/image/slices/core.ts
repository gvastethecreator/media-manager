/**
 * @file Slice principal para operaciones CRUD del store de imágenes
 * @module store/entities/image/slices/core
 * @description Implementa operaciones CRUD básicas y gestión de estado para imágenes optimizado con ImageWithStats
 * Última actualización: 2025-01-27
 */

import {
	createImage as createServerImage,
	deleteImage as deleteServerImage,
	getImage,
	getImages,
	updateImage as updateServerImage,
} from '@/app/actions/images/image-crud.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast';
import type { ImageCreateInput, ImageUpdateInput, ImageWithStats } from '@/types/entities/image';
import type { StateCreator } from 'zustand';
import type { ImageState } from '../types';

const imageLogger = clientLogger.withContext('ImageStore');

export interface ImageCoreState {
	images: Record<string, ImageWithStats>;
	isLoading: boolean;
	error: string | null;

	// Getters
	getImage: (id: string) => ImageWithStats | undefined;
	getImages: () => ImageWithStats[];
	getImagesByFolder: (folderId: string) => ImageWithStats[];
	getImageByPath: (path: string) => ImageWithStats | undefined;

	// Operaciones síncronas
	addImage: (image: ImageWithStats) => void;
	addImages: (images: ImageWithStats[]) => void;
	updateImageData: (id: string, data: Partial<ImageWithStats>) => void;
	deleteImage: (id: string) => void;
	clearImages: () => void;
	clearFolderImages: (folderId: string) => void;

	// Acciones asíncronas
	fetchImage: (id: string) => Promise<ImageWithStats | undefined>;
	fetchImages: (options?: { folderId?: string; refresh?: boolean }) => Promise<ImageWithStats[]>;
	createImage: (data: ImageCreateInput) => Promise<ImageWithStats | undefined>;
	updateImage: (id: string, data: ImageUpdateInput) => Promise<ImageWithStats | undefined>;
	removeImage: (id: string) => Promise<boolean>;
}

export const createImageCoreSlice: StateCreator<ImageState & ImageCoreState, [], [], ImageCoreState> = (set, get) => ({
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

		const imagesMap = images.reduce<Record<string, ImageWithStats>>((acc, img) => {
			if (img?.id) {
				acc[img.id] = img;
			}
			return acc;
		}, {});

		set((state) => ({ images: { ...state.images, ...imagesMap } }));
	},
	updateImageData: (id, data) => {
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
			const newImages: Record<string, ImageWithStats> = {};

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
				// ✅ Server action ya devuelve ImageWithStats - conversión directa
				get().addImage(image);
				return image;
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
	fetchImages: async (options: { folderId?: string; refresh?: boolean } = {}) => {
		set({ isLoading: true, error: null });
		try {
			if (options.refresh) {
				get().clearImages();
			}

			const result = await getImages(options);
			// ✅ Server action ya devuelve GetImagesResult con ImageWithStats[] - extracción directa
			const images = Array.isArray(result) ? result : result.images || [];
			get().addImages(images);
			return images;
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
			// Adaptar ImageCreateInput para que sea compatible con CreateImageData
			const adaptedData = {
				name: data.name,
				path: data.path,
				hash: data.hash,
				size: data.size,
				width: data.width,
				height: data.height,
				description: data.description || undefined,
				metadata: data.metadata || undefined,
				folderId: data.folderId || '',
			};
			const image = await createServerImage(adaptedData);
			if (image) {
				// ✅ Server action ya devuelve ImageWithStats - conversión directa
				get().addImage(image);
				toastService.success('Imagen creada');
				return image;
			}
			return undefined;
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
			if (image) {
				// ✅ Server action ya devuelve ImageWithStats - conversión directa
				get().addImage(image);
				toastService.success('Imagen actualizada');
				return image;
			}
			return undefined;
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
