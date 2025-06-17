'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bookmark, ClipboardList, Gem, Loader2, PaintBucket, Pencil, Save, TextCursor } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createAlbum, updateAlbum } from '@/app/actions/albums/album.actions';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toastService from '@/services/toast.service';
import type { Album } from '@/types/entities/album';

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

	// Botón de guardar/crear que aparecerá en la parte superior
	const _saveButton = (
		<Button type="submit" className="h-8 text-xs" disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
			{isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
			<Save className="h-3 w-3 mr-1" />
			{isEditing ? 'Guardar cambios' : 'Crear álbum'}
		</Button>
	);

	return (
		<Form {...form}>
			<form id="album-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
				<div className="grid grid-cols-2 gap-3">
					{/* Nombre */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel className="text-xs flex items-center gap-1">
									<TextCursor className="h-3 w-3" />
									Nombre
								</FormLabel>
								<FormControl>
									<Input placeholder="Mi álbum" {...field} className="h-8 text-xs" />
								</FormControl>
								<FormMessage className="text-[10px]" />
							</FormItem>
						)}
					/>

					{/* Emoji */}
					<FormField
						control={form.control}
						name="emoji"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs flex items-center gap-1">
									<Bookmark className="h-3 w-3" />
									Emoji
								</FormLabel>
								<FormControl>
									<EmojiPicker value={field.value} onEmojiSelect={field.onChange} compact showLabel={false} />
								</FormControl>
								<FormMessage className="text-[10px]" />
							</FormItem>
						)}
					/>

					{/* Color */}
					<FormField
						control={form.control}
						name="color"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs flex items-center gap-1">
									<PaintBucket className="h-3 w-3" />
									Color
								</FormLabel>
								<FormControl>
									<ColorPicker value={field.value} onChange={field.onChange} compact showLabel={false} />
								</FormControl>
								<FormMessage className="text-[10px]" />
							</FormItem>
						)}
					/>
				</div>

				{/* Descripción */}
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-xs flex items-center gap-1">
								<Pencil className="h-3 w-3" />
								Descripción
							</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Descripción del álbum..."
									{...field}
									value={field.value || ''}
									rows={3}
									className="text-xs resize-none"
								/>
							</FormControl>
							<FormMessage className="text-[10px]" />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-3">
					{/* Categoría */}
					<FormField
						control={form.control}
						name="category"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs flex items-center gap-1">
									<ClipboardList className="h-3 w-3" />
									Categoría
								</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
									<FormControl>
										<SelectTrigger className="h-8 text-xs">
											<SelectValue placeholder="Seleccionar" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectGroup>
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
										</SelectGroup>
									</SelectContent>
								</Select>
								<FormMessage className="text-[10px]" />
							</FormItem>
						)}
					/>

					{/* Rareza */}
					<FormField
						control={form.control}
						name="rarity"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs flex items-center gap-1">
									<Gem className="h-3 w-3" />
									Rareza
								</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
									<FormControl>
										<SelectTrigger className="h-8 text-xs">
											<SelectValue placeholder="Seleccionar" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectGroup>
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
										</SelectGroup>
									</SelectContent>
								</Select>
								<FormMessage className="text-[10px]" />
							</FormItem>
						)}
					/>
				</div>
			</form>
		</Form>
	);
}
