/**
 * @file Formulario de colecciones con sistema de presets
 * @module components/settings/collections/collection-preset-form
 */

import { useState } from 'react';
import { PresetForm } from '@/components/settings/common/preset-form';
import { useCreateCollection, useUpdateCollection } from '@/lib/api/collections';
import { toastService } from '@/lib/ui/toast';
import type { CollectionWithStats } from '@/types/entities/collection';

interface CollectionPresetFormProps {
	collection?: CollectionWithStats | null;
	isEditing?: boolean;
	onCreated?: (collection: CollectionWithStats) => void;
	onUpdated?: (collection: CollectionWithStats) => void;
	onCancel?: () => void;
}

export function CollectionPresetForm({
	collection,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: CollectionPresetFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createCollectionMutation = useCreateCollection();
	const updateCollectionMutation = useUpdateCollection();

	const initialData = isEditing && collection ? {
		name: collection.name,
		description: collection.description,
		emoji: collection.emoji,
		color: collection.color,
		isFavorite: collection.isFavorite,
	} : undefined;

	const handleSubmit = async (data: any) => {
		try {
			setIsSubmitting(true);

			const collectionData = {
				name: data.name,
				description: data.description || null,
				emoji: data.emoji || '📦',
				color: data.color || '#8b5cf6',
				isFavorite: data.isFavorite || false,
			};

			if (isEditing && collection) {
				const updated = await updateCollectionMutation.mutateAsync({
					id: collection.id,
					data: collectionData,
				});
				toastService.success('Colección actualizada correctamente');
				onUpdated?.(updated);
			} else {
				const created = await createCollectionMutation.mutateAsync(collectionData);
				toastService.success('Colección creada correctamente');
				onCreated?.(created);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} la colección`, {
				description: errorMessage,
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PresetForm
			entityType="collection"
			onSubmit={handleSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear colección'}
			onCancel={onCancel}
			initialData={initialData}
			isEditing={isEditing}
		/>
	);
}
