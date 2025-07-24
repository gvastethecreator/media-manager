// 🛠️ Refactor: DynamicCreateForm para WorldItem
// Ahora solo el campo "name" es obligatorio, el resto se agrega dinámicamente.
// Validación y tipos corregidos para compatibilidad con el patrón reusable.

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateWorldItem, useUpdateWorldItem } from '@/lib/api/world-items';
import { toastService } from '@/lib/ui/toast';
import { WorldItemCategory, WorldItemRarity, WorldItemType } from '@/types/entities/world-item/enums';
import type { WorldItemComplete, WorldItemCreateInput } from '@/types/entities/world-item/types';
import { DynamicCreateForm } from '../common/dynamic-create-form';

// Esquema de validación con Zod (solo name requerido, el resto opcional)
const worldItemSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
	description: z.string().optional(),
	color: z.string().optional(),
	emoji: z.string().optional(),
	type: z.string().optional(),
	category: z.string().optional(),
	rarity: z.string().optional(),
	origin: z.string().optional(),
	isFavorite: z.boolean().optional(),
});

type WorldItemForm = z.infer<typeof worldItemSchema>;

interface CreateWorldItemFormProps {
	worldItem?: WorldItemComplete | null;
	isEditing?: boolean;
	onCreated?: (item: WorldItemComplete) => void;
	onUpdated?: (item: WorldItemComplete) => void;
	onCancel?: () => void;
	onPreview?: (item: WorldItemComplete) => void;
}

export function CreateWorldItemForm({
	worldItem,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview,
}: CreateWorldItemFormProps) {
	// React Query mutations
	const createWorldItemMutation = useCreateWorldItem();
	const updateWorldItemMutation = useUpdateWorldItem();

	const [_isSubmitting, setIsSubmitting] = useState(false);

	// Configurar react-hook-form
	const form = useForm<WorldItemForm>({
		resolver: zodResolver(worldItemSchema),
		defaultValues: {
			name: '',
			description: '',
			color: '#6b7280',
			emoji: '📦',
			type: 'none',
			category: 'none',
			rarity: 'none',
			origin: '',
			isFavorite: false,
		},
	});

	// Enviar datos para vista previa en tiempo real
	useEffect(() => {
		if (onPreview) {
			const subscription = form.watch((data) => {
				onPreview(data as WorldItemComplete);
			});
			return () => subscription.unsubscribe();
		}
	}, [form, onPreview]);

	// Cargar datos iniciales si estamos editando
	useEffect(() => {
		if (worldItem && isEditing) {
			form.reset({
				name: worldItem.name,
				description: worldItem.description || '',
				color: worldItem.color || '#6b7280',
				emoji: worldItem.emoji || '📦',
				type: worldItem.type || 'none',
				category: worldItem.category || 'none',
				rarity: worldItem.rarity || 'none',
				origin: worldItem.origin || '',
				isFavorite: worldItem.isFavorite || false,
			});
		}
	}, [worldItem, isEditing, form]);

	// Manejar envío del formulario
	const _onSubmit = async (data: WorldItemForm) => {
		try {
			setIsSubmitting(true);

			if (isEditing && worldItem) {
				// Actualizar objeto existente
				const updatedItem = await updateWorldItemMutation.mutateAsync({ id: worldItem.id, data });
				if (onUpdated) {
					onUpdated(updatedItem);
				}
			} else {
				// Crear nuevo objeto
				const newItem = await createWorldItemMutation.mutateAsync(data);
				if (onCreated) {
					onCreated(newItem);
				}
				form.reset(); // Limpiar formulario después de crear
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(isEditing ? 'Error al actualizar el objeto' : 'Error al crear el objeto', {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Cancelar edición
	const _handleCancel = () => {
		form.reset();
		if (onCancel) {
			onCancel();
		}
	};

	// Campos opcionales para el formulario dinámico
	const optionalFields = [
		{
			name: 'emoji',
			label: 'Emoji',
			render: ({ value, onChange }: any) => <EmojiPicker value={value} onEmojiSelect={onChange} />,
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
					placeholder="Descripción del objeto..."
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					rows={3}
					className="text-xs resize-none w-full border rounded p-2"
				/>
			),
		},
		{
			name: 'type',
			label: 'Tipo',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Ninguno</SelectItem>
						{Object.values(WorldItemType).map((type) => (
							<SelectItem key={type} value={String(type)}>
								{String(type)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			),
		},
		{
			name: 'category',
			label: 'Categoría',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar categoría" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Ninguna</SelectItem>
						{Object.values(WorldItemCategory).map((cat) => (
							<SelectItem key={cat} value={String(cat)}>
								{String(cat)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			),
		},
		{
			name: 'rarity',
			label: 'Rareza',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar rareza" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Ninguna</SelectItem>
						{Object.values(WorldItemRarity).map((rarity) => (
							<SelectItem key={rarity} value={String(rarity)}>
								{String(rarity)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			),
		},
		{
			name: 'origin',
			label: 'Origen',
			render: ({ value, onChange }: any) => (
				<input
					type="text"
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					className="w-full border rounded p-2 text-xs"
					placeholder="Origen del objeto"
				/>
			),
		},
		{
			name: 'isFavorite',
			label: 'Favorito',
			render: ({ value, onChange }: any) => <Switch checked={!!value} onCheckedChange={onChange} />,
		},
	];

	return (
		<DynamicCreateForm<WorldItemCreateInput>
			optionalFields={optionalFields as any}
			onSubmit={async (data) => {
				try {
					if (isEditing && worldItem) {
						const updated = await updateWorldItemMutation.mutateAsync({ id: worldItem.id, data });
						onUpdated?.(updated);
					} else {
						const created = await createWorldItemMutation.mutateAsync(data);
						onCreated?.(created);
					}
				} catch (error) {
					console.error('Error al procesar el world item:', error);
				}
			}}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear objeto'}
		/>
	);
}

/**
 * 📝 Documentación: Formulario de creación dinámica para WorldItem
 * - Solo el campo "name" es obligatorio inicialmente.
 * - Los campos opcionales se agregan uno a uno desde un selector.
 * - Compatible con el patrón DynamicCreateForm reusable.
 * - Validación con Zod y tipos canónicos.
 * - Ejemplo de uso y props en el README de common/dynamic-create-form.
 */
