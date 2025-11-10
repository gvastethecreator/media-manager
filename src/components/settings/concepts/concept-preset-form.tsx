/**
 * @file Formulario de conceptos con sistema de presets
 * @module components/settings/concepts/concept-preset-form
 */

import { useState } from 'react';
import { PresetForm } from '@/components/settings/common/preset-form';
import { useCreateConcept, useUpdateConcept } from '@/lib/api/concepts';
import { toastService } from '@/lib/ui/toast';
import type { ConceptWithStats } from '@/types/entities/concept/types';

interface ConceptPresetFormProps {
	concept?: ConceptWithStats | null;
	isEditing?: boolean;
	onCreated?: (concept: ConceptWithStats) => void;
	onUpdated?: (concept: ConceptWithStats) => void;
	onCancel?: () => void;
}

export function ConceptPresetForm({
	concept,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: ConceptPresetFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createConceptMutation = useCreateConcept();
	const updateConceptMutation = useUpdateConcept();

	const initialData = isEditing && concept ? {
		name: concept.name,
		description: concept.description,
		emoji: concept.emoji,
		color: concept.color,
		category: concept.category,
		content: concept.content, // Cambiado de definition a content
		examples: concept.examples,
		relatedConcepts: concept.relatedConcepts,
		notes: concept.notes,
		isFavorite: concept.isFavorite,
	} : undefined;

	const handleSubmit = async (data: any) => {
		try {
			setIsSubmitting(true);

			const conceptData = {
				name: data.name,
				description: data.description || null,
				emoji: data.emoji || '💡',
				color: data.color || '#8b5cf6',
				category: data.category || null,
				content: data.content || data.definition || '', // Usar content, con fallback a definition y string vacío
				examples: data.examples || null,
				relatedConcepts: data.relatedConcepts || null,
				notes: data.notes || null,
				isFavorite: data.isFavorite || false,
				totalImages: 0,
				totalVideos: 0,
				featuredImage: null,
				parentId: null,
			};

			if (isEditing && concept) {
				const updated = await updateConceptMutation.mutateAsync({
					id: concept.id,
					data: conceptData,
				});
				toastService.success('Concepto actualizado correctamente');
				onUpdated?.(updated);
			} else {
				const created = await createConceptMutation.mutateAsync(conceptData);
				toastService.success('Concepto creado correctamente');
				onCreated?.(created);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el concepto`, {
				description: errorMessage,
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PresetForm
			entityType="concept"
			onSubmit={handleSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear concepto'}
			onCancel={onCancel}
			initialData={initialData}
			isEditing={isEditing}
		/>
	);
}
