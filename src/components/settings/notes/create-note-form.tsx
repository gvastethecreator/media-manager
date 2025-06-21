'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createNote, updateNote } from '@/app/actions/notes/note.actions';
import { DynamicCreateForm, type FormField } from '@/components/settings/common/dynamic-create-form';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import toastService from '@/services/toast.service';
import { NoteCategory } from '@/types/entities/note/enums';
import type { NoteBase, NoteCreateInput, NoteUpdateInput } from '@/types/entities/note/types';

// Esquema de validación con Zod, alineado con los tipos canónicos
const noteSchema = z.object({
	title: z.string().min(1, 'El título es requerido').max(100, 'El título es demasiado largo'),
	summary: z.string().optional(),
	content: z.string().optional(),
	color: z.string().min(1, 'El color es requerido'),
	emoji: z.string().min(1, 'El emoji es requerido'),
	category: z.nativeEnum(NoteCategory).optional(),
	tags: z.array(z.string()).optional().default([]), // Manejar como array de strings
	isFavorite: z.boolean().default(false),
});

// El tipo del formulario se infiere del esquema
type NoteFormData = z.infer<typeof noteSchema>;

interface CreateNoteFormProps {
	note?: NoteBase;
	isEditing?: boolean;
	onSuccess?: (note: NoteBase) => void;
	onCancel?: () => void;
}

export function CreateNoteForm({ note, isEditing = false, onSuccess, onCancel }: CreateNoteFormProps) {
	const form = useForm<NoteFormData>({
		resolver: zodResolver(noteSchema),
		defaultValues: {
			title: '',
			summary: '',
			content: '',
			color: '#3b82f6',
			emoji: '📝',
			category: NoteCategory.GENERAL,
			tags: [],
			isFavorite: false,
		},
	});

	// Cargar datos iniciales si estamos editando
	useEffect(() => {
		if (note && isEditing) {
			form.reset({
				...note,
				summary: note.summary || '',
				content: note.content || '',
				tags: Array.isArray(note.tags) ? note.tags : [],
			});
		}
	}, [note, isEditing, form]);

	const onSubmit = async (data: NoteFormData) => {
		try {
			let result: NoteBase;
			if (isEditing && note?.id) {
				const updateData: NoteUpdateInput = { ...data };
				result = await updateNote(note.id, updateData);
				toastService.success('Nota actualizada correctamente');
			} else {
				const createData: NoteCreateInput = { ...data };
				result = await createNote(createData);
				toastService.success('Nota creada correctamente');
				form.reset(); // Limpiar el formulario después de crear
			}
			onSuccess?.(result);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(isEditing ? 'Error al actualizar la nota' : 'Error al crear la nota', {
				description: errorMessage,
			});
		}
	};

	// Definición de campos para DynamicCreateForm
	const fields: FormField<NoteFormData>[] = [
		{ name: 'title', label: 'Título', placeholder: 'Título de la nota...' },
		{ name: 'summary', label: 'Resumen', placeholder: 'Un resumen corto...' },
		{ name: 'content', label: 'Contenido', type: 'textarea', placeholder: 'Escribe tu nota aquí...' },
	];

	const optionalFields: FormField<NoteFormData>[] = [
		{
			name: 'emoji',
			label: 'Emoji',
			render: ({ field }) => <EmojiPicker value={field.value} onEmojiSelect={field.onChange} compact />,
		},
		{
			name: 'color',
			label: 'Color',
			render: ({ field }) => <ColorPicker value={field.value} onChange={field.onChange} compact />,
		},
		// Aquí puedes agregar el campo de tags si tienes un componente para ello
	];

	return (
		<DynamicCreateForm<NoteFormData>
			form={form}
			fields={fields}
			optionalFields={optionalFields}
			onSubmit={onSubmit}
			isSubmitting={form.formState.isSubmitting}
			submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Nota'}
			onCancel={onCancel}
		/>
	);
}
