'use client';

import { createConcept, updateConcept } from '@/app/actions/concepts/concept.actions';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import toastService from '@/services/toast';
import type { ConceptComplete, ConceptCreateInput, ConceptExtended, ConceptUpdateInput } from '@/types/entities/concept';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DynamicCreateForm } from '../common/dynamic-create-form';

// Esquema de validación con Zod
const conceptSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
	description: z.string().optional(),
	content: z.string().optional(),
	color: z.string().min(1, 'El color es requerido'),
	emoji: z.string().min(1, 'El emoji es requerido'),
	category: z.string().optional(),
	isFavorite: z.boolean().default(false),
});

type ConceptForm = z.infer<typeof conceptSchema>;

interface CreateConceptFormProps {
	concept?: ConceptExtended | null;
	isEditing?: boolean;
	onCreated?: (concept: ConceptComplete) => void;
	onUpdated?: (concept: ConceptComplete) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
}

export function CreateConceptForm({
	concept,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview,
}: CreateConceptFormProps) {
	const [_isSubmitting, setIsSubmitting] = useState(false);

	// Configurar react-hook-form
	const form = useForm<ConceptForm>({
		resolver: zodResolver(conceptSchema),
		defaultValues: {
			name: '',
			description: '',
			content: '',
			color: '#3b82f6',
			emoji: '💡',
			category: 'general',
			isFavorite: false,
		},
	});

	// Actualizar vista previa en tiempo real
	useEffect(() => {
		if (onPreview) {
			const subscription = form.watch((data) => {
				onPreview(data);
			});
			return () => subscription.unsubscribe();
		}
	}, [form, onPreview]);

	// Cargar datos iniciales si estamos editando
	useEffect(() => {
		if (concept && isEditing) {
			form.reset({
				name: concept.name,
				description: concept.description || '',
				content: concept.content || '',
				color: concept.color || '#3b82f6',
				emoji: concept.emoji || '💡',
				category: concept.category || 'general',
				isFavorite: concept.isFavorite || false,
			});
		}
	}, [concept, isEditing, form]);

	// Manejar envío del formulario
	const _onSubmit = async (data: ConceptForm) => {
		try {
			setIsSubmitting(true);

			if (isEditing && concept) {
				// Actualizar concepto existente con el ID
				const updatedConcept = await updateConcept(concept.id, {
					...data,
					content: data.content || '',
				} as ConceptUpdateInput);
				if (onUpdated) {
					onUpdated(updatedConcept);
				}
				toastService.success('Concepto actualizado correctamente');
			} else {
				// Crear nuevo concepto
				const newConcept = await createConcept({
					...data,
					content: data.content || '',
				} as ConceptCreateInput);
				if (onCreated) {
					onCreated(newConcept);
				}
				form.reset(); // Limpiar formulario después de crear
				toastService.success('Concepto creado correctamente');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(isEditing ? 'Error al actualizar el concepto' : 'Error al crear el concepto', {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const optionalFields = [
		{
			name: 'emoji',
			label: 'Emoji',
			render: ({ value, onChange }: any) => (
				<EmojiPicker value={value} onEmojiSelect={onChange} compact showLabel={false} />
			),
		},
		{
			name: 'color',
			label: 'Color',
			render: ({ value, onChange }: any) => <ColorPicker value={value} onChange={onChange} compact showLabel={false} />,
		},
		{
			name: 'description',
			label: 'Descripción',
			render: ({ value, onChange }: any) => (
				<textarea
					placeholder="Descripción del concepto..."
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					rows={3}
					className="text-xs resize-none w-full border rounded p-2"
				/>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	];

	return (
		<DynamicCreateForm
			optionalFields={optionalFields}
			onSubmit={_onSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear concepto'}
		/>
	);
}
