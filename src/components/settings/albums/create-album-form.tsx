'use client';

import { createAlbum, updateAlbum } from '@/app/actions/albums/album.actions';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toastService from '@/services/toast.service';
import type { Album } from '@/types/entities/album';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DynamicCreateForm } from '../common/dynamic-create-form';

// Esquema de validación
const createAlbumSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no debe exceder los 100 caracteres'),
	description: z.string().max(500, 'La descripción no debe exceder los 500 caracteres').optional(),
	emoji: z.string().default('📔'),
	color: z.string().default('#3b82f6'),
	sortBy: z.string().default('name'),
	filters: z.string().default('empty_array'),
	category: z.string().nullable().optional(),
	rarity: z.string().nullable().optional(),
	texture: z.string().nullable().optional(),
});

// Tipo para los datos del formulario
type FormData = z.infer<typeof createAlbumSchema>;

// Props del componente
interface CreateAlbumFormProps {
	album?: Album | null;
	isEditing?: boolean;
	onCreated?: (album: Album) => void;
	onUpdated?: (album: Album) => void;
	onCancel?: () => void;
	onPreview?: (formData: FormData) => void;
}

export function CreateAlbumForm({
	album,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview,
}: CreateAlbumFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Inicializar react-hook-form
	const form = useForm<FormData>({
		resolver: zodResolver(createAlbumSchema),
		defaultValues: {
			name: '',
			description: '',
			emoji: '📔',
			color: '#3b82f6',
			sortBy: 'name',
			filters: 'empty_array',
			category: null,
			rarity: 'common',
			texture: null,
		},
	});

	// Actualizar formulario con datos del álbum cuando se está editando
	useEffect(() => {
		if (album && isEditing) {
			form.reset({
				name: album.name,
				description: album.description || '',
				emoji: (album as any).emoji || '📔',
				color: (album as any).color || '#3b82f6',
				sortBy: (album as any).sortBy || 'name',
				filters: (album as any).filters || 'empty_array',
				category: (album as any).category || null,
				rarity: (album as any).rarity || 'common',
				texture: (album as any).texture || null,
			});
		}
	}, [album, isEditing, form]);

	// Enviar datos para previsualización cuando cambien
	useEffect(() => {
		if (onPreview) {
			const subscription = form.watch((data) => {
				onPreview(data as FormData);
			});
			return () => subscription.unsubscribe();
		}
	}, [form, onPreview]);

	// Manejar envío del formulario
	const onSubmit = useCallback(
		async (data: FormData) => {
			try {
				setIsSubmitting(true);

				if (isEditing && album) {
					// Actualizar álbum existente
					const updatedAlbum = await updateAlbum(album.id, data);
					if (onUpdated) {
						onUpdated(updatedAlbum);
					}
				} else {
					// Crear nuevo álbum
					const newAlbum = await createAlbum(data);
					if (onCreated) {
						onCreated(newAlbum);
					}
					form.reset(); // Limpiar formulario después de crear
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el álbum`, {
					description: errorMessage,
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[isEditing, album, onCreated, onUpdated, form]
	);

	// Campos opcionales para el formulario dinámico
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
					placeholder="Descripción del álbum..."
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
						<SelectItem value="personal" className="text-xs">
							Personal
						</SelectItem>
						<SelectItem value="trabajo" className="text-xs">
							Trabajo
						</SelectItem>
						<SelectItem value="viajes" className="text-xs">
							Viajes
						</SelectItem>
						<SelectItem value="eventos" className="text-xs">
							Eventos
						</SelectItem>
						<SelectItem value="proyectos" className="text-xs">
							Proyectos
						</SelectItem>
						<SelectItem value="otro" className="text-xs">
							Otro
						</SelectItem>
					</SelectContent>
				</Select>
			),
		},
		{
			name: 'rarity',
			label: 'Rareza',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger className="h-8 text-xs w-full">
						<SelectValue placeholder="Seleccionar" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="common" className="text-xs">
							Común
						</SelectItem>
						<SelectItem value="uncommon" className="text-xs">
							Poco común
						</SelectItem>
						<SelectItem value="rare" className="text-xs">
							Raro
						</SelectItem>
						<SelectItem value="epic" className="text-xs">
							Épico
						</SelectItem>
						<SelectItem value="legendary" className="text-xs">
							Legendario
						</SelectItem>
					</SelectContent>
				</Select>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	];

	return (
		<DynamicCreateForm
			optionalFields={optionalFields}
			onSubmit={async (data) => {
				// Aquí puedes adaptar la lógica de creación/edición según sea necesario
				if (isEditing && album) {
					const updatedAlbum = await updateAlbum(album.id, data);
					onUpdated?.(updatedAlbum);
				} else {
					const newAlbum = await createAlbum(data);
					onCreated?.(newAlbum);
				}
			}}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear álbum'}
		/>
	);
}
