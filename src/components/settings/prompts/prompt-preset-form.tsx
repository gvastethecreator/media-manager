/**
 * @file Formulario de prompts con sistema de presets
 * @module components/settings/prompts/prompt-preset-form
 */

import { useState } from 'react';
import { PresetForm } from '@/components/settings/common/preset-form';
import { useCreatePrompt, useUpdatePrompt } from '@/lib/api/prompts';
import { toastService } from '@/lib/ui/toast';
import type { PromptWithStats } from '@/types/entities/prompt/types';

interface PromptPresetFormProps {
	prompt?: PromptWithStats | null;
	isEditing?: boolean;
	onCreated?: (prompt: PromptWithStats) => void;
	onUpdated?: (prompt: PromptWithStats) => void;
	onCancel?: () => void;
}

export function PromptPresetForm({
	prompt,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: PromptPresetFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createPromptMutation = useCreatePrompt();
	const updatePromptMutation = useUpdatePrompt();

	const initialData = isEditing && prompt ? {
		name: prompt.name,
		description: prompt.description,
		emoji: prompt.emoji,
		color: prompt.color,
		content: prompt.content,
		category: prompt.category,
		model: prompt.model,
		parameters: prompt.parameters,
		isFavorite: prompt.isFavorite,
	} : undefined;

	const handleSubmit = async (data: any) => {
		try {
			setIsSubmitting(true);

			const promptData = {
				name: data.name,
				description: data.description || null,
				emoji: data.emoji || '📝',
				color: data.color || '#f59e0b',
				content: data.content || '',
				category: data.category || null,
				model: data.model || null,
				parameters: data.parameters || null,
				isFavorite: data.isFavorite || false,
				totalImages: 0,
				totalVideos: 0,
				featuredImage: null,
				parentId: null,
			};

			if (isEditing && prompt) {
				const updated = await updatePromptMutation.mutateAsync({
					id: prompt.id,
					data: promptData,
				});
				toastService.success('Prompt actualizado correctamente');
				onUpdated?.(updated);
			} else {
				const created = await createPromptMutation.mutateAsync(promptData);
				toastService.success('Prompt creado correctamente');
				onCreated?.(created);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el prompt`, {
				description: errorMessage,
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PresetForm
			entityType="prompt"
			onSubmit={handleSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear prompt'}
			onCancel={onCancel}
			initialData={initialData}
			isEditing={isEditing}
		/>
	);
}
