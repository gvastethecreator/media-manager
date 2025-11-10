/**
 * @file Formulario de notas con sistema de presets
 * @module components/settings/notes/note-preset-form
 */

import { useState } from 'react';
import { PresetForm } from '@/components/settings/common/preset-form';
import { useCreateNote, useUpdateNote } from '@/lib/api/notes';
import { toastService } from '@/lib/ui/toast';
import type { NoteWithStats } from '@/types/entities/note/types';

interface NotePresetFormProps {
	note?: NoteWithStats | null;
	isEditing?: boolean;
	onCreated?: (note: NoteWithStats) => void;
	onUpdated?: (note: NoteWithStats) => void;
	onCancel?: () => void;
}

export function NotePresetForm({
	note,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: NotePresetFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createNoteMutation = useCreateNote();
	const updateNoteMutation = useUpdateNote();

	const initialData = isEditing && note ? {
		name: note.title, // Note usa 'title' internamente
		emoji: note.emoji,
		color: note.color,
		content: note.content,
		category: note.category,
		isFavorite: note.isFavorite,
	} : undefined;

	const handleSubmit = async (data: any) => {
		try {
			setIsSubmitting(true);

			const noteData = {
				title: data.name, // Note usa 'title' en la API
				emoji: data.emoji || '🗒️',
				color: data.color || '#eab308',
				content: data.content || '',
				category: data.category || null,
				isFavorite: data.isFavorite || false,
			};

			if (isEditing && note) {
				const updated = await updateNoteMutation.mutateAsync({
					id: note.id,
					data: noteData,
				});
				toastService.success('Nota actualizada correctamente');
				onUpdated?.(updated);
			} else {
				const created = await createNoteMutation.mutateAsync(noteData);
				toastService.success('Nota creada correctamente');
				onCreated?.(created);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} la nota`, {
				description: errorMessage,
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PresetForm
			entityType="note"
			onSubmit={handleSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear nota'}
			onCancel={onCancel}
			initialData={initialData}
			isEditing={isEditing}
		/>
	);
}
