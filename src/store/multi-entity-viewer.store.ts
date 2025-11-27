import { create } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { AnyEntityWithStats } from '@/types/entities';

const viewerLogger = clientLogger.withContext('MultiEntityViewer');

interface MultiEntityViewerState {
	isOpen: boolean;
	entities: AnyEntityWithStats[];
	currentIndex: number;
	openViewer: (entities: AnyEntityWithStats[], initialIndex?: number) => void;
	closeViewer: () => void;
	setCurrentIndex: (index: number) => void;
	nextEntity: () => void;
	previousEntity: () => void;
}

export const useMultiEntityViewerStore = create<MultiEntityViewerState>((set, get) => ({
	isOpen: false,
	entities: [],
	currentIndex: 0,

	openViewer: (entities: AnyEntityWithStats[], initialIndex = 0) => {
		if (!entities || entities.length === 0) {
			viewerLogger.warn('No se encontraron entidades para abrir el visor');
			return;
		}

		const validIndex = Math.max(0, Math.min(initialIndex, entities.length - 1));

		viewerLogger.info(`🔍 Abriendo MultiEntityViewer con ${entities.length} entidades, índice inicial: ${validIndex}`);

		set({
			isOpen: true,
			entities,
			currentIndex: validIndex,
		});
	},

	closeViewer: () => {
		viewerLogger.info('🔍 Cerrando MultiEntityViewer');
		set({
			isOpen: false,
			entities: [],
			currentIndex: 0,
		});
	},

	setCurrentIndex: (index: number) => {
		const { entities } = get();
		if (index >= 0 && index < entities.length) {
			set({ currentIndex: index });
		}
	},

	nextEntity: () => {
		const { entities, currentIndex } = get();
		const nextIndex = currentIndex < entities.length - 1 ? currentIndex + 1 : 0;
		set({ currentIndex: nextIndex });
	},

	previousEntity: () => {
		const { entities, currentIndex } = get();
		const prevIndex = currentIndex > 0 ? currentIndex - 1 : entities.length - 1;
		set({ currentIndex: prevIndex });
	},
}));
