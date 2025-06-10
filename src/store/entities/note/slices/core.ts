import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { fromPrismaNote } from '@/transformers/note/serializers';
import { transformNoteToWithStats } from '@/transformers/note/transformer';
import type { NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';
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
	selectedNote: NoteWithStats | null;
	isLoading: boolean;
	error: string | null;

	// Acciones
	loadNotes: () => Promise<NoteWithStats[]>;
	setNotes: (notes: NoteWithStats[]) => void;
	createNote: (note: NoteCreateInput) => Promise<NoteWithStats | null>;
	updateNote: (id: string, note: NoteUpdateInput) => Promise<void>;
	deleteNote: (id: string) => Promise<void>;
	selectNote: (note: NoteWithStats | null) => void;
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

			const result = await getNotesAction();
			// 🔄 Transformar cada NoteComplete a NoteWithStats usando el transformer
			const notes = result.map((noteWithBasicStats) => {
				// Convertir a Note completo primero
				const noteComplete = fromPrismaNote(noteWithBasicStats);
				// Luego transformar a NoteWithStats
				return transformNoteToWithStats(noteComplete);
			});

			set({ notes, isLoading: false });
			coreLogger.info('✅ Notas cargadas:', notes.length);
			return notes;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			coreLogger.error('❌ Error al cargar notas:', error);
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

			const noteComplete = await createNoteAction(note);
			// 🔄 Transformar NoteComplete a NoteWithStats
			const newNote = transformNoteToWithStats(noteComplete);

			set((state) => ({
				notes: [...state.notes, newNote],
				isLoading: false,
			}));

			coreLogger.info('✅ Nota creada correctamente:', newNote.id);
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

	updateNote: async (id, noteData) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('🔄 Actualizando nota:', { id, noteData });

			const noteComplete = await updateNoteAction(id, noteData);
			// 🔄 Transformar NoteComplete a NoteWithStats
			const updatedNote = transformNoteToWithStats(noteComplete);

			set((state) => ({
				notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
				isLoading: false,
			}));

			coreLogger.info('✅ Nota actualizada correctamente:', id);
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

			await deleteNoteAction(id);

			set((state) => ({
				notes: state.notes.filter((note) => note.id !== id),
				isLoading: false,
			}));

			coreLogger.info('✅ Nota eliminada correctamente:', id);
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
