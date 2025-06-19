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
import { extendImage, extendImages } from '@/transformers/image/serializers';
import type { CreateImageData, Image, ImageBase, UpdateImageData } from '@/types/entities/image';
import type { StateCreator } from 'zustand';
import type { ImageState } from '../types';

const imageLogger = clientLogger.withContext('ImageStore');

export interface ImageCoreSlice {
	// Getters
	getImage: (id: string) => Image | undefined;
	getImages: () => Image[];
	getImagesByFolder: (folderId: string) => Image[];
	getImageByPath: (path: string) => Image | undefined;

	// Operaciones síncronas
	addImage: (image: Image) => void;
	addImages: (images: Image[]) => void;
	_updateImage: (id: string, data: Partial<Image>) => void;
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
	updateImage: (id: string, data: UpdateImageData) => Promise<Image | undefined>;
	removeImage: (id: string) => Promise<boolean>;
}

export const createImageCoreSlice: StateCreator<ImageState & ImageCoreSlice, [], [], ImageCoreSlice> = (set, get) => ({
	// --- Getters ---
	getImage: (id) => get().core.images[id],
	getImages: () => Object.values(get().core.images),
	getImagesByFolder: (folderId) =>
		get()
			.getImages()
			.filter((image) => image.folderId === folderId),
	getImageByPath: (path) =>
		get()
			.getImages()
			.find((image) => image.path === path),

	// --- Operaciones síncronas ---
	addImage: (image) => {
		set((state) => ({
			core: {
				...state.core,
				images: { ...state.core.images, [image.id]: image },
			},
		}));
	},
	addImages: (images) => {
		const imagesMap = images.reduce(
			(acc, img) => {
				acc[img.id] = img;
				return acc;
			},
			{} as Record<string, Image>
		);
		set((state) => ({
			core: {
				...state.core,
				images: { ...state.core.images, ...imagesMap },
			},
		}));
	},
	_updateImage: (id, data) => {
		const existing = get().getImage(id);
		if (existing) {
			get().addImage({ ...existing, ...data, updatedAt: new Date() });
		}
	},
	deleteImage: (id) => {
		set((state) => {
			const { [id]: _, ...remaining } = state.core.images;
			return { core: { ...state.core, images: remaining } };
		});
	},
	clearImages: () => {
		set((state) => ({ core: { ...state.core, images: {} } }));
	},
	clearFolderImages: (folderId) => {
		const images = get().getImages();
		const imagesToKeep = images.filter((img) => img.folderId !== folderId);
		const imagesMap = imagesToKeep.reduce(
			(acc, img) => {
				acc[img.id] = img;
				return acc;
			},
			{} as Record<string, Image>
		);
		set((state) => ({ core: { ...state.core, images: imagesMap } }));
	},

	// --- Estado de carga y errores ---
	setLoading: (isLoading) => set((state) => ({ core: { ...state.core, isLoading } })),
	setError: (error) => set((state) => ({ core: { ...state.core, error } })),

	// --- Acciones Asíncronas ---
	fetchImage: async (id) => {
		get().setLoading(true);
		try {
			const response = await getImage(id);
			if (response.success && response.data) {
				const image = extendImage(response.data as ImageBase);
				get().addImage(image);
				return image;
			}
			get().setError(response.error ?? 'Error fetching image');
			return undefined;
		} catch (e) {
			imageLogger.error('Failed to fetch image', { error: e });
			get().setError('Failed to fetch image');
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},
	fetchImages: async (options = {}) => {
		get().setLoading(true);
		try {
			if (options.refresh) get().clearImages();
			const response = await getImages(options);
			if (response.success && response.data) {
				const images = extendImages(response.data as ImageBase[]);
				get().addImages(images);
				return images;
			}
			get().setError(response.error ?? 'Error fetching images');
			return [];
		} catch (e) {
			imageLogger.error('Failed to fetch images', { error: e });
			get().setError('Failed to fetch images');
			return [];
		} finally {
			get().setLoading(false);
		}
	},
	createImage: async (data) => {
		get().setLoading(true);
		try {
			const response = await createServerImage(data);
			if (response.success && response.data) {
				const image = extendImage(response.data as ImageBase);
				get().addImage(image);
				toastService.success('Imagen creada');
				return image;
			}
			get().setError(response.error ?? 'Error creating image');
			toastService.error(response.error ?? 'Error creating image');
			return undefined;
		} catch (e) {
			imageLogger.error('Failed to create image', { error: e });
			get().setError('Failed to create image');
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},
	updateImage: async (id, data) => {
		get().setLoading(true);
		try {
			const response = await updateServerImage(id, data);
			if (response.success && response.data) {
				const image = extendImage(response.data as ImageBase);
				get().addImage(image);
				toastService.success('Imagen actualizada');
				return image;
			}
			get().setError(response.error ?? 'Error updating image');
			toastService.error(response.error ?? 'Error updating image');
			return undefined;
		} catch (e) {
			imageLogger.error('Failed to update image', { error: e });
			get().setError('Failed to update image');
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},
	removeImage: async (id) => {
		get().setLoading(true);
		try {
			const response = await deleteServerImage(id);
			if (response.success) {
				get().deleteImage(id);
				toastService.success('Imagen eliminada');
				return true;
			}
			get().setError(response.error ?? 'Error removing image');
			toastService.error(response.error ?? 'Error removing image');
			return false;
		} catch (e) {
			imageLogger.error('Failed to remove image', { error: e });
			get().setError('Failed to remove image');
			return false;
		} finally {
			get().setLoading(false);
		}
	},
});
