import {
	createNote as createNoteAction,
	deleteNote as deleteNoteAction,
	getNotes as getNotesAction,
	updateNote as updateNoteAction,
} from '@/app/actions/notes';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import type { NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note/types';
import { StateCreator } from 'zustand';
import type { NoteStore } from '../types';

const coreLogger = clientLogger.withContext('NoteStore:Core');

// Función temporal para transformar Note a NoteWithStats
const transformNoteToWithStats = (note: any): NoteWithStats => ({
	...note,
	stats: {
		totalItems: 0,
		totalImages: note._count?.images || 0,
		totalVideos: note._count?.videos || 0,
		totalAlbums: note._count?.albums || 0,
		totalCollections: note._count?.collections || 0,
		totalTags: note._count?.tags || 0,
		totalCharacters: note._count?.characters || 0,
		totalPlaces: note._count?.places || 0,
		totalWorldItems: note._count?.worldItems || 0,
		totalConcepts: note._count?.concepts || 0,
		totalPrompts: note._count?.prompts || 0,
		totalWildcards: note._count?.wildcards || 0,
		totalProperties: note._count?.properties || 0,
		totalGroups: note._count?.groups || 0,
		lastUpdated: note.updatedAt,
	},
});

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
			const notes = await getNotesAction();
			const notesWithStats = notes.map((note: any) => transformNoteToWithStats(note));
			const notesRecord = notesWithStats.reduce(
				(acc: Record<string, NoteWithStats>, note: NoteWithStats) => {
					acc[note.id] = note;
					return acc;
				},
				{} as Record<string, NoteWithStats>
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
			const noteData = await createNoteAction(note);
			const newNote = transformNoteToWithStats(noteData);

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
			const updatedNoteData = await updateNoteAction(id, noteData);
			const updatedNote = transformNoteToWithStats(updatedNoteData);

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
			await deleteNoteAction(id);

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
