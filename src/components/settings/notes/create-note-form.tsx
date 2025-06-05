'use client';

import { createNote, updateNote } from '@/app/actions/notes/note.actions';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import toastService from '@/services/toast.service';
import { NoteCategory } from '@/types/entities/note/enums';
import type { Note } from '@/types/entities/notes';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} id="note-form" className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Título</FormLabel>
								<FormControl>
									<Input placeholder="Título de la nota" {...field} />
								</FormControl>
								<FormDescription>Un título descriptivo para identificar esta nota</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="category"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Categoría</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Seleccionar categoría" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.values(NoteCategory).map((category) => (
											<SelectItem key={category} value={category}>
												{category}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>La categoría ayuda a organizar tus notas</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="summary"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Resumen</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Breve resumen o descripción de la nota"
									{...field}
									value={field.value || ''}
									rows={2}
								/>
							</FormControl>
							<FormDescription>Un resumen corto para entender rápidamente el contenido</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Contenido</FormLabel>
							<FormControl>
								<Textarea placeholder="Contenido detallado de la nota" {...field} value={field.value || ''} rows={8} />
							</FormControl>
							<FormDescription>El contenido principal de la nota</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						control={form.control}
						name="emoji"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Emoji</FormLabel>
								<FormControl>
									<EmojiPicker value={field.value} onChange={field.onChange} onEmojiSelect={field.onChange} />
								</FormControl>
								<FormDescription>Un emoji representativo</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="color"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Color</FormLabel>
								<FormControl>
									<ColorPicker value={field.value} onChange={field.onChange} />
								</FormControl>
								<FormDescription>Color para identificar visualmente</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="tags"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Etiquetas (separadas por coma)</FormLabel>
							<FormControl>
								<Input
									placeholder="Ej: importante, investigación, idea"
									value={field.value !== '[]' ? JSON.parse(field.value || '[]').join(', ') : ''}
									onChange={(e) => {
										// Convertir texto separado por comas a formato JSON
										const tagsArray = e.target.value
											.split(',')
											.map((tag) => tag.trim())
											.filter(Boolean);
										field.onChange(JSON.stringify(tagsArray));
									}}
								/>
							</FormControl>
							<FormDescription>
								Las etiquetas te ayudan a organizar y encontrar tus notas más fácilmente
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="isFavorite"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Marcar como favorita</FormLabel>
								<FormDescription>Las notas favoritas aparecerán destacadas en los listados</FormDescription>
							</div>
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-2">
					{onCancel && (
						<Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
							Cancelar
						</Button>
					)}
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
