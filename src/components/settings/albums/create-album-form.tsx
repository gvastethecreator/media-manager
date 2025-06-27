'use client';

import { createAlbum, updateAlbum } from '@/app/actions/albums/album.actions';
import { EmojiPicker } from '@/components/core/emojis/emoji-picker';
import { DynamicCreateForm } from '@/components/settings/common/dynamic-create-form';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toastService from '@/services/toast';
import type { AlbumWithStats } from '@/types/entities/album';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema de validación para el formulario
const createAlbumSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	emoji: z.string().optional(),
	color: z.string().optional(),
	sortBy: z.string().optional(),
	filters: z.string().optional(),
	category: z.string().optional(),
	rarity: z.string().optional(),
	texture: z.string().optional(),
});

type FormData = z.infer<typeof createAlbumSchema>;

// Props del componente
interface CreateAlbumFormProps {
	album?: AlbumWithStats | null;
	isEditing?: boolean;
	onCreated?: (album: AlbumWithStats) => void;
	onUpdated?: (album: AlbumWithStats) => void;
	onReset?: () => void;
	onPreview?: (formData: FormData) => void;
}

export function CreateAlbumForm({
	album,
	isEditing = false,
	onCreated,
	onUpdated,
	onReset,
	onPreview,
}: CreateAlbumFormProps) {
	const [_isSubmitting, setIsSubmitting] = useState(false);

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
			category: '',
			rarity: 'common',
			texture: '',
		},
	});

	// Actualizar formulario con datos del álbum cuando se está editando
	useEffect(() => {
		if (album && isEditing) {
			form.reset({
				name: album.name,
				description: album.description || '',
				emoji: album.emoji || '📔',
				color: album.color || '#3b82f6',
				sortBy: album.sortBy || 'name',
				filters: typeof album.filters === 'string' ? album.filters : 'empty_array',
				category: album.category || '',
				rarity: 'common', // No existe en el schema, usar valor por defecto
				texture: '', // No existe en el schema, usar valor por defecto
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
	const _onSubmit = useCallback(
		async (data: FormData) => {
			try {
				setIsSubmitting(true);

				// Convertir category vacío a undefined para evitar errores de tipo
				const processedData = {
					...data,
					category: data.category || undefined,
					rarity: data.rarity || undefined,
					texture: data.texture || undefined,
				};

				if (isEditing && album) {
					// Actualizar álbum existente
					const updatedAlbum = await updateAlbum(album.id, processedData);
					if (onUpdated) {
						onUpdated(updatedAlbum);
					}
				} else {
					// Crear nuevo álbum
					const newAlbum = await createAlbum(processedData);
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
			name: 'name' as const,
			label: 'Nombre',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<input
					type="text"
					placeholder="Nombre del álbum..."
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					className="text-xs w-full border rounded p-2"
				/>
			),
		},
		{
			name: 'emoji' as const,
			label: 'Emoji',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<EmojiPicker value={value} onEmojiSelect={onChange} compact showLabel={false} />
			),
		},
		{
			name: 'color' as const,
			label: 'Color',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<ColorPicker value={value} onChange={onChange} compact showLabel={false} />
			),
		},
		{
			name: 'description' as const,
			label: 'Descripción',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
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
			name: 'category' as const,
			label: 'Categoría',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
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
	];

	return (
		<DynamicCreateForm
			optionalFields={optionalFields}
			onSubmit={async (data) => {
				// Procesar datos y llamar a las acciones correspondientes
				const processedData = {
					...data,
					category: data.category || undefined,
				};

				if (isEditing && album) {
					const updatedAlbum = await updateAlbum(album.id, processedData);
					onUpdated?.(updatedAlbum);
				} else {
					const newAlbum = await createAlbum(processedData);
					onCreated?.(newAlbum);
				}
			}}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear álbum'}
		/>
	);
}
