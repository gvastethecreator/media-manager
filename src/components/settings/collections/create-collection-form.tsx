'use client';

import { createCollection, updateCollection } from '@/app/actions/collections/collection.actions';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toastService from '@/services/toast';
import type { CollectionCreateInput, CollectionUpdateInput, CollectionWithStats } from '@/types/entities/collection';
import {
	COLLECTION_CATEGORY_COLORS,
	COLLECTION_CATEGORY_EMOJIS,
	CollectionCategory
} from '@/types/entities/collection/enums';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DynamicCreateForm } from '../common/dynamic-create-form';

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
	isFavorite: z.boolean().default(false),
});

type FormValues = z.infer<typeof createCollectionSchema>;

interface CreateCollectionFormProps {
	collection?: CollectionWithStats | null;
	isEditing?: boolean;
	onCreated?: (collection: CollectionWithStats) => void;
	onUpdated?: (collection: CollectionWithStats) => void;
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
	const [_isSubmitting, setIsSubmitting] = useState(false);

	// Inicializar formulario con valores por defecto
	const form = useForm<FormValues>({
		resolver: zodResolver(createCollectionSchema),
		defaultValues: {
			name: '',
			description: '',
			color: '#6b7280',
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
				color: collection.color,
				emoji: collection.emoji,
				category: collection.category || undefined,
				platform: collection.platform || undefined,
				url: collection.url || '',
				alternativeUrl: collection.alternativeUrl || '',
				price: collection.price || undefined,
				isFavorite: collection.isFavorite || false,
			});
		}
	}, [form, isEditing, collection]);

	// Generar color y emoji basados en la categoría
	const _generateSuggestions = () => {
		const category = form.getValues('category');
		const name = form.getValues('name');

		if (category && COLLECTION_CATEGORY_COLORS[category as CollectionCategory]) {
			// Usar colores y emojis predefinidos por categoría
			const color = COLLECTION_CATEGORY_COLORS[category as CollectionCategory] || '#6b7280';
			const emoji = COLLECTION_CATEGORY_EMOJIS[category as CollectionCategory] || '📚';

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
	};

	// Manejar envío del formulario
	const _onSubmit = async (data: FormValues) => {
		try {
			setIsSubmitting(true);

			const collectionData: CollectionCreateInput = {
				name: data.name,
				description: data.description,
				color: data.color,
				emoji: data.emoji,
				category: data.category,
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
				} as CollectionUpdateInput);
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
	const _formatPrice = (value: string) => {
		return value !== '' ? Number.parseFloat(value) : undefined;
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
					placeholder="Descripción de la colección..."
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					rows={3}
					className="text-xs resize-none w-full border rounded p-2"
				/>
			),
		},
		{
			name: 'category',
			label: 'Categoría',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger className="h-8 text-xs w-full">
						<SelectValue placeholder="Seleccionar" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="arte">Arte</SelectItem>
						<SelectItem value="foto">Foto</SelectItem>
						<SelectItem value="libros">Libros</SelectItem>
						<SelectItem value="otro">Otro</SelectItem>
					</SelectContent>
				</Select>
			),
		},
		{
			name: 'platform',
			label: 'Plataforma',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger className="h-8 text-xs w-full">
						<SelectValue placeholder="Seleccionar" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="web">Web</SelectItem>
						<SelectItem value="nft">NFT</SelectItem>
						<SelectItem value="physical">Físico</SelectItem>
						<SelectItem value="digital">Digital</SelectItem>
					</SelectContent>
				</Select>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	];

	return (
		<DynamicCreateForm
			optionalFields={optionalFields}
			onSubmit={_onSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear colección'}
		/>
	);
}
