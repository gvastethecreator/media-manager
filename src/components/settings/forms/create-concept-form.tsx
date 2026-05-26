import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { useCreateConcept, useUpdateConcept } from '@/lib/api/concepts';
import { DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';
import { toastService } from '@/lib/ui/toast';
import type { ConceptBase } from '@/types/entities/concept/base';
import type {
	ConceptCreateInput,
	ConceptExtended,
	ConceptUpdateInput,
	ConceptWithStats,
} from '@/types/entities/concept/types';
import { DynamicCreateForm } from '../common/dynamic-create-form';

// Esquema de validación con Zod
const conceptSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
	description: z.string().optional(),
	content: z.string().optional(),
	color: z.string().min(1, 'El color es requerido'),
	emoji: z.string().min(1, 'El emoji es requerido'),
	category: z.string().optional(),
});

type ConceptForm = z.infer<typeof conceptSchema>;

interface CreateConceptFormProps {
	concept?: ConceptExtended | null;
	isEditing?: boolean;
	onCancel?: () => void;
	onCreated?: (concept: ConceptWithStats) => void;
	onPreview?: (data: any) => void;
	onUpdated?: (concept: ConceptWithStats) => void;
}

export function CreateConceptForm({
	concept,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel: _onCancel,
	onPreview,
}: CreateConceptFormProps) {
	const [_isSubmitting, setIsSubmitting] = useState(false);

	// React Query hooks
	const createConceptMutation = useCreateConcept();
	const updateConceptMutation = useUpdateConcept();

	// Configurar react-hook-form
	const form = useForm<ConceptForm>({
		resolver: zodResolver(conceptSchema),
		defaultValues: {
			name: '',
			description: '',
			content: '',
			color: DEFAULT_ENTITY_COLOR,
			emoji: '💡',
			category: 'general',
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
				name: (concept as ConceptBase).name,
				description: (concept as ConceptBase).description || '',
				content: (concept as ConceptBase).content || '',
				color: (concept as ConceptBase).color || DEFAULT_ENTITY_COLOR,
				emoji: (concept as ConceptBase).emoji || '💡',
				category: (concept as ConceptBase).category || 'general',
			});
		}
	}, [concept, isEditing, form]);

	// Manejar envío del formulario
	const _onSubmit = async (data: ConceptForm) => {
		try {
			setIsSubmitting(true);

			if (isEditing && concept) {
				// Actualizar concepto existente con el ID
				const updateData: ConceptUpdateInput = {
					...data,
					content: data.content || '',
				};
				const updatedConcept = await updateConceptMutation.mutateAsync({
					id: (concept as ConceptBase).id,
					data: updateData,
				});
				if (onUpdated) {
					onUpdated(updatedConcept);
				}
				toastService.success('Concepto actualizado correctamente');
			} else {
				// Crear nuevo concepto
				const createData: ConceptCreateInput = {
					...data,
					content: data.content || '',
				};
				const newConcept = await createConceptMutation.mutateAsync(createData);
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
			name: 'content',
			label: 'Contenido',
			render: ({ value, onChange }: any) => (
				<textarea
					className="w-full resize-none rounded border border-input bg-background p-2 text-foreground text-xs"
					onChange={(e) => onChange(e.target.value)}
					placeholder="Contenido del concepto..."
					rows={4}
					value={value || ''}
				/>
			),
		},
		{
			name: 'emoji',
			label: 'Emoji',
			render: ({ value, onChange }: any) => (
				<EmojiPicker compact onEmojiSelect={onChange} showLabel={false} value={value} />
			),
		},
		{
			name: 'color',
			label: 'Color',
			render: ({ value, onChange }: any) => <ColorPicker compact onChange={onChange} showLabel={false} value={value} />,
		},
		{
			name: 'description',
			label: 'Descripción',
			render: ({ value, onChange }: any) => (
				<textarea
					className="w-full resize-none rounded border border-input bg-background p-2 text-foreground text-xs"
					onChange={(e) => onChange(e.target.value)}
					placeholder="Descripción del concepto..."
					rows={3}
					value={value || ''}
				/>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	];

	return (
		<DynamicCreateForm
			initialData={{
				name: concept?.name || '',
				content: concept?.content || '',
				description: concept?.description || '',
				color: concept?.color || DEFAULT_ENTITY_COLOR,
				emoji: concept?.emoji || '💡',
				category: concept?.category || 'general',
			}}
			onCancel={_onCancel}
			onSubmit={_onSubmit}
			optionalFields={optionalFields}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear concepto'}
		/>
	);
}
