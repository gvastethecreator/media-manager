'use client';

import { createTagAction, updateTagAction } from '@/app/actions/tags';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toastService from '@/services/toast.service';
import { generateTagColor, generateTagEmoji } from '@/transformers/tag/serializers';
import type { TagUpdateInput } from '@/types/entities/tag';
import { TagCategory } from '@/types/entities/tag';
import type { TagBase as UITag } from '@/types/entities/tag/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DynamicCreateForm } from '../common/dynamic-create-form';

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
				const updateData: TagUpdateInput = {
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

	const optionalFields = [
		{
			name: 'emoji',
			label: 'Emoji',
			render: ({ value, onChange }: any) => <EmojiPicker value={value} onChange={onChange} />,
		},
		{
			name: 'color',
			label: 'Color',
			render: ({ value, onChange }: any) => <ColorPicker value={value} onChange={onChange} />,
		},
		{
			name: 'description',
			label: 'Descripción',
			render: ({ value, onChange }: any) => (
				<textarea
					placeholder="Descripción de la etiqueta..."
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
					<SelectTrigger>
						<SelectValue placeholder="Selecciona una categoría" />
					</SelectTrigger>
					<SelectContent>
						{/* Aquí deberías mapear las categorías reales de TagCategory */}
						<SelectItem value="general">General</SelectItem>
						<SelectItem value="temporal">Temporal</SelectItem>
						<SelectItem value="importante">Importante</SelectItem>
					</SelectContent>
				</Select>
			),
		},
	];

	return (
		<DynamicCreateForm
			optionalFields={optionalFields}
			onSubmit={async (data) => {
				if (isEditing && tag) {
					await updateTagAction(tag.id, data);
					onUpdated?.({ ...tag, ...data });
				} else {
					const created = await createTagAction(data);
					onCreated?.(created);
				}
			}}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear etiqueta'}
		/>
	);
}
