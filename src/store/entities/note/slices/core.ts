import {
	createNote as createNoteAction,
	deleteNote as deleteNoteAction,
	getNotes as getNotesAction,
	updateNote as updateNoteAction,
} from '@/app/actions/notes';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import type { Note, NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';
import { StateCreator } from 'zustand';
import type { NoteStore } from '../types';

const coreLogger = clientLogger.withContext('NoteStore:Core');

export interface CoreSlice {
	// Estado principal
	notes: Record<string, NoteWithStats>;
	selectedNote: NoteWithStats | null;
	selectedNoteId: string | null;
	selectedNoteIds: string[];
	isMultiSelectMode: boolean;
	isLoading: boolean;
	loading: boolean; // Alias para compatibilidad
	error: string | null;
	version: string;

	// Acciones
	loadNotes: () => Promise<void>;
	createNote: (note: NoteCreateInput) => Promise<void>;
	updateNote: (id: string, note: NoteUpdateInput) => Promise<void>;
	deleteNote: (id: string) => Promise<void>;
	selectNote: (note: NoteWithStats | null) => void;
	reset: () => void;
}

export const createCoreSlice: StateCreator<NoteStore, [], [], CoreSlice> = (set, get) => ({
	// Estado inicial
	notes: {},
	selectedNote: null,
	selectedNoteId: null,
	selectedNoteIds: [],
	isMultiSelectMode: false,
	isLoading: false,
	loading: false, // Alias para compatibilidad
	error: null,
	version: '1.0.0',

	loadNotes: async () => {
		set({ isLoading: true, loading: true, error: null });
		try {
			coreLogger.info('🔄 Cargando notas');
			const notesWithStats = await getNotesAction();
			const notesRecord = notesWithStats.reduce(
				(acc: Record<string, NoteWithStats>, note: NoteWithStats) => {
					acc[note.id] = note;
					return acc;
				},
				{} as Record<string, NoteWithStats>
			);

			set({
				notes: notesRecord,
				isLoading: false,
				loading: false,
			});
			coreLogger.info('✅ Notas cargadas:', Object.keys(notesRecord).length);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al cargar notas:', errorMessage);
			set({
				error: errorMessage,
				isLoading: false,
				loading: false,
			});
			toastService.error('Error al cargar notas', { description: errorMessage });
		}
	},

	createNote: async (note) => {
		set({ isLoading: true, loading: true, error: null });
		try {
			coreLogger.info('✨ Creando nota:', note);
			const newNote = await createNoteAction(note);

			set((state) => ({
				notes: { ...state.notes, [newNote.id]: newNote },
				isLoading: false,
				loading: false,
			}));

			coreLogger.info('✅ Nota creada correctamente:', newNote.id);
			toastService.success('Nota creada correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al crear nota:', errorMessage);
			set({
				error: errorMessage,
				isLoading: false,
				loading: false,
			});
			toastService.error('Error al crear nota', { description: errorMessage });
		}
	},

	updateNote: async (id, noteData) => {
		set({ isLoading: true, loading: true, error: null });
		try {
			coreLogger.info('🔄 Actualizando nota:', { id, noteData });
			const updatedNote = await updateNoteAction(id, noteData);

			set((state) => ({
				notes: { ...state.notes, [id]: updatedNote },
				selectedNote: state.selectedNoteId === id ? updatedNote : state.selectedNote,
				isLoading: false,
				loading: false,
			}));

			coreLogger.info('✅ Nota actualizada correctamente:', id);
			toastService.success('Nota actualizada correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al actualizar nota:', errorMessage);
			set({
				error: errorMessage,
				isLoading: false,
				loading: false,
			});
			toastService.error('Error al actualizar nota', { description: errorMessage });
		}
	},

	deleteNote: async (id) => {
		set({ isLoading: true, loading: true, error: null });
		try {
			coreLogger.info('🗑️ Eliminando nota:', id);
			await deleteNoteAction(id);

			set((state) => {
				const newNotes = { ...state.notes };
				delete newNotes[id];
				return {
					notes: newNotes,
					selectedNote: state.selectedNoteId === id ? null : state.selectedNote,
					selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
					selectedNoteIds: state.selectedNoteIds.filter((noteId) => noteId !== id),
					isLoading: false,
					loading: false,
				};
			});

			coreLogger.info('✅ Nota eliminada correctamente:', id);
			toastService.success('Nota eliminada correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al eliminar nota:', errorMessage);
			set({
				error: errorMessage,
				isLoading: false,
				loading: false,
			});
			toastService.error('Error al eliminar nota', { description: errorMessage });
		}
	},

	selectNote: (note) => {
		set({
			selectedNote: note,
			selectedNoteId: note?.id || null,
		});
	},

	reset: () => {
		set({
			notes: {},
			selectedNote: null,
			selectedNoteId: null,
			selectedNoteIds: [],
			isMultiSelectMode: false,
			isLoading: false,
			loading: false,
			error: null,
		});
	},
});
