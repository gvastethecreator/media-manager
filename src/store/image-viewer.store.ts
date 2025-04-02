import { clientLogger } from '@/lib/logger/client-logger';
import type { FileItem } from '@/types/file-item';
import { create } from 'zustand';

const viewerLogger = clientLogger.withContext('ImageViewer');

// Interfaz para el estado del visor
interface ImageViewerState {
	isOpen: boolean;
	images: FileItem[];
	currentIndex: number;
	zoom: number;
	rotation: number;
	openViewer: (images: FileItem[], initialIndex?: number) => void;
	closeViewer: () => void;
	nextImage: () => void;
	previousImage: () => void;
	setCurrentIndex: (index: number) => void;
	setZoom: (zoom: number) => void;
	setRotation: (rotation: number) => void;
}

// Crear el store
export const useImageViewerStore = create<ImageViewerState>((set, get) => ({
	// Estado inicial
	isOpen: false,
	images: [],
	currentIndex: 0,
	zoom: 1,
	rotation: 0,

	// Acciones
	openViewer: (images: FileItem[], initialIndex = 0) => {
		viewerLogger.info('Abriendo visor de imágenes', { filesCount: images.length, initialIndex });

		set({
			images,
			isOpen: true,
			currentIndex: initialIndex,
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

// Hook personalizado para facilitar el uso
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
