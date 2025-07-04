/**
 * @file Hooks para interactuar con la entidad Note.
 * @module hooks/entities/note/useNotes
 * @description
 * Este archivo proporciona hooks para desacoplar la lógica de acceso a datos y acciones
 * de los componentes de la UI, siguiendo un patrón más granular y performante que el anterior "god hook".
 * Se utiliza React Query para la gestión del estado del servidor (fetching, caching, etc.).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/ui/use-toast';
import { createNote, deleteNote, getNotes, updateNote } from '@/services/note/note.service';
import type { NoteBase, NoteCreateInput, NoteUpdateInput } from '@/types/entities/note';

const NOTE_QUERY_KEY = 'notes';

/**
 * 훅 para obtener todas las notas.
 * Gestiona el fetching, caching, y el estado de carga/error usando React Query.
 *
 * @returns Un objeto con la lista de notas y el estado de la consulta.
 */
export function useNotes() {
	return useQuery<NoteBase[], Error>({
		queryKey: [NOTE_QUERY_KEY],
		queryFn: () => getNotes(),
	});
}

/**
 * 훅 para obtener una única nota por su ID.
 * Utiliza los datos cacheados por `useNotes` para una respuesta instantánea.
 *
 * @param noteId El ID de la nota a obtener.
 * @returns El objeto de la nota si se encuentra, y el estado de la consulta.
 */
export function useNote(noteId: string | null) {
	const { data: notes, ...rest } = useNotes();

	const note = noteId ? (notes?.find((n) => n.id === noteId) ?? null) : null;

	return { note, ...rest };
}

/**
 * 훅 que proporciona las acciones de mutación para las notas (crear, actualizar, eliminar).
 * Gestiona la invalidación de caché de React Query para mantener los datos sincronizados.
 */
export function useNoteActions() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const invalidateNotesCache = () => {
		return queryClient.invalidateQueries({ queryKey: [NOTE_QUERY_KEY] });
	};

	const { mutate: create, isPending: isCreating } = useMutation({
		mutationFn: (data: NoteCreateInput) => createNote(data),
		onSuccess: (newNote) => {
			toast({ title: 'Nota Creada', description: `La nota "${newNote.title}" ha sido creada.` });
			return invalidateNotesCache();
		},
		onError: (error) => {
			toast({
				variant: 'destructive',
				title: 'Error al Crear',
				description: error.message,
			});
		},
	});

	const { mutate: update, isPending: isUpdating } = useMutation({
		mutationFn: ({ id, data }: { id: string; data: NoteUpdateInput }) => updateNote(id, data),
		onSuccess: (updatedNote) => {
			toast({ title: 'Nota Actualizada', description: `La nota "${updatedNote.title}" ha sido actualizada.` });
			return invalidateNotesCache();
		},
		onError: (error) => {
			toast({
				variant: 'destructive',
				title: 'Error al Actualizar',
				description: error.message,
			});
		},
	});

	const { mutate: remove, isPending: isDeleting } = useMutation({
		mutationFn: (id: string) => deleteNote(id),
		onSuccess: (_data, _id) => {
			toast({ title: 'Nota Eliminada', description: 'La nota ha sido eliminada.' });
			return invalidateNotesCache();
		},
		onError: (error) => {
			toast({
				variant: 'destructive',
				title: 'Error al Eliminar',
				description: error.message,
			});
		},
	});

	return {
		create,
		isCreating,
		update,
		isUpdating,
		remove,
		isDeleting,
	};
}
