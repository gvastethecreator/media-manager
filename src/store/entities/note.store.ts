import {
	type NoteCreate,
	type NoteUpdate,
	type NoteWithStats,
	addNoteToImage,
	createNote as createNoteAction,
	deleteNote as deleteNoteAction,
	getNotes,
	updateNote as updateNoteAction,
} from '@/app/actions/notes/note.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Note } from '@prisma/client';
import { create } from 'zustand';

const noteLogger = serverLogger.withContext('NoteStore');

const mapToNoteWithStats = (note: Awaited<ReturnType<typeof getNotes>>[0]): NoteWithStats => ({
	...note,
	_count: note._count || {
		concepts: 0,
		prompts: 0,
		characters: 0,
		places: 0,
		worldItems: 0,
	},
	lastUpdated: new Date(),
});

interface NoteStore {
	notes: NoteWithStats[];
	isLoading: boolean;
	error: string | null;
	selectedItem: Note | null;
	loadNotes: () => Promise<void>;
	createNote: typeof createNoteAction;
	updateNote: typeof updateNoteAction;
	deleteNote: (id: string) => Promise<void>;
	addNoteToImage: (imageId: string, noteId: string) => Promise<void>;
	selectItem: (note: Note) => void;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
	notes: [],
	isLoading: false,
	error: null,
	selectedItem: null,

	loadNotes: async () => {
		try {
			set({ isLoading: true, error: null });
			noteLogger.info('Cargando notas');
			const rawNotes = await getNotes();
			const notes = rawNotes.map(mapToNoteWithStats);
			set({ notes, isLoading: false });
			noteLogger.info('✅ Notas cargadas');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar notas';
			noteLogger.error('❌ Error al cargar notas:', error);
			set({ error: message, isLoading: false });
		}
	},

	selectItem: (note) => {
		set({ selectedItem: note });
	},

	createNote: async (note) => {
		try {
			set({ isLoading: true, error: null });
			noteLogger.info('✨ Creando nota:', note);
			const newNote = await createNoteAction(note);
			await get().loadNotes();
			noteLogger.info('✅ Nota creada');
			return newNote;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear nota';
			noteLogger.error('❌ Error al crear nota:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	updateNote: async (id, note) => {
		try {
			set({ isLoading: true, error: null });
			noteLogger.info('💾 Actualizando nota:', note);
			const updatedNote = await updateNoteAction(id, { ...note, id });
			await get().loadNotes();
			noteLogger.info('✅ Nota actualizada');
			return updatedNote;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar nota';
			noteLogger.error('❌ Error al actualizar nota:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	deleteNote: async (id) => {
		try {
			set({ isLoading: true, error: null });
			noteLogger.info('🗑️ Eliminando nota:', id);
			await deleteNoteAction(id);
			await get().loadNotes();
			noteLogger.info('✅ Nota eliminada');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar nota';
			noteLogger.error('❌ Error al eliminar nota:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	addNoteToImage: async (imageId, noteId) => {
		try {
			set({ isLoading: true, error: null });
			noteLogger.info('➕ Añadiendo nota a imagen:', { noteId, imageId });
			await addNoteToImage(noteId, imageId);
			await get().loadNotes();
			noteLogger.info('✅ Nota añadida a imagen');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al añadir nota a imagen';
			noteLogger.error('❌ Error al añadir nota a imagen:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
}));
