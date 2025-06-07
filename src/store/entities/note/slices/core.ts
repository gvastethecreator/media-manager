import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { fromPrismaNote } from '@/transformers/note/serializers';
import type { Note, NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';
import { StateCreator } from 'zustand';
import type { NoteStore } from '../types';

import {
	createNote as createNoteAction,
	deleteNote as deleteNoteAction,
	getNotes as getNotesAction,
	updateNote as updateNoteAction,
} from '@/app/actions/notes';

const coreLogger = clientLogger.withContext('NoteStore:Core');

export interface CoreSlice {
	// Estado
	notes: NoteWithStats[];
	selectedNote: Note | null;
	isLoading: boolean;
	error: string | null;

	// Acciones
	loadNotes: () => Promise<void>;
	setNotes: (notes: NoteWithStats[]) => void;
	createNote: (note: NoteCreateInput) => Promise<void>;
	updateNote: (id: string, note: NoteUpdateInput) => Promise<void>;
	deleteNote: (id: string) => Promise<void>;
	selectNote: (note: Note | null) => void;
	reset: () => void;
}

export const createCoreSlice: StateCreator<NoteStore, [], [], CoreSlice> = (set, get) => ({
	// Estado inicial
	notes: [],
	selectedNote: null,
	isLoading: false,
	error: null,

	// Acciones
	loadNotes: async () => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('🔄 Cargando notas');

			// Estrategia 1: Usar server action (preferida)
			try {
				const result = await getNotesAction();

				if (result && Array.isArray(result)) {
					set({
						notes: result.map(fromPrismaNote),
						isLoading: false,
					});
					coreLogger.info('✅ Notas cargadas con Server Action:', result.length);
					return result;
				}
			} catch (serverActionError) {
				coreLogger.warn('⚠️ Error con Server Action, intentando API:', serverActionError);
			}

			// Estrategia 2: Usar API
			try {
				const response = await fetch('/api/entities/notes');

				if (!response.ok) {
					throw new Error(`Error al cargar notas: ${response.status}`);
				}

				const data = await response.json();
				const notes = Array.isArray(data) ? data.map(fromPrismaNote) : [];

				set({
					notes: notes,
					isLoading: false,
				});

				coreLogger.info('✅ Notas cargadas vía API:', notes.length);
				return notes;
			} catch (apiError) {
				coreLogger.error('❌ Error con API:', apiError);
				throw apiError;
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error final al cargar notas:', error);
			set({ error: errorMessage, isLoading: false });
			toastService.system.error('Error al cargar notas');
			return [];
		}
	},

	setNotes: (notes) => {
		coreLogger.info('📥 Estableciendo notas manualmente:', { count: notes.length });
		set({ notes, isLoading: false });
	},

	createNote: async (note) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('✨ Creando nota:', note);

			// Estrategia 1: Usar server action (preferida)
			try {
				const newNote = await createNoteAction(note);

				set((state) => ({
					notes: [...state.notes, newNote],
					isLoading: false,
				}));

				coreLogger.info('✅ Nota creada correctamente:', newNote.id);
				toastService.system.success('Nota creada correctamente');
				return newNote;
			} catch (serverActionError) {
				coreLogger.warn('⚠️ Error con Server Action, intentando API:', serverActionError);
			}

			// Estrategia 2: Usar API
			const response = await fetch('/api/entities/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(note),
			});

			if (!response.ok) {
				throw new Error(`Error al crear nota: ${response.status}`);
			}

			const newNote = fromPrismaNote(await response.json());

			set((state) => ({
				notes: [...state.notes, newNote],
				isLoading: false,
			}));

			coreLogger.info('✅ Nota creada correctamente vía API:', newNote.id);
			toastService.system.success('Nota creada correctamente');
			return newNote;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al crear nota:', error);
			set({ error: errorMessage, isLoading: false });
			toastService.system.error('Error al crear nota');
			return null;
		}
	},

	updateNote: async (id, note) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('🔄 Actualizando nota:', { id, ...note });

			// Estrategia 1: Usar server action (preferida)
			try {
				const updatedNote = await updateNoteAction(id, note);

				set((state) => ({
					notes: state.notes.map((note) => (note.id === id ? updatedNote : note)),
					isLoading: false,
				}));

				coreLogger.info('✅ Nota actualizada correctamente:', id);
				toastService.system.success('Nota actualizada correctamente');
				return;
			} catch (serverActionError) {
				coreLogger.warn('⚠️ Error con Server Action, intentando API:', serverActionError);
			}

			// Estrategia 2: Usar API
			const response = await fetch(`/api/entities/notes/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(note),
			});

			if (!response.ok) {
				throw new Error(`Error al actualizar nota: ${response.status}`);
			}

			const updatedNote = fromPrismaNote(await response.json());

			set((state) => ({
				notes: state.notes.map((note) => (note.id === id ? updatedNote : note)),
				isLoading: false,
			}));

			coreLogger.info('✅ Nota actualizada correctamente vía API:', id);
			toastService.system.success('Nota actualizada correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al actualizar nota:', error);
			set({ error: errorMessage, isLoading: false });
			toastService.system.error('Error al actualizar nota');
		}
	},

	deleteNote: async (id) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('🗑️ Eliminando nota:', id);

			// Estrategia 1: Usar server action (preferida)
			try {
				await deleteNoteAction(id);

				set((state) => ({
					notes: state.notes.filter((note) => note.id !== id),
					isLoading: false,
				}));

				coreLogger.info('✅ Nota eliminada correctamente:', id);
				toastService.system.success('Nota eliminada correctamente');
				return;
			} catch (serverActionError) {
				coreLogger.warn('⚠️ Error con Server Action, intentando API:', serverActionError);
			}

			// Estrategia 2: Usar API
			const response = await fetch(`/api/entities/notes/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`Error al eliminar nota: ${response.status}`);
			}

			set((state) => ({
				notes: state.notes.filter((note) => note.id !== id),
				isLoading: false,
			}));

			coreLogger.info('✅ Nota eliminada correctamente vía API:', id);
			toastService.system.success('Nota eliminada correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al eliminar nota:', error);
			set({ error: errorMessage, isLoading: false });
			toastService.system.error('Error al eliminar nota');
		}
	},

	selectNote: (note) => {
		set({ selectedNote: note });
	},

	reset: () => {
		set({
			notes: [],
			selectedNote: null,
			isLoading: false,
			error: null,
		});
	},
});
