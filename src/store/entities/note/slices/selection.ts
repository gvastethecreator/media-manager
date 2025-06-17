import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { NoteStore } from '../types';

const selectionLogger = clientLogger.withContext('NoteStore:Selection');

export interface SelectionSlice {
	// Estado
	selectedNoteId: string | null;
	selectedNoteIds: string[];
	isMultiSelectMode: boolean;

	// Acciones - selección individual
	selectNote: (id: string) => void;
	unselectNote: () => void;

	// Acciones - selección múltiple
	toggleMultiSelectMode: () => void;
	toggleNoteSelection: (id: string) => void;
	selectAllNotes: () => void;
	clearSelection: () => void;

	// Reset
	resetSelection: () => void;
}

// Estado inicial por defecto para selección
const initialSelectionState = {
	selectedNoteId: null,
	selectedNoteIds: [],
	isMultiSelectMode: false,
};

export const createSelectionSlice: StateCreator<NoteStore, [], [], SelectionSlice> = (set, get) => ({
	// Estado inicial
	...initialSelectionState,

	// Acciones - selección individual
	selectNote: (id) => {
		selectionLogger.info('🔍 Seleccionando nota', { id });
		set({ selectedNoteId: id });
	},

	unselectNote: () => {
		selectionLogger.info('🔍 Deseleccionando nota');
		set({ selectedNoteId: null });
	},

	// Acciones - selección múltiple
	toggleMultiSelectMode: () => {
		const currentMode = get().isMultiSelectMode;
		const newMode = !currentMode;

		selectionLogger.info('🔍 Cambiando modo de selección múltiple', {
			from: currentMode,
			to: newMode,
		});

		// Si desactivamos el modo de selección múltiple, limpiamos la selección
		if (!newMode) {
			set({
				isMultiSelectMode: newMode,
				selectedNoteIds: [],
			});
		} else {
			set({ isMultiSelectMode: newMode });
		}
	},

	toggleNoteSelection: (id) => {
		const { selectedNoteIds } = get();
		const isSelected = selectedNoteIds.includes(id);

		selectionLogger.info('🔍 Alternando selección de nota', { id, wasSelected: isSelected });

		if (isSelected) {
			// Quitar de la selección
			set({
				selectedNoteIds: selectedNoteIds.filter((noteId) => noteId !== id),
			});
		} else {
			// Añadir a la selección
			set({
				selectedNoteIds: [...selectedNoteIds, id],
			});
		}
	},

	selectAllNotes: () => {
		const { notes } = get();
		const allNoteIds = notes.map((note) => note.id);

		selectionLogger.info('🔍 Seleccionando todas las notas', { count: allNoteIds.length });

		set({
			selectedNoteIds: allNoteIds,
			isMultiSelectMode: true,
		});
	},

	clearSelection: () => {
		selectionLogger.info('🔍 Limpiando selección múltiple');
		set({ selectedNoteIds: [] });
	},

	// Reset
	resetSelection: () => {
		selectionLogger.info('🔄 Reseteando estado de selección');
		set({ ...initialSelectionState });
	},
});
