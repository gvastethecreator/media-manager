import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTag, useUpdateTag } from '@/lib/api/tags';
import toastService from '@/lib/ui/toast';
import { generateTagColor } from '@/lib/utils/string.utils';
import { TagCategory } from '@/store/entities/tag/types';
import type { TagComplete } from '@/types/entities/tag';
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
	tag?: TagComplete | null;
	isEditing?: boolean;
	onCreated?: (tag: TagComplete) => void;
	onUpdated?: (tag: TagComplete) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
}

export function CreateTagForm({
	tag,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel: _onCancel,
	onPreview,
}: CreateTagFormProps) {
	// React Query hooks
	const createTagMutation = useCreateTag();
	const updateTagMutation = useUpdateTag();

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

	// Manejar envío del formulario
	const onSubmit = async (data: FormValues) => {
		try {
			// Crear datos comunes
			const tagData = {
				name: data.name,
				description: data.description,
				color: data.color,
				emoji: data.emoji,
				category: data.category,
				isFavorite: data.isFavorite,
			};

			// Crear o actualizar etiqueta
			if (isEditing && tag) {
				const updated = await updateTagMutation.mutateAsync({ id: tag.id, data: tagData });
				onUpdated?.(updated as TagComplete);
				onPreview?.(updated);
				toastService.success('Etiqueta actualizada correctamente');
			} else {
				const created = await createTagMutation.mutateAsync(tagData);
				onCreated?.(created as TagComplete);
				onPreview?.(created);
				form.reset();
				toastService.success('Etiqueta creada correctamente');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} la etiqueta`, {
				description: errorMessage,
			});
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
			onSubmit={onSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear etiqueta'}
		/>
	);
}
