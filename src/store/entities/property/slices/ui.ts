/**
 * @file Slice de UI para el store de propiedades
 * @module store/entities/property/slices/ui
 */

import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { PropertyViewMode } from '@/types/entities/property';
import type { PropertyState } from '../types';

const uiLogger = clientLogger.withContext('PropertyStore:UI');

// Slice para operaciones de UI
export interface PropertyUISlice {
	// Selección
	selectProperty: (id: string | null) => void;
	deselectProperty: (id: string) => void;
	togglePropertySelection: (id: string) => void;
	selectMultipleProperties: (ids: string[]) => void;
	clearPropertySelection: () => void;
	isPropertySelected: (id: string) => boolean;

	// Visor
	openViewer: (propertyId: string) => void;
	closeViewer: () => void;
	setCurrentProperty: (propertyId: string | null) => void;

	// Vista
	setViewMode: (mode: PropertyViewMode) => void;

	// Estados visuales
	setPropertyDisplayState: (propertyId: string, state: Partial<any>) => void;
	resetPropertyDisplayState: (propertyId: string) => void;

	// Drag & drop
	setDraggedProperty: (id: string | null) => void;
	setDropTargetProperty: (id: string | null) => void;

	// Navegación
	setHighlightedProperty: (id: string | null) => void;

	// Expansión (para vistas jerárquicas)
	togglePropertyExpanded: (id: string) => void;
	expandProperty: (id: string) => void;
	collapseProperty: (id: string) => void;
	expandAllProperties: () => void;
	collapseAllProperties: () => void;

	// Reset
	resetUI: () => void;
}

// Creador del slice
export const createPropertyUISlice: StateCreator<PropertyState, [], [], PropertyUISlice> = (set, get) => ({
	// Selección
	selectProperty: (id) => {
		// Si id es null, limpiar la selección
		if (id === null) {
			uiLogger.info('🧹 Limpiando selección de propiedades');
			set((state) => ({
				ui: {
					...state.ui,
					selectedIds: [],
				},
			}));
			return;
		}

		uiLogger.info('🔍 Seleccionando propiedad:', id);
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];

			return {
				ui: {
					...state.ui,
					selectedIds: currentSelectedIds.includes(id) ? currentSelectedIds : [...currentSelectedIds, id],
				},
			};
		});
	},

	deselectProperty: (id) => {
		uiLogger.info('🔍 Deseleccionando propiedad:', id);
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];

			return {
				ui: {
					...state.ui,
					selectedIds: currentSelectedIds.filter((selectedId) => selectedId !== id),
				},
			};
		});
	},

	togglePropertySelection: (id) => {
		const isSelected = get().isPropertySelected(id);
		uiLogger.info(`🔄 ${isSelected ? 'Deseleccionando' : 'Seleccionando'} propiedad:`, id);

		if (isSelected) {
			get().deselectProperty(id);
		} else {
			get().selectProperty(id);
		}
	},

	selectMultipleProperties: (ids) => {
		uiLogger.info('🔍 Seleccionando múltiples propiedades:', ids.length);
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];

			return {
				ui: {
					...state.ui,
					selectedIds: [...new Set([...currentSelectedIds, ...ids])],
				},
			};
		});
	},

	clearPropertySelection: () => {
		uiLogger.info('🧹 Limpiando selección de propiedades');
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [],
			},
		}));
	},

	isPropertySelected: (id) => {
		// Asegurarse de que selectedIds está inicializado
		const selectedIds = get().ui.selectedIds || [];
		return selectedIds.includes(id);
	},

	// Visor
	openViewer: (propertyId) => {
		uiLogger.info('👁️ Abriendo visor para propiedad:', propertyId);
		set((state) => ({
			ui: {
				...state.ui,
				isViewerOpen: true,
				currentPropertyId: propertyId,
			},
		}));
	},

	closeViewer: () => {
		uiLogger.info('👁️ Cerrando visor de propiedades');
		set((state) => ({
			ui: {
				...state.ui,
				isViewerOpen: false,
			},
		}));
	},

	setCurrentProperty: (propertyId) => {
		uiLogger.info('👁️ Cambiando propiedad actual a:', propertyId);
		set((state) => ({
			ui: {
				...state.ui,
				currentPropertyId: propertyId,
			},
		}));
	},

	// Vista
	setViewMode: (mode) => {
		uiLogger.info('👁️ Cambiando modo de vista a:', mode);
		set((state) => ({
			ui: {
				...state.ui,
				viewMode: mode,
			},
		}));
	},

	// Estados visuales
	setPropertyDisplayState: (propertyId, _state) => {
		uiLogger.info('🎨 Actualizando estado visual para propiedad:', propertyId);
		set((state) => ({
			ui: {
				...state.ui,
				displayState: {
					...state.ui.displayState,
					[propertyId]: {
						...state.ui.displayState[propertyId],
						...state,
					},
				},
			},
		}));
	},

	resetPropertyDisplayState: (propertyId) => {
		uiLogger.info('🧹 Reseteando estado visual para propiedad:', propertyId);
		set((state) => {
			const { [propertyId]: _, ...rest } = state.ui.displayState;
			return {
				ui: {
					...state.ui,
					displayState: rest,
				},
			};
		});
	},

	// Drag & drop
	setDraggedProperty: (id) => {
		uiLogger.info('🖱️ Estableciendo propiedad arrastrada:', id);
		set((state) => ({
			ui: {
				...state.ui,
				draggedPropertyId: id,
			},
		}));
	},

	setDropTargetProperty: (id) => {
		uiLogger.info('🎯 Estableciendo propiedad objetivo para soltar:', id);
		set((state) => ({
			ui: {
				...state.ui,
				dropTargetPropertyId: id,
			},
		}));
	},

	// Navegación
	setHighlightedProperty: (id) => {
		set((state) => ({
			ui: {
				...state.ui,
				highlightedId: id,
			},
		}));
	},

	// Expansión (para vistas jerárquicas)
	togglePropertyExpanded: (id) => {
		// Asegurarse de que expandedIds está inicializado
		const expandedIds = get().ui.expandedIds || [];
		const isExpanded = expandedIds.includes(id);
		uiLogger.info(`🔄 ${isExpanded ? 'Colapsando' : 'Expandiendo'} propiedad:`, id);

		if (isExpanded) {
			get().collapseProperty(id);
		} else {
			get().expandProperty(id);
		}
	},

	expandProperty: (id) => {
		uiLogger.info('📂 Expandiendo propiedad:', id);
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.ui.expandedIds || [];

			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.includes(id) ? currentExpandedIds : [...currentExpandedIds, id],
				},
			};
		});
	},

	collapseProperty: (id) => {
		uiLogger.info('📁 Colapsando propiedad:', id);
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.ui.expandedIds || [];

			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.filter((expandedId) => expandedId !== id),
				},
			};
		});
	},

	expandAllProperties: () => {
		uiLogger.info('📂 Expandiendo todas las propiedades');
		const allIds = Object.keys(get().core.properties);
		set((state) => ({
			ui: {
				...state.ui,
				expandedIds: allIds,
			},
		}));
	},

	collapseAllProperties: () => {
		uiLogger.info('📁 Colapsando todas las propiedades');
		set((state) => ({
			ui: {
				...state.ui,
				expandedIds: [],
			},
		}));
	},

	// Reset
	resetUI: () => {
		uiLogger.info('🧹 Reseteando UI de propiedades');
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [],
				isViewerOpen: false,
				currentPropertyId: null,
				draggedPropertyId: null,
				dropTargetPropertyId: null,
				highlightedId: null,
			},
		}));
	},
});
