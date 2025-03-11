import type { ViewType } from '@/components/views/types';
import { create } from 'zustand';

interface NavigationState {
	currentView: ViewType;
	navigationDirection: number;
	setCurrentView: (view: ViewType) => void;
	setNavigationDirection: (direction: number) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
	currentView: 'folders',
	navigationDirection: 0,
	setCurrentView: (view) => set({ currentView: view }),
	setNavigationDirection: (direction) => set({ navigationDirection: direction }),
}));
