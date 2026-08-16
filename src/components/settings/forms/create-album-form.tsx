import { Loader2, Save, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type AlbumCreateInput, type AlbumUpdateInput, useCreateAlbum, useUpdateAlbum } from '@/lib/api/albums';
import { DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';
import { toastService } from '@/lib/ui/toast';
import type { AlbumWithStats } from '@/types/entities/album';

// Props del componente
interface CreateAlbumFormProps {
	album?: AlbumWithStats | null;
	isEditing?: boolean;
	onCancel?: () => void;
	onCreated?: (album: AlbumWithStats) => void;
	onPreview?: (formData: FormData) => void;
	onReset?: () => void;
	onSubmit?: (newAlbum: AlbumWithStats) => void;
	onUpdated?: (album: AlbumWithStats) => void;
}

// Interfaz para los datos del formulario
interface FormData {
	category: string;
	color: string;
	description: string;
	emoji: string;
	name: string;
}

export function CreateAlbumForm({
	album,
	isEditing = false,
	onCreated,
	onUpdated,
	onReset,
	onPreview,
}: CreateAlbumFormProps) {
	// React Query mutations
	const createAlbumMutation = useCreateAlbum();
	const updateAlbumMutation = useUpdateAlbum();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Partial<FormData>>({});

	// Estado del formulario
	const [formData, setFormData] = useState<FormData>({
		name: '',
		description: '',
		emoji: '📔',
		color: DEFAULT_ENTITY_COLOR,
		category: '',
	});

	// Actualizar formulario con datos del álbum cuando se está editando
	useEffect(() => {
		if (album && isEditing) {
			setFormData({
				name: album.name,
				description: album.description || '',
				emoji: album.emoji || '📔',
				color: album.color || DEFAULT_ENTITY_COLOR,
				category: album.category || '',
			});
		} else if (!isEditing) {
			setFormData({
				name: '',
				description: '',
				emoji: '📔',
				color: DEFAULT_ENTITY_COLOR,
				category: '',
			});
		}
	}, [album, isEditing]);

	// Enviar datos para previsualización cuando cambien
	useEffect(() => {
		if (onPreview) {
			onPreview(formData);
		}
	}, [formData, onPreview]);

	// Manejar cambios en el formulario
	const handleChange = useCallback(
		(field: keyof FormData, value: string) => {
			setFormData((prev) => ({ ...prev, [field]: value }));
			// Limpiar error cuando el usuario empiece a escribir
			if (errors[field]) {
				setErrors((prev) => ({ ...prev, [field]: undefined }));
			}
		},
		[errors]
	);

	// Validar formulario
	const validateForm = useCallback((): boolean => {
		const newErrors: Partial<FormData> = {};

		if (!formData.name.trim()) {
			newErrors.name = 'Name is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [formData]);

	// Manejar envío del formulario
	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!validateForm()) {
				return;
			}

			try {
				setIsSubmitting(true);

				// Preparar datos para el backend
				const albumData = {
					name: formData.name,
					description: formData.description || undefined,
					color: formData.color,
				};

				if (isEditing && album) {
					// Actualizar álbum existente
					const updatedAlbum = await updateAlbumMutation.mutateAsync({
						id: album.id,
						data: albumData as AlbumUpdateInput,
					});
					if (onUpdated) {
						onUpdated(updatedAlbum);
					}
					toastService.success('Album updated');
				} else {
					// Crear nuevo álbum
					const newAlbum = await createAlbumMutation.mutateAsync(albumData as AlbumCreateInput);
					if (onCreated) {
						onCreated(newAlbum);
					}
					// Limpiar formulario después de crear
					setFormData({
						name: '',
						description: '',
						emoji: '📔',
						color: DEFAULT_ENTITY_COLOR,
						category: '',
					});
					toastService.success('Album created');
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				toastService.error(`Could not ${isEditing ? 'update' : 'create'} the album`, {
					description: errorMessage,
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[formData, validateForm, isEditing, album, onCreated, onUpdated, createAlbumMutation, updateAlbumMutation]
	);

	// Manejar cancelación
	const handleCancel = useCallback(() => {
		setFormData({
			name: '',
			description: '',
			emoji: '📔',
			color: DEFAULT_ENTITY_COLOR,
			category: '',
		});
		setErrors({});
		if (onReset) {
			onReset();
		}
	}, [onReset]);

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			{/* Nombre */}
			<div>
				<Label className="font-medium text-foreground text-sm" htmlFor="name">
					Name *
				</Label>
				<Input
					className={errors.name ? 'border-destructive' : ''}
					id="name"
					onChange={(e) => handleChange('name', e.target.value)}
					placeholder="Album name..."
					type="text"
					value={formData.name}
				/>
				{errors.name && <p className="mt-1 text-destructive text-xs">{errors.name}</p>}
			</div>

			{/* Descripción */}
			<div>
				<Label className="font-medium text-foreground text-sm" htmlFor="description">
					Description
				</Label>
				<Textarea
					id="description"
					onChange={(e) => handleChange('description', e.target.value)}
					placeholder="Optional description..."
					rows={3}
					value={formData.description}
				/>
			</div>

			{/* Emoji */}
			<div>
				<Label className="font-medium text-foreground text-sm" htmlFor="emoji">
					Emoji
				</Label>
				<div className="flex items-center gap-2">
					<span className="text-2xl">{formData.emoji}</span>
					<Input
						className="w-20"
						id="emoji"
						onChange={(e) => handleChange('emoji', e.target.value)}
						placeholder="📔"
						type="text"
						value={formData.emoji}
					/>
				</div>
			</div>

			{/* Color */}
			<div>
				<Label className="font-medium text-foreground text-sm" htmlFor="color">
					Color
				</Label>
				<div className="flex items-center gap-2">
					<div className="h-8 w-8 rounded border border-border" style={{ backgroundColor: formData.color }} />
					<Input
						className="w-20"
						id="color"
						onChange={(e) => handleChange('color', e.target.value)}
						type="color"
						value={formData.color}
					/>
				</div>
			</div>

			{/* Categoría */}
			<div>
				<Label className="font-medium text-foreground text-sm" htmlFor="category">
					Category
				</Label>
				<Select onValueChange={(value) => handleChange('category', value)} value={formData.category}>
					<SelectTrigger>
						<SelectValue placeholder="Select a category..." />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="personal">Personal</SelectItem>
						<SelectItem value="trabajo">Work</SelectItem>
						<SelectItem value="hobbies">Hobbies</SelectItem>
						<SelectItem value="viajes">Travel</SelectItem>
						<SelectItem value="familia">Family</SelectItem>
						<SelectItem value="arte">Art</SelectItem>
						<SelectItem value="naturaleza">Nature</SelectItem>
						<SelectItem value="arquitectura">Architecture</SelectItem>
						<SelectItem value="eventos">Events</SelectItem>
						<SelectItem value="collections">Collections</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Botones */}
			<div className="flex justify-end gap-2 pt-4">
				<Button disabled={isSubmitting} onClick={handleCancel} type="button" variant="outline">
					<X className="mr-2 h-4 w-4" />
					Cancel
				</Button>
				<Button disabled={isSubmitting} type="submit">
					{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
					{isEditing ? 'Update' : 'Create'} album
				</Button>
			</div>
		</form>
	);
}
