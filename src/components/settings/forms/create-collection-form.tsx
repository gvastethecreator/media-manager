import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCollection, useUpdateCollection } from '@/lib/api/collections';
import { DEFAULT_NEUTRAL_COLOR } from '@/lib/styles/color-tokens';
import { toastService } from '@/lib/ui/toast';
import type { CollectionWithStats, CreateCollectionInput, UpdateCollectionInput } from '@/types/entities/collection';
import {
	COLLECTION_CATEGORY_COLORS,
	COLLECTION_CATEGORY_EMOJIS,
	CollectionCategory,
} from '@/types/entities/collection/enums';

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
	category: z.string().optional(),
	platform: z.string().optional(),
	url: z.string().url({ message: 'La URL debe ser válida' }).optional().or(z.literal('')),
	alternativeUrl: z.string().url({ message: 'La URL alternativa debe ser válida' }).optional().or(z.literal('')),
	price: z.number().nonnegative().optional(),
	isFavorite: z.boolean().optional(),
});

type FormValues = z.infer<typeof createCollectionSchema>;

interface CreateCollectionFormProps {
	collection?: CollectionWithStats | null;
	isEditing?: boolean;
	onCancel?: () => void;
	onCreated?: (collection: CollectionWithStats) => void;
	onPreview?: (data: any) => void;
	onUpdated?: (collection: CollectionWithStats) => void;
}

export function CreateCollectionForm({
	collection,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: CreateCollectionFormProps) {
	// React Query mutations
	const createCollectionMutation = useCreateCollection();
	const updateCollectionMutation = useUpdateCollection();

	const [_isSubmitting, setIsSubmitting] = useState(false);

	// Inicializar formulario con valores por defecto
	const form = useForm<FormValues>({
		resolver: zodResolver(createCollectionSchema),
		defaultValues: {
			name: '',
			description: '',
			color: DEFAULT_NEUTRAL_COLOR,
			emoji: '📚',
			category: undefined,
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
				color: collection.color || undefined,
				emoji: collection.emoji || undefined,
				category: collection.category || undefined,
				platform: collection.platform || undefined,
				url: collection.url || '',
				alternativeUrl: collection.alternativeUrl || '',
				price: collection.price || undefined,
				isFavorite: collection.isFavorite,
			});
		}
	}, [form, isEditing, collection]);

	// Generar color y emoji basados en la categoría
	const _generateSuggestions = () => {
		const category = form.getValues('category');
		const name = form.getValues('name');

		if (category && COLLECTION_CATEGORY_COLORS[category as CollectionCategory]) {
			// Usar colores y emojis predefinidos por categoría
			const color = COLLECTION_CATEGORY_COLORS[category as CollectionCategory] || DEFAULT_NEUTRAL_COLOR;
			const emoji = COLLECTION_CATEGORY_EMOJIS[category as CollectionCategory] || '📚';

			form.setValue('color', color);
			form.setValue('emoji', emoji);
		} else if (name.length > 1) {
			// Generar color basado en el nombre (sin operadores bitwise)
			const hslToHex = (h: number, s: number, l: number) => {
				// h: 0-360, s/l: 0-100
				const s1 = s / 100;
				const l1 = l / 100;
				const k = (n: number) => (n + h / 30) % 12;
				const a = s1 * Math.min(l1, 1 - l1);
				const f = (n: number) => l1 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
				const toHex = (v: number) =>
					Math.round(255 * v)
						.toString(16)
						.padStart(2, '0');
				return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
			};

			const stringToColor = (str: string) => {
				// Mapear determinísticamente a un tono usando suma de charCodes
				let sum = 0;
				for (let i = 0; i < str.length; i++) {
					sum += str.charCodeAt(i);
				}
				const hue = sum % 360;
				return hslToHex(hue, 70, 50);
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
	};

	// Manejar envío del formulario
	const _onSubmit = async (data: FormValues) => {
		try {
			setIsSubmitting(true);

			// Validar que name esté presente
			if (!data.name) {
				throw new Error('El nombre es requerido');
			}

			// Crear o actualizar colección
			if (isEditing && collection) {
				const updateData: UpdateCollectionInput = {
					name: data.name,
					color: data.color || undefined,
					emoji: data.emoji || undefined,
					description: data.description || undefined,
					isFavorite: data.isFavorite,
				};
				const updated = await updateCollectionMutation.mutateAsync({
					id: collection.id,
					data: updateData,
				});
				onUpdated?.(updated);
			} else {
				// Asegurar que name esté presente para el tipo CollectionCreateInput
				if (!data.name) {
					throw new Error('El nombre es requerido');
				}

				const created = await createCollectionMutation.mutateAsync({
					name: data.name, // Ya validado que no es undefined
					color: data.color || undefined,
					emoji: data.emoji || undefined,
					description: data.description || undefined,

					isFavorite: data.isFavorite,
				} as CreateCollectionInput);
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
	const _formatPrice = (value: string) => {
		return value !== '' ? Number.parseFloat(value) : undefined;
	};

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={form.handleSubmit(_onSubmit)}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre</FormLabel>
							<FormControl>
								<Input placeholder="Nombre de la colección" {...field} />
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
								<EmojiPicker compact onEmojiSelect={field.onChange} showLabel={false} value={field.value} />
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
								<ColorPicker compact onChange={field.onChange} showLabel={false} value={field.value} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descripción</FormLabel>
							<FormControl>
								<Textarea placeholder="Descripción de la colección..." rows={3} {...field} />
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
							<Select defaultValue={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar categoría" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(CollectionCategory).map((category) => (
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
					name="platform"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Plataforma</FormLabel>
							<Select defaultValue={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar plataforma" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="web">Web</SelectItem>
									<SelectItem value="nft">NFT</SelectItem>
									<SelectItem value="physical">Físico</SelectItem>
									<SelectItem value="digital">Digital</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="url"
					render={({ field }) => (
						<FormItem>
							<FormLabel>URL</FormLabel>
							<FormControl>
								<Input placeholder="https://..." {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="price"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Precio</FormLabel>
							<FormControl>
								<Input
									min={0}
									step={0.01}
									type="number"
									{...field}
									onChange={(e) => field.onChange(Number(e.target.value))}
								/>
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
					<Button onClick={onCancel} type="button" variant="outline">
						Cancelar
					</Button>
					<Button type="submit">{isEditing ? 'Guardar cambios' : 'Crear colección'}</Button>
				</div>
			</form>
		</Form>
	);
}
