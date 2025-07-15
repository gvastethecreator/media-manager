import { create } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { EntityWithStats } from '@/types/migration';
import { isImageWithStats } from '@/types/migration';

const viewerLogger = clientLogger.withContext('ImageViewer');

// Interfaz para el estado del visor - MIGRADO A EntityWithStats
interface ImageViewerState {
	isOpen: boolean;
	images: EntityWithStats[];
	currentIndex: number;
	zoom: number;
	rotation: number;
	openViewer: (images: EntityWithStats[], initialIndex?: number) => void;
	closeViewer: () => void;
	nextImage: () => void;
	previousImage: () => void;
	setCurrentIndex: (index: number) => void;
	setZoom: (zoom: number) => void;
	setRotation: (rotation: number) => void;
}

// Crear el store - MIGRADO A EntityWithStats
export const useImageViewerStore = create<ImageViewerState>((set, get) => ({
	// Estado inicial
	isOpen: false,
	images: [],
	currentIndex: 0,
	zoom: 1,
	rotation: 0,

	// Acciones
	openViewer: (images: EntityWithStats[], initialIndex = 0) => {
		// Filtrar solo imágenes válidas
		const imageEntities = images.filter(isImageWithStats);

		if (imageEntities.length === 0) {
			viewerLogger.warn('No se encontraron imágenes válidas para abrir el visor');
			return;
		}

		viewerLogger.info('Abriendo visor de imágenes', {
			totalEntities: images.length,
			validImages: imageEntities.length,
			initialIndex,
		});

		// Ajustar el índice inicial si es necesario
		const adjustedIndex = Math.min(initialIndex, imageEntities.length - 1);

		set({
			images: imageEntities,
			isOpen: true,
			currentIndex: adjustedIndex,
			zoom: 1,
			rotation: 0,
		});
	},

	closeViewer: () => {
		viewerLogger.info('Cerrando visor de imágenes');
		set({
			isOpen: false,
			images: [],
			currentIndex: 0,
			zoom: 1,
			rotation: 0,
		});
	},

	nextImage: () => {
		const state = get();
		if (!state.images.length) {
			return;
		}

		const nextIndex = (state.currentIndex + 1) % state.images.length;
		viewerLogger.debug('Navegando a siguiente imagen', { currentIndex: state.currentIndex, nextIndex });

		set({
			currentIndex: nextIndex,
			zoom: 1,
			rotation: 0,
		});
	},

	previousImage: () => {
		const state = get();
		if (!state.images.length) {
			return;
		}

		const prevIndex = state.currentIndex > 0 ? state.currentIndex - 1 : state.images.length - 1;
		viewerLogger.debug('Navegando a imagen anterior', { currentIndex: state.currentIndex, prevIndex });

		set({
			currentIndex: prevIndex,
			zoom: 1,
			rotation: 0,
		});
	},

	setCurrentIndex: (index: number) => {
		const state = get();
		if (index < 0 || index >= state.images.length) {
			viewerLogger.warn('Índice fuera de rango', { index, totalItems: state.images.length });
			return;
		}

		viewerLogger.debug('Estableciendo índice actual', { previousIndex: state.currentIndex, newIndex: index });
		set({
			currentIndex: index,
			zoom: 1,
			rotation: 0,
		});
	},

	setZoom: (zoom: number) => {
		viewerLogger.debug('Ajustando zoom', { previousZoom: get().zoom, newZoom: zoom });
		set({ zoom });
	},

	setRotation: (rotation: number) => {
		viewerLogger.debug('Ajustando rotación', { previousRotation: get().rotation, newRotation: rotation });
		set({ rotation });
	},
}));

// Hook personalizado para facilitar el uso - ACTUALIZADO
export const useImageViewer = () => {
	const store = useImageViewerStore();

	return {
		isOpen: store.isOpen,
		currentImage: store.images[store.currentIndex],
		currentIndex: store.currentIndex,
		images: store.images,
		zoom: store.zoom,
		rotation: store.rotation,
		openViewer: store.openViewer,
		closeViewer: store.closeViewer,
		nextImage: store.nextImage,
		previousImage: store.previousImage,
		setCurrentIndex: store.setCurrentIndex,
		setZoom: store.setZoom,
		setRotation: store.setRotation,
	};
};
