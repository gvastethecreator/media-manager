'use client';

import { createTagAction, updateTagAction } from '@/app/actions/tags';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toastService from '@/services/toast.service';
import { generateTagColor, generateTagEmoji } from '@/transformers/tag/serializers';
import type { TagUpdate } from '@/types/entities/tag';
import { TagCategory } from '@/types/entities/tag/enums';
import type { Tag as UITag } from '@/types/entities/tag/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Esquema de validación
const createTagSchema = z.object({
	name: z
		.string()
		.min(2, {
			message: 'El nombre debe tener al menos 2 caracteres',
		})
		.max(50, {
			message: 'El nombre no debe exceder los 50 caracteres',
		}),
	description: z
		.string()
		.max(200, {
			message: 'La descripción no debe exceder los 200 caracteres',
		})
		.optional(),
	color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
		message: 'El color debe ser un código hexadecimal válido',
	}),
	emoji: z.string().min(1, {
		message: 'Debes seleccionar un emoji',
	}),
	category: z.nativeEnum(TagCategory).optional(),
	isFavorite: z.boolean().default(false),
});

type FormValues = z.infer<typeof createTagSchema>;

interface CreateTagFormProps {
	tag?: UITag | null;
	isEditing?: boolean;
	onCreated?: (tag: UITag) => void;
	onUpdated?: (tag: UITag) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
}

export function CreateTagForm({
	tag,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview,
}: CreateTagFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Inicializar formulario con valores por defecto
	const form = useForm<FormValues>({
		resolver: zodResolver(createTagSchema),
		defaultValues: {
			name: '',
			description: '',
			color: generateTagColor(''),
			emoji: '🏷️',
			category: undefined,
			isFavorite: false,
		},
	});

	// Cargar datos de la etiqueta si estamos editando
	useEffect(() => {
		if (isEditing && tag) {
			form.reset({
				name: tag.name,
				description: tag.description || '',
				color: tag.color,
				emoji: tag.emoji || '🏷️',
				category: tag.category as TagCategory | undefined,
				isFavorite: tag.isFavorite || false,
			});
		}
	}, [form, isEditing, tag]);

	// Generar color y emoji basados en el nombre
	const generateSuggestions = useCallback(() => {
		const name = form.getValues('name');
		const category = form.getValues('category');

		if (name.length > 1) {
			const color = generateTagColor(name);
			const emoji = generateTagEmoji(name, category);

			form.setValue('color', color);
			form.setValue('emoji', emoji);
		}
	}, [form]);

	// Manejar envío del formulario
	const onSubmit = async (data: FormValues) => {
		try {
			setIsSubmitting(true);

			// Crear datos comunes
			const tagData = {
				name: data.name,
				description: data.description,
				color: data.color,
				emoji: data.emoji,
				shortcut: undefined,
			};

			// Crear o actualizar etiqueta
			if (isEditing && tag) {
				// Añadir el id para actualizar
				const updateData: TagUpdate = {
					id: tag.id,
					...tagData,
				};

				const updated = await updateTagAction(tag.id, updateData);
				// Convertir el tipo de retorno a UITag para la interfaz
				const uiUpdated = {
					...updated,
					emoji: data.emoji,
					category: data.category,
					isFavorite: data.isFavorite,
				} as unknown as UITag;

				onUpdated?.(uiUpdated);
				onPreview?.(uiUpdated);
			} else {
				const created = await createTagAction(tagData);
				// Convertir el tipo de retorno a UITag para la interfaz
				const uiCreated = {
					...created,
					emoji: data.emoji,
					category: data.category,
					isFavorite: data.isFavorite,
				} as unknown as UITag;

				onCreated?.(uiCreated);
				onPreview?.(uiCreated);
				form.reset();
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} la etiqueta`, {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Actualizar la vista previa cuando cambian los valores del formulario
	useEffect(() => {
		const subscription = form.watch((value) => {
			if (onPreview) {
				onPreview(value);
			}
		});
		return () => subscription.unsubscribe();
	}, [form, onPreview]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre</FormLabel>
							<FormControl>
								<Input
									placeholder="Nombre de la etiqueta"
									{...field}
									onChange={(e) => {
										field.onChange(e);
										// Solo generar sugerencias si no estamos editando o si el usuario no ha modificado manualmente
										if (!isEditing) {
											generateSuggestions();
										}
									}}
								/>
							</FormControl>
							<FormDescription>El nombre de la etiqueta, visible en listados e imágenes.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descripción (Opcional)</FormLabel>
							<FormControl>
								<Textarea placeholder="Describe brevemente esta etiqueta" {...field} value={field.value || ''} />
							</FormControl>
							<FormDescription>Una descripción breve para entender el propósito de esta etiqueta.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						control={form.control}
						name="emoji"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Emoji</FormLabel>
								<FormControl>
									<EmojiPicker value={field.value} onChange={(emoji) => field.onChange(emoji)} />
								</FormControl>
								<FormDescription>Selecciona un emoji representativo.</FormDescription>
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
									<ColorPicker value={field.value} onChange={(color) => field.onChange(color)} />
								</FormControl>
								<FormDescription>Color para identificar visualmente la etiqueta.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="category"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Categoría (Opcional)</FormLabel>
							<Select
								onValueChange={(value) => {
									field.onChange(value || undefined);
									// Generar emoji sugerido basado en categoría
									if (value) {
										const name = form.getValues('name');
										const emoji = generateTagEmoji(name, value);
										form.setValue('emoji', emoji);
									}
								}}
								value={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona una categoría" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.entries(TagCategory).map(([key, value]) => (
										<SelectItem key={key} value={value}>
											{value}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormDescription>Agrupa etiquetas del mismo tipo para una mejor organización.</FormDescription>
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
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked === true);
									}}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Marcar como favorita</FormLabel>
								<FormDescription>
									Las etiquetas favoritas aparecerán destacadas y tendrán prioridad en los listados.
								</FormDescription>
							</div>
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-2">
					{onCancel && (
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancelar
						</Button>
					)}
					<Button type="button" variant="outline" onClick={generateSuggestions}>
						Generar sugerencias
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
