import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type AlbumCreateInput, type AlbumUpdateInput, useCreateAlbum, useUpdateAlbum } from '@/lib/api/albums';
import toastService from '@/services/toast';
import type { AlbumWithStats } from '@/types/entities/album';
import { Loader2, Save, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

// Props del componente
interface CreateAlbumFormProps {
	album?: AlbumWithStats | null;
	isEditing?: boolean;
	onCreated?: (album: AlbumWithStats) => void;
	onUpdated?: (album: AlbumWithStats) => void;
	onReset?: () => void;
	onPreview?: (formData: FormData) => void;
}

// Interfaz para los datos del formulario
interface FormData {
	name: string;
	description: string;
	emoji: string;
	color: string;
	category: string;
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
		color: '#3b82f6',
		category: '',
	});

	// Actualizar formulario con datos del álbum cuando se está editando
	useEffect(() => {
		if (album && isEditing) {
			setFormData({
				name: album.name,
				description: album.description || '',
				emoji: album.emoji || '📔',
				color: album.color || '#3b82f6',
				category: album.category || '',
			});
		} else if (!isEditing) {
			setFormData({
				name: '',
				description: '',
				emoji: '📔',
				color: '#3b82f6',
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
			newErrors.name = 'El nombre es requerido';
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
					toastService.system.success('Álbum actualizado correctamente');
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
						color: '#3b82f6',
						category: '',
					});
					toastService.system.success('Álbum creado correctamente');
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.system.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el álbum`, {
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
			color: '#3b82f6',
			category: '',
		});
		setErrors({});
		if (onReset) {
			onReset();
		}
	}, [onReset]);

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{/* Nombre */}
			<div>
				<Label htmlFor="name" className="text-sm font-medium">
					Nombre *
				</Label>
				<Input
					id="name"
					type="text"
					placeholder="Nombre del álbum..."
					value={formData.name}
					onChange={(e) => handleChange('name', e.target.value)}
					className={errors.name ? 'border-red-500' : ''}
				/>
				{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
			</div>

			{/* Descripción */}
			<div>
				<Label htmlFor="description" className="text-sm font-medium">
					Descripción
				</Label>
				<Textarea
					id="description"
					placeholder="Descripción opcional..."
					value={formData.description}
					onChange={(e) => handleChange('description', e.target.value)}
					rows={3}
				/>
			</div>

			{/* Emoji */}
			<div>
				<Label htmlFor="emoji" className="text-sm font-medium">
					Emoji
				</Label>
				<div className="flex items-center gap-2">
					<span className="text-2xl">{formData.emoji}</span>
					<Input
						id="emoji"
						type="text"
						placeholder="📔"
						value={formData.emoji}
						onChange={(e) => handleChange('emoji', e.target.value)}
						className="w-20"
					/>
				</div>
			</div>

			{/* Color */}
			<div>
				<Label htmlFor="color" className="text-sm font-medium">
					Color
				</Label>
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded border-2 border-gray-300" style={{ backgroundColor: formData.color }} />
					<Input
						id="color"
						type="color"
						value={formData.color}
						onChange={(e) => handleChange('color', e.target.value)}
						className="w-20"
					/>
				</div>
			</div>

			{/* Categoría */}
			<div>
				<Label htmlFor="category" className="text-sm font-medium">
					Categoría
				</Label>
				<Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar categoría..." />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="personal">Personal</SelectItem>
						<SelectItem value="trabajo">Trabajo</SelectItem>
						<SelectItem value="hobbies">Hobbies</SelectItem>
						<SelectItem value="viajes">Viajes</SelectItem>
						<SelectItem value="familia">Familia</SelectItem>
						<SelectItem value="arte">Arte</SelectItem>
						<SelectItem value="naturaleza">Naturaleza</SelectItem>
						<SelectItem value="arquitectura">Arquitectura</SelectItem>
						<SelectItem value="eventos">Eventos</SelectItem>
						<SelectItem value="colecciones">Colecciones</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Botones */}
			<div className="flex justify-end gap-2 pt-4">
				<Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
					<X className="h-4 w-4 mr-2" />
					Cancelar
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
					{isEditing ? 'Actualizar' : 'Crear'} álbum
				</Button>
			</div>
		</form>
	);
}
