import { create } from 'zustand';

export type ViewType =
	| 'all-images'
	| 'favorites'
	| 'collections'
	| 'collection-content'
	| 'folders'
	| 'folder-content'
	| 'tags'
	| 'tag-content'
	| 'search'
	| 'files'
	| 'settings'
	| 'development'
	| 'loading'
	| 'albums'
	| 'album-content'
	| 'characters'
	| 'character-content'
	| 'places'
	| 'place-content'
	| 'objects'
	| 'object-content'
	| 'concepts'
	| 'concept-content'
	| 'prompts'
	| 'prompt-content'
	| 'notes'
	| 'note-content';

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
