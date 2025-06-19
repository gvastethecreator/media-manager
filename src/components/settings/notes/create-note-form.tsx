'use client';

import { createNote, updateNote } from '@/app/actions/notes/note.actions';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import toastService from '@/services/toast.service';
import { NoteCategory } from '@/types/entities/note/enums';
import type { Note } from '@/types/entities/notes';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DynamicCreateForm } from '../common/dynamic-create-form';

// Esquema de validación con Zod
const noteSchema = z.object({
	title: z.string().min(1, 'El título es requerido').max(100, 'El título es demasiado largo'),
	summary: z.string().optional(),
	content: z.string().optional(),
	color: z.string().min(1, 'El color es requerido'),
	emoji: z.string().min(1, 'El emoji es requerido'),
	category: z.nativeEnum(NoteCategory).optional(),
	tags: z.string().optional(),
	isFavorite: z.boolean().default(false),
});

type NoteForm = z.infer<typeof noteSchema>;

// Definir una interfaz extendida para tener las propiedades adicionales
interface ExtendedNote extends Note {
	summary?: string;
	color?: string;
	emoji?: string;
}

interface CreateNoteFormProps {
	note?: ExtendedNote | null;
	isEditing?: boolean;
	onCreated?: (note: Note) => void;
	onUpdated?: (note: Note) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
}

export function CreateNoteForm({
	note,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview,
}: CreateNoteFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Configurar react-hook-form
	const form = useForm<NoteForm>({
		resolver: zodResolver(noteSchema),
		defaultValues: {
			title: '',
			summary: '',
			content: '',
			color: '#3b82f6',
			emoji: '📝',
			category: undefined,
			tags: '[]',
			isFavorite: false,
		},
	});

	// Actualizar vista previa en tiempo real
	useEffect(() => {
		if (onPreview) {
			const subscription = form.watch((data) => {
				onPreview(data);
			});
			return () => subscription.unsubscribe();
		}
	}, [form, onPreview]);

	// Cargar datos iniciales si estamos editando
	useEffect(() => {
		if (note && isEditing) {
			form.reset({
				title: note.title,
				summary: (note as ExtendedNote).summary || '',
				content: note.content || '',
				color: (note as ExtendedNote).color || '#3b82f6',
				emoji: (note as ExtendedNote).emoji || '📝',
				category: note.category as NoteCategory | undefined,
				tags: note.tags || '[]',
				isFavorite: note.isFavorite || false,
			});
		}
	}, [note, isEditing, form]);

	// Manejar envío del formulario
	const onSubmit = async (data: NoteForm) => {
		try {
			setIsSubmitting(true);

			if (isEditing && note) {
				// Actualizar nota existente - incluir ID como parte de la actualización
				const updatedNote = await updateNote(note.id, {
					...data,
					id: note.id,
				});
				if (onUpdated) {
					onUpdated(updatedNote);
				}
				toastService.success('Nota actualizada correctamente');
			} else {
				// Crear nueva nota
				const newNote = await createNote(data);
				if (onCreated) {
					onCreated(newNote);
				}
				form.reset(); // Limpiar formulario después de crear
				toastService.success('Nota creada correctamente');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(isEditing ? 'Error al actualizar la nota' : 'Error al crear la nota', {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const optionalFields = [
		{
			name: 'emoji',
			label: 'Emoji',
			render: ({ value, onChange }: any) => (
				<EmojiPicker value={value} onEmojiSelect={onChange} compact showLabel={false} />
			),
		},
		{
			name: 'color',
			label: 'Color',
			render: ({ value, onChange }: any) => <ColorPicker value={value} onChange={onChange} compact showLabel={false} />,
		},
		{
			name: 'description',
			label: 'Descripción',
			render: ({ value, onChange }: any) => (
				<textarea
					placeholder="Descripción de la nota..."
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					rows={3}
					className="text-xs resize-none w-full border rounded p-2"
				/>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	];

	return (
		<DynamicCreateForm
			optionalFields={optionalFields}
			onSubmit={async (data) => {
				if (isEditing && note) {
					await updateNote(note.id, data);
					onUpdated?.({ ...note, ...data });
				} else {
					const created = await createNote(data);
					onCreated?.(created);
				}
			}}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear nota'}
		/>
	);
}
