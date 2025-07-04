import { clientLogger } from '@/lib/logger/client-logger';
// Ahora usamos el cliente de API y no el servicio del servidor
import {
    createNoteInApi,
    deleteNoteFromApi,
    getNotesFromApi,
    updateNoteInApi,
} from '@/lib/api/client/note.client';
import { toastService } from '@/services/toast';
import { adaptNoteCompleteToWithStats, adaptNotesCompleteToWithStats } from '@/transformers/note/note-adapter';
import type { NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';
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

function getPriorityLabel(priority: number): string {
	switch (priority) {
		case 4:
			return 'Crítica';
		case 3:
			return 'Alta';
		case 2:
			return 'Media';
		case 1:
			return 'Baja';
		case 0:
			return 'Mínima';
		default:
			return 'Sin definir';
	}
}

function getStatusLabel(status: string): string {
	switch (status) {
		case 'active':
			return 'Activa';
		case 'draft':
			return 'Borrador';
		case 'completed':
			return 'Completada';
		case 'archived':
			return 'Archivada';
		case 'pending':
			return 'Pendiente';
		default:
			return 'Sin estado';
	}
}

function getCategoryLabel(category: string): string {
	switch (category) {
		case 'general':
			return 'General';
		case 'story':
			return 'Historia';
		case 'lore':
			return 'Lore';
		case 'mechanics':
			return 'Mecánicas';
		case 'character':
			return 'Personaje';
		case 'place':
			return 'Lugar';
		case 'world_item':
			return 'Objeto';
		case 'prompt':
			return 'Prompt';
		case 'idea':
			return 'Idea';
		case 'todo':
			return 'Tarea';
		default:
			return 'Sin categoría';
	}
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
                        const notesData = await getNotesFromApi();

			// Convertir NoteComplete[] a NoteWithStats[] usando el adaptador
			const notesWithStats = adaptNotesCompleteToWithStats(notesData.items);
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
                        const newNoteData = await createNoteInApi(note);

			// Convertir NoteComplete a NoteWithStats usando el adaptador
			const newNote = adaptNoteCompleteToWithStats(newNoteData);

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
                        const updatedNoteData = await updateNoteInApi(id, noteData);

			// Convertir NoteComplete a NoteWithStats usando el adaptador
			const updatedNote = adaptNoteCompleteToWithStats(updatedNoteData);

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

			// Llamar a la acción de borrado
                    await deleteNoteFromApi(id);

			// Actualizar el estado local
			const newNotes = { ...get().notes };
			delete newNotes[id];
			set({
				notes: newNotes,
				selectedNote: get().selectedNoteId === id ? null : get().selectedNote,
				selectedNoteId: get().selectedNoteId === id ? null : get().selectedNoteId,
				isLoading: false,
				loading: false,
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

	selectNote: (note: NoteWithStats | null) => {
		set({
			selectedNote: note,
			selectedNoteId: note ? note.id : null,
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
