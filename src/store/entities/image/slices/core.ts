/**
 * @file Slice principal para operaciones CRUD del store de imágenes
 * @module store/entities/image/slices/core
 * @description Implementa operaciones CRUD básicas y gestión de estado para imágenes optimizado con ImageWithStats
 * Última actualización: 2025-07-04
 */

import type { StateCreator } from 'zustand';
import { deleteImageFromApi, getImageFromApi, getImagesFromApi, updateImageInApi } from '@/lib/api/client/image.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { ImageWithStats } from '@/types/entities/image';
import type { ImageState } from '../types';

const imageLogger = clientLogger.withContext('ImageStore');

export interface ImageCoreState {
	images: Record<string, ImageWithStats>;
	isLoading: boolean;
	error: string | null;
	folderLoadState?: Record<string, { loading: boolean; loaded: boolean; lastLoadedAt?: number }>;

	// Getters
	getImage: (id: string) => ImageWithStats | undefined;
	getImages: () => ImageWithStats[];
	getSortedImages: () => ImageWithStats[];
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
	loadImages: (options?: { folderId?: string; refresh?: boolean }) => Promise<ImageWithStats[]>;
	// createImage: (data: ImageCreateInput) => Promise<ImageWithStats | undefined>; // Comentado temporalmente
	updateImage: (id: string, data: any) => Promise<ImageWithStats | undefined>;
	removeImage: (id: string) => Promise<boolean>;
}

export const createImageCoreSlice: StateCreator<ImageState & ImageCoreState, [], [], ImageCoreState> = (set, get) => ({
	images: {},
	isLoading: false,
	error: null,
	folderLoadState: {},

	// --- Getters ---
	getImage: (id) => get().images[id],
	getImages: () => Object.values(get().images),
	getSortedImages: () => {
		const images = Object.values(get().images);
		// Ordenar por fecha de actualización descendente por defecto
		return images.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	},
	getImagesByFolder: (folderId) => Object.values(get().images).filter((image) => image.folderId === folderId),
	getImageByPath: (path) => Object.values(get().images).find((image) => image.path === path),

	// --- Operaciones síncronas ---
	addImage: (image) => {
		if (!image?.id) {
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
			const image = await getImageFromApi(id);
			get().addImage(image);
			return image;
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to fetch image';
			imageLogger.error(errorMessage, { error: e });
			set({ error: errorMessage });
			return;
		} finally {
			set({ isLoading: false });
		}
	},
	fetchImages: async (options: { folderId?: string; refresh?: boolean } = {}) => {
		const { folderId, refresh } = options;
		console.log('[ImageStore] fetchImages', options);
		if (get().isLoading && !refresh) {
			return get().getImages();
		}
		set((state) => ({
			isLoading: true,
			error: null,
			folderLoadState: folderId
				? {
						...state.folderLoadState,
						[folderId]: {
							loading: true,
							loaded: state.folderLoadState?.[folderId]?.loaded ?? false,
							lastLoadedAt: state.folderLoadState?.[folderId]?.lastLoadedAt,
						},
					}
				: state.folderLoadState,
		}));
		if (refresh) {
			// Si hay folderId específico, solo limpiar las imágenes de esa carpeta
			// Si no hay folderId, limpiar todo el store
			if (folderId) {
				// Remover solo las imágenes de esta carpeta del store
				const currentImages = get().getImages();
				const filteredImages = currentImages.filter((img) => img.folderId !== folderId);
				set({ images: Object.fromEntries(filteredImages.map((img) => [img.id, img])) });
			} else {
				get().clearImages();
			}
		}
		try {
			const limit = 100;
			async function loadBatch(offset: number, acc: ImageWithStats[]): Promise<ImageWithStats[]> {
				const apiOptions: any = { limit, offset };
				if (folderId) {
					apiOptions.folderId = folderId;
				}
				const result = await getImagesFromApi(apiOptions);
				const batch = (result as any).images as ImageWithStats[] | undefined;
				if (batch?.length) {
					for (const img of batch) {
						acc.push(img);
					}
				}
				if (!batch || batch.length < limit) {
					return acc;
				}
				return loadBatch(offset + limit, acc);
			}
			const all = await loadBatch(0, []);
			// Solo agregar las nuevas imágenes sin limpiar otras carpetas
			get().addImages(all);
			return get().getImages();
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Failed to fetch images';
			imageLogger.error(msg, { error: e });
			set({ error: msg });
			return get().getImages();
		} finally {
			set((state) => ({
				isLoading: false,
				folderLoadState: folderId
					? {
							...state.folderLoadState,
							[folderId]: { loading: false, loaded: true, lastLoadedAt: Date.now() },
						}
					: state.folderLoadState,
			}));
		}
	},
	loadImages: (options: { folderId?: string; refresh?: boolean } = {}) => get().fetchImages(options),
	/*
	createImage: async (data) => {
		// Lógica de creación a implementar con API
		return undefined;
	},
	*/
	updateImage: async (id, data) => {
		set({ isLoading: true, error: null });
		try {
			// Convertir TagWithStats[] a string[] si es necesario
			const { tags, ...restData } = data;
			const processedData: any = {
				...restData,
			};

			// Convertir tags de TagWithStats[] a string[] si están presentes
			if (tags && Array.isArray(tags) && tags.length > 0) {
				const firstTag = tags[0];
				if (firstTag && typeof firstTag === 'object') {
					processedData.tags = tags.map((tag: any) => tag.id || tag.name || String(tag));
				} else {
					// Si ya son strings, mantenerlos como están
					processedData.tags = tags;
				}
			} else if (tags) {
				// Si tags existe pero no es un array, asignarlo directamente
				processedData.tags = tags;
			}

			const updatedImage = await updateImageInApi(id, processedData);
			get().addImage(updatedImage);
			toastService.success('Imagen actualizada');
			return updatedImage;
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to update image';
			imageLogger.error(errorMessage, { error: e, id, data });
			set({ error: errorMessage });
			toastService.error(errorMessage);
			return;
		} finally {
			set({ isLoading: false });
		}
	},
	removeImage: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await deleteImageFromApi(id);
			get().deleteImage(id);
			toastService.success('Imagen eliminada');
			return true;
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to delete image';
			imageLogger.error(errorMessage, { error: e, id });
			set({ error: errorMessage });
			toastService.error(errorMessage);
			return false;
		} finally {
			set({ isLoading: false });
		}
	},
});

// Exportar el slice para uso en otros módulos
export type ImageCoreSlice = ImageCoreState;
