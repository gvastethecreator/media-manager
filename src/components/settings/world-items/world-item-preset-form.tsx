/**
 * @file Formulario de elementos del mundo con sistema de presets
 * @module components/settings/world-items/world-item-preset-form
 */

import { useState } from 'react';
import { PresetForm } from '@/components/settings/common/preset-form';
import { useCreateWorldItem, useUpdateWorldItem } from '@/lib/api/world-items';
import { toastService } from '@/lib/ui/toast';
import type { WorldItemWithStats } from '@/types/entities/world-item/types';

interface WorldItemPresetFormProps {
	worldItem?: WorldItemWithStats | null;
	isEditing?: boolean;
	onCreated?: (worldItem: WorldItemWithStats) => void;
	onUpdated?: (worldItem: WorldItemWithStats) => void;
	onCancel?: () => void;
}

export function WorldItemPresetForm({
	worldItem,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: WorldItemPresetFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createWorldItemMutation = useCreateWorldItem();
	const updateWorldItemMutation = useUpdateWorldItem();

	const initialData = isEditing && worldItem ? {
		name: worldItem.name,
		description: worldItem.description,
		emoji: worldItem.emoji,
		color: worldItem.color,
		type: worldItem.type,
		properties: worldItem.properties,
		value: worldItem.value,
		rarity: worldItem.rarity,
		origin: worldItem.origin,
		effects: worldItem.effects,
		notes: worldItem.notes,
		isFavorite: worldItem.isFavorite,
	} : undefined;

	const handleSubmit = async (data: any) => {
		try {
			setIsSubmitting(true);

			const worldItemData = {
				name: data.name,
				description: data.description || null,
				emoji: data.emoji || '🌍',
				color: data.color || '#10b981',
				type: data.type || null,
				properties: data.properties || null,
				value: data.value || null,
				rarity: data.rarity || null,
				origin: data.origin || null,
				effects: data.effects || null,
				notes: data.notes || null,
				isFavorite: data.isFavorite || false,
				totalImages: 0,
				totalVideos: 0,
				featuredImage: null,
				parentId: null,
			};

			if (isEditing && worldItem) {
				const updated = await updateWorldItemMutation.mutateAsync({
					id: worldItem.id,
					data: worldItemData,
				});
				toastService.success('Elemento del mundo actualizado correctamente');
				onUpdated?.(updated);
			} else {
				const created = await createWorldItemMutation.mutateAsync(worldItemData);
				toastService.success('Elemento del mundo creado correctamente');
				onCreated?.(created);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el elemento del mundo`, {
				description: errorMessage,
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PresetForm
			entityType="world-item"
			onSubmit={handleSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear elemento del mundo'}
			onCancel={onCancel}
			initialData={initialData}
			isEditing={isEditing}
		/>
	);
}
