import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { useCreateNote, useUpdateNote } from '@/lib/api/notes';
import { toastService } from '@/lib/ui/toast';
import { NoteCategory } from '@/types/entities/note/enums';
import type { NoteCreateInput, NoteBase, NoteUpdateInput } from '@/types/entities/note/types';

// Esquema de validación con Zod, alineado con los tipos canónicos
const noteSchema = z.object({
	title: z.string().min(1, 'El título es requerido').max(100, 'El título es demasiado largo'),
	summary: z.string().optional(),
	content: z.string().optional(),
	color: z.string().optional(),
	emoji: z.string().optional(),
	category: z.nativeEnum(NoteCategory).optional(),
	tags: z.array(z.string()).default([]), // Siempre array de strings
	isFavorite: z.boolean().default(false),
});

// El tipo del formulario se infiere del esquema
type NoteFormData = z.infer<typeof noteSchema>;

interface CreateNoteFormProps {
	note?: NoteBase;
	isEditing?: boolean;
	onSuccess?: (note: NoteBase) => void;
	onCancel?: () => void;
	onPreview?: () => void;
}

export function CreateNoteForm({ note, isEditing = false, onSuccess, onCancel, onPreview }: CreateNoteFormProps) {
	const createNoteMutation = useCreateNote();
	const updateNoteMutation = useUpdateNote();

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
				result = await updateNoteMutation.mutateAsync({ id: note.id, data: updateData });
				toastService.success('Nota actualizada correctamente');
			} else {
				const createData: NoteCreateInput = { ...data };
				result = await createNoteMutation.mutateAsync(createData);
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

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Título</FormLabel>
							<FormControl>
								<Input placeholder="Título de la nota" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="emoji"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Emoji</FormLabel>
							<FormControl>
								<EmojiPicker value={field.value} onEmojiSelect={field.onChange} compact showLabel={false} />
							</FormControl>
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
								<ColorPicker value={field.value || '#3b82f6'} onChange={field.onChange} compact showLabel={false} />
							</FormControl>
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
										<SelectValue placeholder="Selecciona una categoría" />
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
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="summary"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Resumen</FormLabel>
							<FormControl>
								<Textarea placeholder="Un resumen corto..." rows={2} {...field} />
							</FormControl>
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
								<Textarea placeholder="Escribe tu nota aquí..." rows={4} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="isFavorite"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0">
							<FormControl>
								<Checkbox checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Marcar como favorito</FormLabel>
							</div>
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancelar
					</Button>
					{onPreview && (
						<Button type="button" variant="secondary" onClick={onPreview}>
							Vista previa
						</Button>
					)}
					<Button type="submit">
						{isEditing ? 'Guardar Cambios' : 'Crear Nota'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
