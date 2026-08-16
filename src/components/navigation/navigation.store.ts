import { create } from 'zustand';
import { ViewType } from '@/components/views/types';

// Definición del tipo para el item actual
export interface NavigationItem {
	_count?: { images: number };
	color?: string;
	count?: number;
	createdAt?: Date;
	description?: string;
	emoji?: string;
	id?: string | null;
	itemType?: string;
	lastIndexed?: Date;
	name?: string;
	path?: string;
	totalSize?: number;
}

interface NavigationState {
	currentItem: NavigationItem | null;
	currentView: ViewType;
	getCurrentItem: () => NavigationItem | null;
	navigateToHome: () => void;
	navigateToMainFromContent: () => void;
	navigationDirection: number;
	setCurrentItem: (item: NavigationItem | null) => void;
	setCurrentView: (view: ViewType) => void;
	setNavigationDirection: (direction: number) => void;
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
