import {
    createNote as createNoteAction,
    deleteNote as deleteNoteAction,
    getNotes as getNotesAction,
    updateNote as updateNoteAction,
} from '@/app/actions/notes';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { transformNoteToWithStats } from '@/transformers/note/transformer';
import type { NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';
import { StateCreator } from 'zustand';
import type { NoteStore } from '../types';

const coreLogger = clientLogger.withContext('NoteStore:Core');

export interface CoreSlice {
	notes: Record<string, NoteWithStats>;
	selectedNoteId: string | null;
	isLoading: boolean;
	error: string | null;

	loadNotes: () => Promise<void>;
	createNote: (note: NoteCreateInput) => Promise<string | null>;
	updateNote: (id: string, note: NoteUpdateInput) => Promise<void>;
	deleteNote: (id: string) => Promise<void>;
	selectNote: (noteId: string | null) => void;
	reset: () => void;
}

export const createCoreSlice: StateCreator<NoteStore, [], [], CoreSlice> = (set) => ({
	notes: {},
	selectedNoteId: null,
	isLoading: false,
	error: null,

	loadNotes: async () => {
		set({ isLoading: true, error: null });
		try {
			coreLogger.info('🔄 Cargando notas');
			const response = await getNotesAction();

			if (!response.success || !response.data) {
				throw new Error(response.error || 'No se pudieron cargar las notas.');
			}
			const notesWithStats = response.data.map(transformNoteToWithStats);
			const notesRecord = notesWithStats.reduce(
				(acc, note) => {
					acc[note.id] = note;
					return acc;
				},
				{} as Record<string, NoteWithStats>,
			);

			set({ notes: notesRecord, isLoading: false });
			coreLogger.info('✅ Notas cargadas:', Object.keys(notesRecord).length);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al cargar notas:', errorMessage);
			set({ error: errorMessage, isLoading: false });
			toastService.error('Error al cargar notas', { description: errorMessage });
		}
	},

	createNote: async (note) => {
		set({ isLoading: true, error: null });
		try {
			coreLogger.info('✨ Creando nota:', note);
			const response = await createNoteAction(note);

			if (!response.success || !response.data) {
				throw new Error(response.error || 'No se pudo crear la nota.');
			}
			const newNote = transformNoteToWithStats(response.data);

			set((state) => ({
				notes: { ...state.notes, [newNote.id]: newNote },
				isLoading: false,
			}));

			coreLogger.info('✅ Nota creada correctamente:', newNote.id);
			toastService.success('Nota creada correctamente');

			return newNote.id;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al crear nota:', errorMessage);
			set({ error: errorMessage, isLoading: false });
			toastService.error('Error al crear nota', { description: errorMessage });
			return null;
		}
	},

	updateNote: async (id, noteData) => {
		set({ isLoading: true, error: null });
		try {
			coreLogger.info('🔄 Actualizando nota:', { id, noteData });
			const response = await updateNoteAction(id, noteData);

			if (!response.success || !response.data) {
				throw new Error(response.error || 'No se pudo actualizar la nota.');
			}
			const updatedNote = transformNoteToWithStats(response.data);

			set((state) => ({
				notes: { ...state.notes, [id]: updatedNote },
				isLoading: false,
			}));

			coreLogger.info('✅ Nota actualizada correctamente:', id);
			toastService.success('Nota actualizada correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al actualizar nota:', errorMessage);
			set({ error: errorMessage, isLoading: false });
			toastService.error('Error al actualizar nota', { description: errorMessage });
		}
	},

	deleteNote: async (id) => {
		set({ isLoading: true, error: null });
		try {
			coreLogger.info('🗑️ Eliminando nota:', id);
			const response = await deleteNoteAction(id);

			if (!response.success) {
				throw new Error(response.error || 'No se pudo eliminar la nota.');
			}

			set((state) => {
				const newNotes = { ...state.notes };
				delete newNotes[id];
				return { notes: newNotes, isLoading: false };
			});

			coreLogger.info('✅ Nota eliminada correctamente:', id);
			toastService.success('Nota eliminada correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al eliminar nota:', errorMessage);
			set({ error: errorMessage, isLoading: false });
			toastService.error('Error al eliminar nota', { description: errorMessage });
		}
	},

	selectNote: (noteId) => {
		set({ selectedNoteId: noteId });
	},

	reset: () => {
		set({
			notes: {},
			selectedNoteId: null,
			isLoading: false,
			error: null,
		});
	},
});
