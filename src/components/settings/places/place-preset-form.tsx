/**
 * @file Formulario de lugares con sistema de presets
 * @module components/settings/places/place-preset-form
 */

import { useState } from 'react';
import { PresetForm } from '@/components/settings/common/preset-form';
import { useCreatePlace, useUpdatePlace } from '@/lib/api/places';
import { toastService } from '@/lib/ui/toast';
import type { PlaceWithStats } from '@/types/entities/place/types';

interface PlacePresetFormProps {
	place?: PlaceWithStats | null;
	isEditing?: boolean;
	onCreated?: (place: PlaceWithStats) => void;
	onUpdated?: (place: PlaceWithStats) => void;
	onCancel?: () => void;
}

export function PlacePresetForm({
	place,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: PlacePresetFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createPlaceMutation = useCreatePlace();
	const updatePlaceMutation = useUpdatePlace();

	const initialData = isEditing && place ? {
		name: place.name,
		description: place.description,
		emoji: place.emoji,
		color: place.color,
		type: place.type,
		location: place.location,
		climate: place.climate,
		population: place.population,
		history: place.history,
		landmarks: place.landmarks,
		dangers: place.dangers,
		notes: place.notes,
		isFavorite: place.isFavorite,
	} : undefined;

	const handleSubmit = async (data: any) => {
		try {
			setIsSubmitting(true);

			const placeData = {
				name: data.name,
				description: data.description || null,
				emoji: data.emoji || '📍',
				color: data.color || '#ef4444',
				type: data.type || null,
				location: data.location || null,
				climate: data.climate || null,
				population: data.population || null,
				history: data.history || null,
				landmarks: data.landmarks || null,
				dangers: data.dangers || null,
				notes: data.notes || null,
				isFavorite: data.isFavorite || false,
				totalImages: 0,
				totalVideos: 0,
				featuredImage: null,
				parentId: null,
			};

			if (isEditing && place) {
				const updated = await updatePlaceMutation.mutateAsync({
					id: place.id,
					data: placeData,
				});
				toastService.success('Lugar actualizado correctamente');
				onUpdated?.(updated);
			} else {
				const created = await createPlaceMutation.mutateAsync(placeData);
				toastService.success('Lugar creado correctamente');
				onCreated?.(created);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el lugar`, {
				description: errorMessage,
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PresetForm
			entityType="place"
			onSubmit={handleSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear lugar'}
			onCancel={onCancel}
			initialData={initialData}
			isEditing={isEditing}
		/>
	);
}
