/**
 * @file Formulario de etiquetas con sistema de presets
 * @module components/settings/tags/tag-preset-form
 */

import { useState } from 'react';
import { PresetForm } from '@/components/settings/common/preset-form';
import { useCreateTag, useUpdateTag } from '@/lib/api/tags';
import { toastService } from '@/lib/ui/toast';
import type { TagWithStats } from '@/types/entities/tag/types';

interface TagPresetFormProps {
	tag?: TagWithStats | null;
	isEditing?: boolean;
	onCreated?: (tag: TagWithStats) => void;
	onUpdated?: (tag: TagWithStats) => void;
	onCancel?: () => void;
}

export function TagPresetForm({
	tag,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: TagPresetFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createTagMutation = useCreateTag();
	const updateTagMutation = useUpdateTag();

	const initialData = isEditing && tag ? {
		name: tag.name,
		description: tag.description,
		emoji: tag.emoji,
		color: tag.color,
		isFavorite: tag.isFavorite,
	} : undefined;

	const handleSubmit = async (data: any) => {
		try {
			setIsSubmitting(true);

			const tagData = {
				name: data.name,
				description: data.description || null,
				emoji: data.emoji || '🏷️',
				color: data.color || '#06b6d4',
				isFavorite: data.isFavorite || false,
			};

			if (isEditing && tag) {
				const updated = await updateTagMutation.mutateAsync({
					id: tag.id,
					data: tagData,
				});
				toastService.success('Etiqueta actualizada correctamente');
				onUpdated?.(updated);
			} else {
				const created = await createTagMutation.mutateAsync(tagData);
				toastService.success('Etiqueta creada correctamente');
				onCreated?.(created);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} la etiqueta`, {
				description: errorMessage,
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PresetForm
			entityType="tag"
			onSubmit={handleSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear etiqueta'}
			onCancel={onCancel}
			initialData={initialData}
			isEditing={isEditing}
		/>
	);
}
