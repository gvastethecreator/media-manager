import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePrompt, useUpdatePrompt } from '@/lib/api/prompts';
import { clientLogger } from '@/lib/logger/client-logger';
import { DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';
import { toastService } from '@/lib/ui/toast';
import type { PromptBase } from '@/types/entities/prompt/base';
import { PromptCategory, PromptModel } from '@/types/entities/prompt/enums';
import { DynamicCreateForm } from '../common/dynamic-create-form';

// Función para formatear los nombres de modelos para mostrar
const _formatModelName = (model: string): string => {
	// Eliminar prefijos y guiones, convertir a Title Case
	return model
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
};

// Esquema de validación con Zod
const promptSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
	description: z.string().optional(),
	content: z.string().min(1, 'El contenido es requerido'),
	color: z.string().min(1, 'El color es requerido'),
	emoji: z.string().min(1, 'El emoji es requerido'),
	category: z.nativeEnum(PromptCategory).optional(),
	model: z.nativeEnum(PromptModel).optional(),
	parameters: z.string().optional(),
	isFavorite: z.boolean().optional(),
});

type PromptForm = z.infer<typeof promptSchema>;

interface CreatePromptFormProps {
	isEditing?: boolean;
	onCancel?: () => void;
	onCreated?: (prompt: PromptBase) => void;
	onPreview?: (data: any) => void;
	onUpdated?: (prompt: PromptBase) => void;
	prompt?: PromptBase | null;
}

export function CreatePromptForm({
	prompt,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel: _onCancel,
	onPreview,
}: CreatePromptFormProps) {
	// React Query mutations
	const createPromptMutation = useCreatePrompt();
	const updatePromptMutation = useUpdatePrompt();

	const [_isSubmitting, setIsSubmitting] = useState(false);

	// Configurar react-hook-form
	const form = useForm<PromptForm>({
		resolver: zodResolver(promptSchema),
		defaultValues: {
			name: '',
			description: '',
			content: '',
			color: DEFAULT_ENTITY_COLOR,
			emoji: '💬',
			category: undefined,
			model: undefined,
			parameters: '{}',
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
		if (prompt && isEditing) {
			form.reset({
				name: prompt.name,
				description: prompt.description || '',
				content: prompt.content || '',
				color: prompt.color || DEFAULT_ENTITY_COLOR,
				emoji: prompt.emoji || '💬',
				category: prompt.category as PromptCategory | undefined,
				parameters: prompt.parameters || '{}',
				isFavorite: prompt.isFavorite,
			});
		}
	}, [prompt, isEditing, form]);

	// Manejar envío del formulario
	const _onSubmit = async (data: PromptForm) => {
		try {
			setIsSubmitting(true);

			if (isEditing && prompt) {
				// Actualizar prompt existente
				const updatedPrompt = await updatePromptMutation.mutateAsync({
					id: prompt.id,
					data,
				});
				if (onUpdated) {
					onUpdated(updatedPrompt as PromptBase);
				}
				toastService.success('Prompt actualizado correctamente');
			} else {
				// Crear nuevo prompt
				const newPrompt = await createPromptMutation.mutateAsync(data);
				if (onCreated) {
					onCreated(newPrompt as PromptBase);
				}
				form.reset(); // Limpiar formulario después de crear
				toastService.success('Prompt creado correctamente');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(isEditing ? 'Error al actualizar el prompt' : 'Error al crear el prompt', {
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
					placeholder="Contenido del prompt..."
					rows={5}
					value={value || ''}
				/>
			),
		},
		{
			name: 'emoji',
			label: 'Emoji',
			render: ({ value, onChange }: any) => <EmojiPicker onEmojiSelect={onChange} value={value} />,
		},
		{
			name: 'color',
			label: 'Color',
			render: ({ value, onChange }: any) => <ColorPicker onChange={onChange} value={value} />,
		},
		{
			name: 'description',
			label: 'Descripción',
			render: ({ value, onChange }: any) => (
				<textarea
					className="w-full resize-none rounded border border-input bg-background p-2 text-foreground text-xs"
					onChange={(e) => onChange(e.target.value)}
					placeholder="Descripción del prompt..."
					rows={3}
					value={value || ''}
				/>
			),
		},
		{
			name: 'category',
			label: 'Categoría',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar categoría" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="general">General</SelectItem>
						<SelectItem value="creatividad">Creatividad</SelectItem>
						<SelectItem value="análisis">Análisis</SelectItem>
					</SelectContent>
				</Select>
			),
		},
		{
			name: 'model',
			label: 'Modelo',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar modelo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
						<SelectItem value="gpt-4">gpt-4</SelectItem>
					</SelectContent>
				</Select>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	];

	return (
		<DynamicCreateForm
			alwaysVisibleFields={['content']}
			extraValidation={(data) => {
				if (!data.content || String(data.content).trim().length === 0) {
					return 'El contenido es obligatorio';
				}

				return null;
			}}
			initialData={{
				name: prompt?.name || '',
				content: prompt?.content || '',
				description: prompt?.description || '',
				color: prompt?.color || DEFAULT_ENTITY_COLOR,
				emoji: prompt?.emoji || '💬',
				category: prompt?.category,
				model: prompt?.model,
				parameters: prompt?.parameters || '{}',
				isFavorite: prompt?.isFavorite || false,
			}}
			onCancel={_onCancel}
			onSubmit={_onSubmit as any}
			optionalFields={optionalFields}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear prompt'}
		/>
	);
}
