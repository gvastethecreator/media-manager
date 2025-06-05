'use client';

import { createCollection, updateCollection } from '@/app/actions/collections/collection.actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toastService from '@/services/toast.service';
import type { CollectionBase as Collection, CreateCollectionData } from '@/types/entities/collection/base';
import {
	COLLECTION_CATEGORY_COLORS,
	COLLECTION_CATEGORY_EMOJIS,
	CollectionCategory,
	CollectionPlatform,
	CollectionRarity,
} from '@/types/entities/collection/enums';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Esquema de validación
const createCollectionSchema = z.object({
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
	category: z.nativeEnum(CollectionCategory).optional(),
	rarity: z.nativeEnum(CollectionRarity).optional(),
	platform: z.nativeEnum(CollectionPlatform).optional(),
	url: z.string().url({ message: 'La URL debe ser válida' }).optional().or(z.literal('')),
	alternativeUrl: z.string().url({ message: 'La URL alternativa debe ser válida' }).optional().or(z.literal('')),
	price: z.number().nonnegative().optional(),
	isFavorite: z.boolean().default(false),
});

type FormValues = z.infer<typeof createCollectionSchema>;

interface CreateCollectionFormProps {
	collection?: Collection | null;
	isEditing?: boolean;
	onCreated?: (collection: Collection) => void;
	onUpdated?: (collection: Collection) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
}

export function CreateCollectionForm({
	collection,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: CreateCollectionFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Inicializar formulario con valores por defecto
	const form = useForm<FormValues>({
		resolver: zodResolver(createCollectionSchema),
		defaultValues: {
			name: '',
			description: '',
			color: '#6b7280',
			emoji: '📚',
			category: undefined,
			rarity: undefined,
			platform: undefined,
			url: '',
			alternativeUrl: '',
			price: undefined,
			isFavorite: false,
		},
	});

	// Cargar datos de la colección si estamos editando
	useEffect(() => {
		if (isEditing && collection) {
			form.reset({
				name: collection.name,
				description: collection.description || '',
				color: collection.color,
				emoji: collection.emoji,
				category: collection.category as CollectionCategory | undefined,
				rarity: collection.rarity as CollectionRarity | undefined,
				platform: collection.platform as CollectionPlatform | undefined,
				url: collection.url || '',
				alternativeUrl: collection.alternativeUrl || '',
				price: collection.price || undefined,
				isFavorite: collection.isFavorite || false,
			});
		}
	}, [form, isEditing, collection]);

	// Generar color y emoji basados en la categoría
	const generateSuggestions = useCallback(() => {
		const category = form.getValues('category');
		const name = form.getValues('name');

		if (category && Object.values(CollectionCategory).includes(category)) {
			// Usar colores y emojis predefinidos por categoría
			const color = COLLECTION_CATEGORY_COLORS[category] || '#6b7280';
			const emoji = COLLECTION_CATEGORY_EMOJIS[category] || '📚';

			form.setValue('color', color);
			form.setValue('emoji', emoji);
		} else if (name.length > 1) {
			// Generar color basado en el nombre
			const stringToColor = (str: string) => {
				let hash = 0;
				for (let i = 0; i < str.length; i++) {
					hash = str.charCodeAt(i) + ((hash << 5) - hash);
				}
				let color = '#';
				for (let i = 0; i < 3; i++) {
					const value = (hash >> (i * 8)) & 0xff;
					color += `00${value.toString(16)}`.substr(-2);
				}
				return color;
			};

			form.setValue('color', stringToColor(name));

			// Intentar asignar un emoji relevante basado en palabras clave
			const keywords: Record<string, string> = {
				arte: '🎨',
				art: '🎨',
				foto: '📷',
				photo: '📷',
				digital: '💻',
				web: '🌐',
				game: '🎮',
				juego: '🎮',
				música: '🎵',
				music: '🎵',
				movie: '🎬',
				película: '🎬',
				cine: '🎬',
				libro: '📚',
				book: '📚',
				anime: '🌟',
				manga: '📖',
				comic: '💬',
				historieta: '💬',
			};

			const lowerName = name.toLowerCase();
			let chosenEmoji = '📚';

			for (const [keyword, emoji] of Object.entries(keywords)) {
				if (lowerName.includes(keyword)) {
					chosenEmoji = emoji;
				}
			}

			form.setValue('emoji', chosenEmoji);
		}
	}, [form]);

	// Manejar envío del formulario
	const onSubmit = async (data: FormValues) => {
		try {
			setIsSubmitting(true);

			const collectionData: CreateCollectionData = {
				name: data.name,
				description: data.description,
				color: data.color,
				emoji: data.emoji,
				category: data.category,
				rarity: data.rarity,
				platform: data.platform,
				url: data.url || undefined,
				alternativeUrl: data.alternativeUrl || undefined,
				price: data.price,
			};

			// Crear o actualizar colección
			if (isEditing && collection) {
				const updated = await updateCollection(collection.id, {
					...collectionData,
					isFavorite: data.isFavorite,
				});
				onUpdated?.(updated);
			} else {
				const created = await createCollection(collectionData);
				onCreated?.(created);
				form.reset();
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} la colección`, {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Formatear valor para precio
	const formatPrice = (value: string) => {
		return value !== '' ? Number.parseFloat(value) : undefined;
	};

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
									placeholder="Nombre de la colección"
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
							<FormDescription>El nombre de la colección, visible en listados e imágenes.</FormDescription>
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
								<Textarea placeholder="Describe brevemente esta colección" {...field} value={field.value || ''} />
							</FormControl>
							<FormDescription>Una descripción breve para entender el propósito de esta colección.</FormDescription>
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
									<EmojiPicker value={field.value} onEmojiSelect={(emoji) => field.onChange(emoji)} />
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
								<FormDescription>Color para identificar visualmente la colección.</FormDescription>
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
									// Generar sugerencias basadas en categoría
									if (value) {
										generateSuggestions();
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
									{Object.entries(CollectionCategory).map(([key, value]) => (
										<SelectItem key={key} value={value}>
											{value}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormDescription>Agrupa colecciones del mismo tipo para una mejor organización.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						control={form.control}
						name="rarity"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Rareza (Opcional)</FormLabel>
								<Select onValueChange={(value) => field.onChange(value || undefined)} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona rareza" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.entries(CollectionRarity).map(([key, value]) => (
											<SelectItem key={key} value={value}>
												{value}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>Indica qué tan exclusiva es esta colección.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="platform"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Plataforma (Opcional)</FormLabel>
								<Select onValueChange={(value) => field.onChange(value || undefined)} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona plataforma" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.entries(CollectionPlatform).map(([key, value]) => (
											<SelectItem key={key} value={value}>
												{value}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>Indica de qué plataforma proviene la colección.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						control={form.control}
						name="url"
						render={({ field }) => (
							<FormItem>
								<FormLabel>URL (Opcional)</FormLabel>
								<FormControl>
									<Input placeholder="https://ejemplo.com/coleccion" {...field} />
								</FormControl>
								<FormDescription>Enlace principal a la colección.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="price"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Precio (Opcional)</FormLabel>
								<FormControl>
									<Input
										type="number"
										placeholder="0.00"
										{...field}
										onChange={(e) => field.onChange(formatPrice(e.target.value))}
										value={field.value || ''}
									/>
								</FormControl>
								<FormDescription>Valor estimado o costo de la colección.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

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
									Las colecciones favoritas aparecerán destacadas y tendrán prioridad en los listados.
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
