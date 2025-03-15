import type { ViewType } from '@/components/views/types';
import { create } from 'zustand';

// Definición del tipo para el item actual
export interface NavigationItem {
	id?: string | null;
	name?: string;
	path?: string;
	description?: string;
	color?: string;
	emoji?: string;
	count?: number;
	totalSize?: number;
	lastIndexed?: Date;
	createdAt?: Date;
	itemType?: string;
	_count?: { images: number };
}

interface NavigationState {
	currentView: ViewType;
	navigationDirection: number;
	currentItem: NavigationItem | null;
	setCurrentView: (view: ViewType) => void;
	setNavigationDirection: (direction: number) => void;
	setCurrentItem: (item: NavigationItem | null) => void;
	getCurrentItem: () => NavigationItem | null;
	navigateToHome: () => void;
	navigateToMainFromContent: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
	currentView: 'folders',
	navigationDirection: 0,
	currentItem: null,
	setCurrentView: (view) => set({ currentView: view }),
	setNavigationDirection: (direction) => set({ navigationDirection: direction }),
	setCurrentItem: (item) => set({ currentItem: item }),
	getCurrentItem: () => get().currentItem,
	navigateToHome: () => set({ currentView: 'folders', currentItem: null }),
	navigateToMainFromContent: () => {
		const currentView = get().currentView;
		if (currentView.endsWith('-content')) {
			// Extraer la parte principal de la vista (ej: 'folder-content' -> 'folders')
			const mainView = currentView.split('-')[0];
			// Añadir 's' al final si no lo tiene ya
			const targetView = mainView.endsWith('s') ? mainView : `${mainView}s`;
			set({
				currentView: targetView as ViewType,
				currentItem: null,
			});
		}
	},
}));
