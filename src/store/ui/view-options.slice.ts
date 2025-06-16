import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 🎨 Opciones de visualización disponibles
type ViewMode = 'grid' | 'list' | 'masonry' | 'cards' | 'details';

// 🔃 Configuración de ordenamiento
export interface SortOptions {
	field: 'name' | 'size' | 'createdAt';
	direction: 'asc' | 'desc';
}

// 🧹 Opciones de filtrado básicas
export interface FilterOptions {
	searchQuery: string;
	[key: string]: string | number | boolean;
}

// 📦 Estado interno del slice
interface ViewOptionsState {
	viewMode: ViewMode;
	sort: SortOptions;
	filters: FilterOptions;
	itemSize: number;
}

// 🚀 Acciones disponibles
interface ViewOptionsActions {
	setViewMode: (mode: ViewMode) => void;
	setSort: (options: Partial<SortOptions>) => void;
	setFilters: (options: Partial<FilterOptions>) => void;
	setItemSize: (size: number) => void;
}

export type ViewOptionsSlice = ViewOptionsState & ViewOptionsActions;

const initialState: ViewOptionsState = {
	viewMode: 'grid',
	sort: { field: 'name', direction: 'asc' },
	filters: { searchQuery: '' },
	itemSize: 100,
};

export const useViewOptionsStore = create<ViewOptionsSlice>()(
	persist(
		(set) => ({
			...initialState,
			setViewMode: (viewMode) => set({ viewMode }),
			setSort: (options) => set((state) => ({ sort: { ...state.sort, ...options } })),
			setFilters: (options) => set((state) => ({ filters: { ...state.filters, ...options } })),
			setItemSize: (size) => set({ itemSize: size }),
		}),
		{ name: 'view-options' }
	)
);

export type { ViewMode };
