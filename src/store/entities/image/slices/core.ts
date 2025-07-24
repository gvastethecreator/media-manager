/**
 * @file Slice principal para operaciones CRUD del store de imágenes
 * @module store/entities/image/slices/core
 * @description Implementa operaciones CRUD básicas y gestión de estado para imágenes optimizado con ImageWithStats
 * Última actualización: 2025-07-04
 */

import type { StateCreator } from 'zustand';
import * as ImageApi from '@/lib/api/client/image.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { ImageUpdateInput, ImageWithStats } from '@/types/entities/image';
import type { ImageState } from '../types';

const imageLogger = clientLogger.withContext('ImageStore');

export interface ImageCoreState {
	images: Record<string, ImageWithStats>;
	isLoading: boolean;
	error: string | null;

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
	getSortedImages: () => {
		const images = Object.values(get().images);
		// Ordenar por fecha de actualización descendente por defecto
		return images.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	},
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
			const image = await ImageApi.getImageFromApi(id);
			get().addImage(image);
			return image;
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
		console.log('🔍 DEBUG Store: fetchImages llamado con opciones:', options);
		console.log('🔍 DEBUG Store: Estado actual:', {
			isLoading: get().isLoading,
			totalImages: Object.keys(get().images).length,
		});

		if (get().isLoading && !options.refresh) {
			console.log('⚠️ DEBUG Store: Saltando carga - isLoading=true y refresh=false');
			return Object.values(get().images);
		}

		set({ isLoading: true, error: null });
		console.log('🚀 DEBUG Store: Iniciando carga de imágenes...');

		try {
			if (options.refresh) {
				console.log('🧹 DEBUG Store: Limpiando imágenes existentes (refresh=true)');
				get().clearImages();
			}

			// Implementar paginación automática para obtener todas las imágenes
			let allImages: any[] = [];
			let offset = 0;
			const limit = 100; // Máximo permitido por el servidor
			let hasMore = true;

			while (hasMore) {
				console.log(`📡 DEBUG Store: Llamando a ImageApi.getImagesFromApi con: offset=${offset}, limit=${limit}`);

				// Solo pasar parámetros que están permitidos por ImageFiltersSchema en el servidor
				const apiOptions: any = {
					limit,
					offset,
				};

				// Agregar solo parámetros válidos del esquema del servidor si están presentes
				if (options.folderId) apiOptions.folderId = options.folderId;

				const result = await ImageApi.getImagesFromApi(apiOptions);
				console.log(`📡 DEBUG Store: Respuesta de API (página ${Math.floor(offset / limit) + 1}):`, result);

				// Verificar el formato de la respuesta y adaptarse
				const images = result?.images || (result as any)?.data || [];
				console.log(`✅ DEBUG Store: Imágenes recibidas en esta página: ${images.length}`);

				if (images.length > 0) {
					allImages = allImages.concat(images);
					offset += limit;
					// Si recibimos menos imágenes que el límite, ya no hay más páginas
					hasMore = images.length === limit;
				} else {
					hasMore = false;
				}

				console.log(`🔍 DEBUG Store: Total acumulado: ${allImages.length}, hasMore: ${hasMore}`);
			}

			console.log('🔍 DEBUG Store: Total de imágenes obtenidas:', allImages.length);
			const validImages = Array.isArray(allImages) ? allImages.filter((img) => img?.id) : [];
			console.log('✅ DEBUG Store: Imágenes válidas encontradas:', validImages.length);
			console.log('🔍 DEBUG Store: Imágenes descartadas:', allImages.length - validImages.length);

			get().addImages(validImages);
			console.log('💾 DEBUG Store: Imágenes añadidas al store. Total en store:', Object.keys(get().images).length);

			return validImages;
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to fetch images';
			console.error('❌ DEBUG Store: Error en fetchImages:', e);
			imageLogger.error(errorMessage, { error: e, options });
			set({ error: errorMessage });
			return [];
		} finally {
			set({ isLoading: false });
			console.log('🏁 DEBUG Store: fetchImages completado. Estado final:', {
				isLoading: false,
				totalImages: Object.keys(get().images).length,
			});
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
			const updatedImage = await ImageApi.updateImageInApi(id, data);
			get().addImage(updatedImage);
			toastService.success('Imagen actualizada');
			return updatedImage;
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to update image';
			imageLogger.error(errorMessage, { error: e, id, data });
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
			await ImageApi.deleteImageFromApi(id);
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
